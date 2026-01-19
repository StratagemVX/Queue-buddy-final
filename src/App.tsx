import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Departments from "./pages/Departments";
import BookAppointment from "./pages/BookAppointment";
import Dashboard from "./pages/Dashboard";
import QueueStatus from "./pages/QueueStatus";
import AdminPanel from "./pages/AdminPanel";
import DoctorDashboard from "./pages/DoctorDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/book/:departmentId" element={<BookAppointment />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/queue-status" element={<QueueStatus />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;