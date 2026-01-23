import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Services from "./pages/Services";
import Packages from "./pages/Packages";
import OfferLanding from "./pages/OfferLanding";
import PackageLanding from "./pages/PackageLanding";
import Book from "./pages/Book";
import Confirmation from "./pages/Confirmation";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Quiz from "./pages/Quiz";
import NotFound from "./pages/NotFound";
import Cabelo from "./pages/servicos/Cabelo";
import Sobrancelhas from "./pages/servicos/Sobrancelhas";
import Unhas from "./pages/servicos/Unhas";
import { WhatsAppButton } from "./components/WhatsAppButton";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/services" element={<Services />} />
          <Route path="/servicos/cabelo" element={<Cabelo />} />
          <Route path="/servicos/sobrancelhas" element={<Sobrancelhas />} />
          <Route path="/servicos/unhas" element={<Unhas />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/o/:id" element={<OfferLanding />} />
          <Route path="/p/:id" element={<PackageLanding />} />
          <Route path="/book" element={<Book />} />
          <Route path="/confirm/:bookingId" element={<Confirmation />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/quiz/:slug" element={<Quiz />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <WhatsAppButton />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
