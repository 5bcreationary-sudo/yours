import { useQuery } from "@tanstack/react-query";
import { fetchCalendarToday, fetchGmailHighlights, listSources } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const FIVE_MIN = 5 * 60 * 1000;

function useSources() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sources", user?.id],
    queryFn: () => listSources(user!.id),
    enabled: !!user,
  });
}

export function useGmailHighlights() {
  const { user } = useAuth();
  const { data: sources = [] } = useSources();
  const gmailConnected = sources.some((s) => s.type === "gmail" && s.enabled);
  return useQuery({
    queryKey: ["gmail-highlights", user?.id],
    queryFn: fetchGmailHighlights,
    enabled: !!user && gmailConnected,
    staleTime: FIVE_MIN,
    retry: 1,
  });
}

export function useCalendarToday() {
  const { user } = useAuth();
  const { data: sources = [] } = useSources();
  const calendarConnected = sources.some((s) => s.type === "calendar" && s.enabled);
  return useQuery({
    queryKey: ["calendar-today", user?.id],
    queryFn: fetchCalendarToday,
    enabled: !!user && calendarConnected,
    staleTime: FIVE_MIN,
    retry: 1,
  });
}

export function useGoogleConnections() {
  const { data: sources = [] } = useSources();
  return {
    gmailConnected: sources.some((s) => s.type === "gmail" && s.enabled),
    calendarConnected: sources.some((s) => s.type === "calendar" && s.enabled),
  };
}
