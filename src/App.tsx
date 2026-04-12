import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, useAuthState } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import AppHome from "./pages/AppHome";
import Player from "./pages/Player";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthState();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse-soft text-muted-foreground">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthState();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboarding_complete) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

const App = () => {
  const authState = useAuthState();

  return (
    <AuthContext.Provider value={authState}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
              <Route path="/app" element={<ProtectedRoute><AppHome /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/b/:briefingId" element={<Player />} />
              <Route path="/player/:id" element={<Player />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
};

export default App;
