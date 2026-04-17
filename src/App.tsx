import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { PuppyProvider } from "@/hooks/usePuppy";
import FloatingPuppy from "@/components/mascot/FloatingPuppy";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Study from "./pages/Study";
import UploadNotes from "./pages/UploadNotes";
import Progress from "./pages/Progress";
import Rewards from "./pages/Rewards";
import SettingsPage from "./pages/SettingsPage";
import StudyHistory from "./pages/StudyHistory";
import Flashcards from "./pages/Flashcards";
import Quiz from "./pages/Quiz";

import Planner from "./pages/Planner";
import Syllabus from "./pages/Syllabus";

import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground text-lg">☕</span>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AuthRoute = () => {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <Auth />;
};

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PuppyProvider>
              <FloatingPuppy />
            <Routes>
              <Route path="/auth" element={<AuthRoute />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/study" element={<Study />} />
                <Route path="/study/:topic" element={<Study />} />
                <Route path="/upload" element={<UploadNotes />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/history" element={<StudyHistory />} />
                <Route path="/flashcards" element={<Flashcards />} />
                <Route path="/quiz" element={<Quiz />} />
                
                <Route path="/planner" element={<Planner />} />
                <Route path="/syllabus" element={<Syllabus />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            </PuppyProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
