import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LanguageProvider } from "./contexts/LanguageContext";
import Layout from "./components/layout/Layout";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages for performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SheepList = lazy(() => import("./pages/SheepList"));
const SheepProfile = lazy(() => import("./pages/SheepProfile"));
const HerdingMode = lazy(() => import("./pages/HerdingMode"));
const BreedingIntelligence = lazy(() => import("./pages/BreedingIntelligence"));
const DailyTasks = lazy(() => import("./pages/DailyTasks"));
const GeneticMatchmaker = lazy(() => import("./pages/GeneticMatchmaker"));
const Profile = lazy(() => import("./pages/Profile"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground animate-pulse">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatePresence mode="wait">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public route */}
                  <Route path="/auth" element={<Auth />} />

                  {/* Protected routes */}
                  <Route element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/sheep" element={<SheepList />} />
                    <Route path="/sheep/:id" element={<SheepProfile />} />
                    <Route path="/herding" element={<HerdingMode />} />
                    <Route path="/breeding" element={<BreedingIntelligence />} />
                    <Route path="/matchmaker" element={<GeneticMatchmaker />} />
                    <Route path="/tasks" element={<DailyTasks />} />
                    <Route path="/profile" element={<Profile />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AnimatePresence>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
