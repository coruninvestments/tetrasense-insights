import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import LogSession from "./pages/LogSession";
import Strains from "./pages/Strains";
import ProductLibrary from "./pages/ProductLibrary";
import StrainDetail from "./pages/StrainDetail";
import Learn from "./pages/Learn";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import CommunityExplore from "./pages/CommunityExplore";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import AdminCoa from "./pages/AdminCoa";
import FounderDashboard from "./pages/FounderDashboard";
import BestForYou from "./pages/BestForYou";
import SessionDetail from "./pages/SessionDetail";
import ConnoisseurLearning from "./pages/ConnoisseurLearning";
import CommunityInsights from "./pages/CommunityInsights";

const App = () => (
  <ThemeProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/log"
              element={
                <ProtectedRoute>
                  <LogSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/strains"
              element={
                <ProtectedRoute>
                  <Strains />
                </ProtectedRoute>
              }
            />
            <Route
              path="/library"
              element={
                <ProtectedRoute>
                  <ProductLibrary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/strains/:id"
              element={
                <ProtectedRoute>
                  <StrainDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learn"
              element={
                <ProtectedRoute>
                  <Learn />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learn/:id"
              element={
                <ProtectedRoute>
                  <Learn />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learn/connoisseur"
              element={
                <ProtectedRoute>
                  <ConnoisseurLearning />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights"
              element={
                <ProtectedRoute>
                  <Insights />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <CommunityExplore />
                </ProtectedRoute>
              }
            />
            <Route
              path="/community-insights"
              element={
                <ProtectedRoute>
                  <CommunityInsights />
                </ProtectedRoute>
              }
            />
            <Route
              path="/best"
              element={
                <ProtectedRoute>
                  <BestForYou />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/coa"
              element={
                <ProtectedRoute>
                  <AdminCoa />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/founder-dashboard"
              element={
                <ProtectedRoute>
                  <FounderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/session/:id"
              element={
                <ProtectedRoute>
                  <SessionDetail />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
