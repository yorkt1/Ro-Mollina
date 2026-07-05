import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { LanguageProvider } from "@/hooks/use-language";
import { AuthProvider } from "@/hooks/use-auth";
import HomePage from "./pages/HomePage";

const PropertiesPage = lazy(() => import("./pages/PropertiesPage"));
const BuyPage = lazy(() => import("./pages/BuyPage"));
const RentPage = lazy(() => import("./pages/RentPage"));
const PropertyDetailPage = lazy(() => import("./pages/PropertyDetailPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ListPropertyPage = lazy(() => import("./pages/ListPropertyPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const AdminPropertiesPage = lazy(() => import("./pages/AdminPropertiesPage"));
const AdminLeadsPage = lazy(() => import("./pages/AdminLeadsPage"));
const AdminHighlightsPage = lazy(() => import("./pages/AdminHighlightsPage"));
const AdminYouTubePage = lazy(() => import("./pages/AdminYouTubePage"));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage"));
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const ProtectedRoute = lazy(() => import("@/components/admin/ProtectedRoute"));

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
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/imoveis" element={<PropertiesPage />} />
                <Route path="/sobre" element={<AboutPage />} />
                <Route path="/negocie-seu-imovel" element={<ListPropertyPage />} />
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
            </Suspense>
            <WhatsAppFloat />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
