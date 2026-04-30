// Database types for Yours — matches the Supabase schema in supabase/migrations.
// After deploy, run `supabase gen types typescript` to diff against this file.

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone_e164: string | null;
  timezone: string;
  delivery_time: string; // HH:MM or HH:MM:SS from the time column
  preferred_length_minutes: number; // 3, 8, or 12
  tone: "upbeat" | "calm" | "professional";
  briefing_mode: "morning" | "commute" | "executive";
  briefing_style: "straightforward" | "conversational";
  onboarding_complete: boolean;
  evening_preference: boolean;
  home_address: Record<string, unknown> | null;
  work_address: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface UserInterest {
  id: string;
  user_id: string;
  freeform_text: string | null;
  selected_packages: string[];
  tags: string[];
  updated_at: string;
}

export interface UserSource {
  id: string;
  user_id: string;
  type: "gmail" | "calendar" | "rss";
  config: Record<string, unknown>;
  enabled: boolean;
  last_synced_at: string | null;
  created_at: string;
}

export interface Briefing {
  id: string;
  user_id: string;
  date: string;
  status: "pending" | "generating" | "ready" | "failed";
  listened_at: string | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  /** Per-section start times in seconds from t=0 of the audio file. Length
   *  matches sections.length when the TTS pipeline computed real offsets;
   *  null on legacy rows or when offsets weren't derivable. */
  section_offsets: number[] | null;
  error?: string | null;
  generation_started_at?: string | null;
  generation_completed_at?: string | null;
  created_at: string;
}

export type BriefingListItem = Briefing & {
  sections_count: number;
  preview_titles: string[];
};

// Player query result — sections are always joined in at the fetch layer.
export type BriefingWithSections = Briefing & { sections: BriefingSection[] };

export interface BriefingSection {
  id: string;
  briefing_id: string;
  type: "weather" | "traffic" | "calendar" | "emails" | "news" | "interests" | "sports" | "health" | "entertainment";
  title: string;
  summary: string;
  card_payload: Record<string, unknown> | null;
  order: number;
  duration_minutes: number;
}

// RSS source presets
export interface RSSPreset {
  id: string;
  name: string;
  url: string;
  category: string;
  icon: string;
}

export const RSS_PRESETS: RSSPreset[] = [
  { id: "cnn-top", name: "CNN Top Stories", url: "http://rss.cnn.com/rss/cnn_topstories.rss", category: "News", icon: "📰" },
  { id: "fox-us", name: "Fox News U.S.", url: "https://moxie.foxnews.com/google-publisher/us.xml", category: "News", icon: "🇺🇸" },
  { id: "npr-morning", name: "NPR Morning Edition", url: "https://feeds.npr.org/3/rss.xml", category: "News", icon: "🎙️" },
  { id: "nyt-top", name: "NYT Top Stories", url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", category: "News", icon: "📄" },
  { id: "bbc-world", name: "BBC World News", url: "http://feeds.bbci.co.uk/news/world/rss.xml", category: "News", icon: "🌍" },
  { id: "tc-ai", name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", category: "Tech", icon: "🤖" },
  { id: "hacker-news", name: "Hacker News", url: "https://hnrss.org/frontpage", category: "Tech", icon: "💻" },
  { id: "espn-top", name: "ESPN Top Headlines", url: "https://www.espn.com/espn/rss/news", category: "Sports", icon: "🏈" },
  { id: "wired", name: "Wired", url: "https://www.wired.com/feed/rss", category: "Tech", icon: "⚡" },
  { id: "google-news", name: "Google News", url: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en", category: "News", icon: "🔵" },
];

// Interest packages
export interface InterestPackage {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
}

export const INTEREST_PACKAGES: InterestPackage[] = [
  { id: "tech-ai", name: "AI & Tech", description: "AI startups, product launches, funding rounds", icon: "🤖", tags: ["artificial intelligence", "startups", "tech"] },
  { id: "sports-nfl", name: "NFL", description: "Scores, trades, draft picks, and analysis", icon: "🏈", tags: ["nfl", "football", "sports"] },
  { id: "sports-nba", name: "NBA", description: "Games, standings, and player news", icon: "🏀", tags: ["nba", "basketball", "sports"] },
  { id: "finance", name: "Markets & Finance", description: "Stock market, crypto, economic indicators", icon: "📈", tags: ["stocks", "crypto", "finance"] },
  { id: "health", name: "Health & Wellness", description: "Nutrition tips, fitness, mental health", icon: "🧘", tags: ["health", "fitness", "wellness"] },
  { id: "music-rock", name: "Rock & Alt", description: "Album drops, tours, festivals", icon: "🎸", tags: ["rock", "music", "concerts"] },
  { id: "world-news", name: "World News", description: "Global politics, international affairs", icon: "🌍", tags: ["world", "politics", "international"] },
  { id: "science", name: "Science", description: "Space, climate, breakthroughs", icon: "🔬", tags: ["science", "space", "climate"] },
  { id: "entertainment", name: "Entertainment", description: "Movies, TV, streaming, celebrity", icon: "🎬", tags: ["movies", "tv", "streaming"] },
  { id: "business", name: "Business", description: "Company news, leadership, strategy", icon: "💼", tags: ["business", "leadership", "strategy"] },
];
