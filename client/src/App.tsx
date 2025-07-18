
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoadingProvider } from "@/components/LoadingProvider";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import NotFound from "./pages/NotFound";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

const SESSION_TIMEOUT_MINUTES = 30; // 30 minutes
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;

const App = () => {
  const { toast } = useToast ? useToast() : { toast: () => {} };
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Session timeout logic
  useEffect(() => {
    const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast && toast({
          title: "Session expired",
          description: `You have been logged out after ${SESSION_TIMEOUT_MINUTES} minutes of inactivity.`,
          variant: "destructive",
        });
        window.location.href = "/login";
      }, SESSION_TIMEOUT_MS);
    };

    // List of events that indicate user activity
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll"
    ];
    events.forEach((event) => window.addEventListener(event, resetTimeout));
    resetTimeout(); // Start timer on mount

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimeout));
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LoadingProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/services" element={<Services />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/patient" element={<PatientDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </LoadingProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
