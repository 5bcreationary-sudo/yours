// Minimal RSS/Atom parser. Deno doesn't ship a full feed parser, so we do
// a narrow regex extract of <item>/<entry> + title/link/description/pubDate.
// Good enough for Yours — we only need title + link + summary + recency.

import { withTimeout, logInfo } from "./errors.ts";

export interface RssItem {
  title: string;
  link: string;
  summary: string;
  publishedAt: Date | null;
  source: string;
}

function stripTags(html: string): string {
  return html
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function matchOne(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? stripTags(m[1]) : "";
}

function matchAttr(block: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*/??>`, "i");
  const m = block.match(re);
  return m ? m[1] : "";
}

function parseFeed(xml: string, sourceName: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRe = /<(item|entry)\b[\s\S]*?<\/\1>/gi;
  for (const m of xml.matchAll(itemRe)) {
    const block = m[0];
    const title = matchOne(block, "title");
    const link = matchOne(block, "link") || matchAttr(block, "link", "href");
    const desc =
      matchOne(block, "description") ||
      matchOne(block, "summary") ||
      matchOne(block, "content:encoded") ||
      matchOne(block, "content");
    const dateStr =
      matchOne(block, "pubDate") || matchOne(block, "published") || matchOne(block, "updated");
    const d = dateStr ? new Date(dateStr) : null;
    if (title && link) {
      items.push({
        title,
        link,
        summary: desc.slice(0, 400),
        publishedAt: d && !isNaN(d.getTime()) ? d : null,
        source: sourceName,
      });
    }
  }
  return items;
}

export async function fetchRssFeeds(
  feeds: Array<{ url: string; name?: string }>,
  perFeedLimit = 8,
  timeoutMs = 8000,
): Promise<RssItem[]> {
  if (feeds.length === 0) return [];
  const results = await Promise.allSettled(
    feeds.map(async (f) => {
      try {
        const res = await withTimeout(
          fetch(f.url, { headers: { "user-agent": "YoursBot/1.0 (+https://yours.fm)" } }),
          timeoutMs,
          `rss ${f.url}`,
        );
        if (!res.ok) return [];
        const xml = await res.text();
        return parseFeed(xml, f.name ?? new URL(f.url).hostname).slice(0, perFeedLimit);
      } catch (err) {
        logInfo("rss.feed_error", { url: f.url, err: String(err) });
        return [];
      }
    }),
  );

  const all: RssItem[] = [];
  for (const r of results) if (r.status === "fulfilled") all.push(...r.value);

  // dedupe by normalized title
  const seen = new Set<string>();
  const unique: RssItem[] = [];
  for (const it of all) {
    const k = it.title.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(it);
  }

  unique.sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
  return unique.slice(0, 30);
}
