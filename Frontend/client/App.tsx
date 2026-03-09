import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "@/components/layout/AppLayout";
import { MemoryProvider } from "@/data/memoryStore";
import Analytics from "./pages/Analytics";
import TodaysMood from "./pages/TodaysMood";

// --- NEW AUTH IMPORTS ---
import { AuthProvider } from "@/context/AuthContext"; 
import ProtectedRoute from "@/components/layout/ProtectedRoute"; 
import Login from "./pages/Login";
import { ThemeProvider } from "@/context/ThemeContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MemoryProvider>
        <BrowserRouter>
          {/* AuthProvider wraps your routes */}
          <AuthProvider>
            <ThemeProvider defaultTheme="dark" storageKey="nexus-theme">
              <Routes>
                {/* --- PUBLIC ROUTE --- */}
                <Route path="/login" element={<Login />} />

                {/* --- PROTECTED ROUTES --- */}
                <Route element={<ProtectedRoute />}>
                  <Route
                    path="/"
                    element={
                      <AppLayout>
                        <Index />
                      </AppLayout>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <AppLayout>
                        <Analytics />
                      </AppLayout>
                    }
                  />
                  <Route
                    path="/todays-mood"
                    element={
                      <AppLayout>
                        <TodaysMood />
                      </AppLayout>
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <AppLayout>
                        <NotFound />
                      </AppLayout>
                    }
                  />
                </Route>
              </Routes>
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </MemoryProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);