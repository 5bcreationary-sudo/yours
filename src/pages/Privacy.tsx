import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 22, 2026</p>

        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-3">1. What Yours Is</h2>
            <p className="text-muted-foreground leading-relaxed">
              Yours ("we", "us", "our") is a personalized audio briefing service. We generate a short daily podcast
              tailored to your interests, calendar, email highlights, weather, and news sources. This policy explains
              what data we collect, why, and how we protect it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Information We Collect</h2>

            <h3 className="text-sm font-semibold mt-4 mb-2">Account information</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you sign up, we collect your email address and name. If you sign in with Google, we receive your
              Google profile information (name, email, profile picture).
            </p>

            <h3 className="text-sm font-semibold mt-4 mb-2">Preferences and interests</h3>
            <p className="text-muted-foreground leading-relaxed">
              You tell us your preferred briefing tone, length, delivery time, topics of interest, and RSS news sources.
              We store these to personalize your briefing.
            </p>

            <h3 className="text-sm font-semibold mt-4 mb-2">Location</h3>
            <p className="text-muted-foreground leading-relaxed">
              If you provide a city or zip code (or use browser geolocation), we store your approximate location to
              include local weather in your briefing. We do not track your location continuously.
            </p>

            <h3 className="text-sm font-semibold mt-4 mb-2">Google Gmail and Calendar data</h3>
            <p className="text-muted-foreground leading-relaxed">
              If you choose to connect Gmail and/or Google Calendar, we request read-only access
              (<code className="text-xs bg-secondary px-1 py-0.5 rounded">gmail.readonly</code> and{" "}
              <code className="text-xs bg-secondary px-1 py-0.5 rounded">calendar.readonly</code>).
              We use this data <strong>solely</strong> to generate your daily briefing:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 leading-relaxed">
              <li>Gmail: We fetch subject lines and snippets of recent emails from your primary inbox. We do not read full email bodies or store your emails.</li>
              <li>Calendar: We fetch today's event titles, times, and locations. We do not modify your calendar.</li>
              <li>This data is processed in memory to generate your briefing script, then discarded. It is not stored in our database, sold, or shared with third parties.</li>
              <li>Your Google refresh token is encrypted at rest using AES-256 and stored only to maintain your connection. You can disconnect at any time from Settings.</li>
            </ul>

            <h3 className="text-sm font-semibold mt-4 mb-2">Briefing audio and content</h3>
            <p className="text-muted-foreground leading-relaxed">
              We store the generated briefing audio files and section summaries so you can listen to past briefings.
              Audio files are stored in a private bucket and accessed via time-limited signed URLs.
            </p>

            <h3 className="text-sm font-semibold mt-4 mb-2">Usage data</h3>
            <p className="text-muted-foreground leading-relaxed">
              We collect basic usage data such as when you listen to a briefing and which sections you interact with.
              This helps us improve the product. We do not use third-party analytics trackers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 leading-relaxed">
              <li>To generate and deliver your personalized daily briefing</li>
              <li>To remember your preferences and connected accounts</li>
              <li>To provide weather for your location</li>
              <li>To improve the quality of the briefing over time</li>
              <li>To send you your briefing via SMS or email (if you opt in)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We do <strong>not</strong> sell, rent, or share your personal data with third parties for advertising or marketing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the following services to operate Yours:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 leading-relaxed">
              <li><strong>Supabase</strong> — authentication, database, file storage (hosted in the US)</li>
              <li><strong>Google Cloud</strong> — text-to-speech for audio generation, Gmail/Calendar APIs (with your consent)</li>
              <li><strong>Google Gemini / AI</strong> — to generate the briefing script from your data sources</li>
              <li><strong>National Weather Service API</strong> — weather data (no personal data sent, only coordinates)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Each service processes only the minimum data required. Your Gmail and Calendar data is sent to our AI
              provider only as summarized inputs (subject lines, event titles) to generate the briefing script — never
              as raw email content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Data Security</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 leading-relaxed">
              <li>All data is transmitted over HTTPS/TLS</li>
              <li>Google OAuth refresh tokens are encrypted with AES-256 before storage</li>
              <li>Database access is restricted by row-level security — you can only access your own data</li>
              <li>Audio files are served via time-limited signed URLs that expire</li>
              <li>We do not store passwords — authentication uses Google OAuth or magic links</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Your Rights and Controls</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 leading-relaxed">
              <li><strong>Disconnect Google:</strong> Revoke Gmail/Calendar access anytime from Settings. We immediately delete your stored tokens.</li>
              <li><strong>Delete your account:</strong> Contact us and we will delete all your data, including briefings, preferences, and tokens.</li>
              <li><strong>Export your data:</strong> You can request a copy of all data we hold about you.</li>
              <li><strong>Revoke Google access externally:</strong> You can also revoke Yours's access from your{" "}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2">Google Account permissions</a> page at any time.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your account data and preferences for as long as your account is active. Briefing audio files
              are retained for 90 days, then automatically deleted. If you delete your account, all associated data
              is removed within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Yours is not intended for children under 13. We do not knowingly collect information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this policy from time to time. If we make material changes, we will notify you via email
              or an in-app notice. Continued use of Yours after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions or requests? Email us at{" "}
              <a href="mailto:privacy@yours.fm" className="text-foreground underline underline-offset-2">privacy@yours.fm</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
