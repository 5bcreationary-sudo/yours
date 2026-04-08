import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

/**
 * Hook to fork context from dashboard into a new Hugo chat.
 * Stores a prefill prompt in sessionStorage, then navigates to /chat.
 */
export function useChatFork() {
  const navigate = useNavigate();

  const forkToChat = useCallback((prompt: string) => {
    sessionStorage.setItem("hugo_chat_prefill", prompt);
    navigate("/chat");
  }, [navigate]);

  return { forkToChat };
}

/**
 * Retrieve and clear a prefilled chat prompt (called from Chat page).
 */
export function consumeChatPrefill(): string | null {
  const val = sessionStorage.getItem("hugo_chat_prefill");
  if (val) sessionStorage.removeItem("hugo_chat_prefill");
  return val;
}
