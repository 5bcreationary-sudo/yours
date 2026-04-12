// Supabase client setup for Yours
// TODO: Codex — replace with real Supabase credentials after enabling Lovable Cloud

// Placeholder — will be replaced when Lovable Cloud is enabled
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

// Mock auth state for development without Supabase
export const mockUser = {
  id: "mock-user-id",
  email: "demo@yours.fm",
  full_name: "Demo User",
};

// TODO: Codex — uncomment and use real Supabase client:
// import { createClient } from "@supabase/supabase-js";
// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Placeholder Edge Function stubs
// TODO: Codex — implement these as real Supabase Edge Functions

/**
 * generateBriefingScript()
 * Fetches weather, calendar, emails, RSS feeds, user interests
 * Uses OpenAI/Claude to generate a structured briefing script
 * Returns: BriefingSection[]
 */
export async function generateBriefingScript(_userId: string): Promise<void> {
  // TODO: Codex — implement briefing generation
  // 1. Fetch user profile + interests + sources
  // 2. Call OpenWeatherMap for weather
  // 3. Call Google Calendar API for today's events
  // 4. Fetch RSS feeds from user_sources
  // 5. Call OpenAI/Claude to generate conversational script
  // 6. Save to briefings table with sections
  console.log("generateBriefingScript stub called");
}

/**
 * generateBriefingAudio()
 * Takes a structured script and converts to audio using Fish Audio TTS
 * Uploads to Supabase Storage
 * Returns: audio URL
 */
export async function generateBriefingAudio(_briefingId: string): Promise<string> {
  // TODO: Codex — implement Fish Audio TTS
  // 1. Load briefing sections from DB
  // 2. Call Fish Audio SDK for each section
  // 3. Concatenate audio segments
  // 4. Upload to Supabase Storage bucket
  // 5. Return signed URL
  console.log("generateBriefingAudio stub called");
  return "";
}

/**
 * sendBriefingSMS()
 * Sends SMS via Twilio with briefing link
 */
export async function sendBriefingSMS(_userId: string, _briefingId: string): Promise<void> {
  // TODO: Codex — implement Twilio SMS
  // 1. Get user phone number
  // 2. Generate short link: yours.fm/b/{briefingId}
  // 3. Send via Twilio
  console.log("sendBriefingSMS stub called");
}
