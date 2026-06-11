import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminLayout from "@/components/admin/AdminLayout";
import { LanguageProvider } from "@/hooks/use-language";
import { AuthProvider } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import HomePage from "./pages/HomePage";
import PropertiesPage from "./pages/PropertiesPage";
import BuyPage from "./pages/BuyPage";
import RentPage from "./pages/RentPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPropertiesPage from "./pages/AdminPropertiesPage";
import AdminLeadsPage from "./pages/AdminLeadsPage";
import AdminHighlightsPage from "./pages/AdminHighlightsPage";
import AdminYouTubePage from "./pages/AdminYouTubePage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/imoveis" element={<PropertiesPage />} />
            <Route path="/sobre" element={<AboutPage />} />
            <Route path="/comprar" element={<BuyPage />} />
            <Route path="/comprar/:type" element={<BuyPage />} />
            <Route path="/alugar" element={<RentPage />} />
            <Route path="/alugar/:type" element={<RentPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/admin/imoveis" replace />} />
              <Route path="imoveis" element={<AdminPropertiesPage />} />
              <Route path="leads" element={<AdminLeadsPage />} />
              <Route path="destaques" element={<AdminHighlightsPage />} />
              <Route path="youtube" element={<AdminYouTubePage />} />
              <Route path="configuracoes" element={<AdminSettingsPage />} />
            </Route>
            {/* SEO-friendly property URLs with optional slug; UUID stays as the main identifier */}
            <Route path="/imovel/:id/:slug?" element={<PropertyDetailPage />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
