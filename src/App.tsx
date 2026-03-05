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
import CategoryPage from "./pages/servicos/CategoryPage";
import ServiceDetail from "./pages/servicos/ServiceDetail";
import Book from "./pages/Book";
import Confirmation from "./pages/Confirmation";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Quiz from "./pages/Quiz";
import Studio from "./pages/Studio";
import Team from "./pages/Team";
import LocationNewark from "./pages/LocationNewark";
import Shop from "./pages/Shop";
import GiftCards from "./pages/GiftCards";
import NotFound from "./pages/NotFound";
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
          <Route path="/servicos/:categoria/:slug/:locationSlug" element={<ServiceDetail />} />
          <Route path="/servicos/:categoria/:slug" element={<ServiceDetail />} />
          <Route path="/servicos/:categoria" element={<CategoryPage />} />
          <Route path="/book" element={<Book />} />
          <Route path="/confirm/:bookingId" element={<Confirmation />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/team" element={<Team />} />
          <Route path="/location/newark" element={<LocationNewark />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/gift-cards" element={<GiftCards />} />
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
