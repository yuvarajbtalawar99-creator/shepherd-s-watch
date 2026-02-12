import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import SheepList from "./pages/SheepList";
import SheepProfile from "./pages/SheepProfile";
import HerdingMode from "./pages/HerdingMode";
import BreedingIntelligence from "./pages/BreedingIntelligence";
import DailyTasks from "./pages/DailyTasks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sheep" element={<SheepList />} />
              <Route path="/sheep/:id" element={<SheepProfile />} />
              <Route path="/herding" element={<HerdingMode />} />
              <Route path="/breeding" element={<BreedingIntelligence />} />
              <Route path="/tasks" element={<DailyTasks />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
