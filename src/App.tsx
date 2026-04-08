import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import Landing from "./pages/Landing";
import IntelFeed from "./pages/IntelFeed";
import Chat from "./pages/Chat";
import Playbooks from "./pages/Playbooks";
import Competitors from "./pages/Competitors";
import WinLoss from "./pages/WinLoss";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();

const App = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleOnboardingComplete = () => {
    localStorage.setItem("hugo_onboarding_complete", "true");
    setShowOnboarding(false);
  };

  const triggerOnboarding = () => {
    setShowOnboarding(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatePresence>
            {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}
          </AnimatePresence>
          <Routes>
            <Route path="/" element={<Landing onStartTrial={triggerOnboarding} />} />
            <Route
              path="/*"
              element={
                <AppLayout>
                  <Routes>
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/dashboard" element={<WinLoss />} />
                    <Route path="/intel" element={<IntelFeed />} />
                    <Route path="/playbooks" element={<Playbooks />} />
                    <Route path="/competitors" element={<Competitors />} />
                    <Route path="/integrations" element={<Integrations />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
