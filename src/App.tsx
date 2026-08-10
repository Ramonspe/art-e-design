import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Personalizado from "./pages/Personalizado";
import Contato from "./pages/Contato";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import MyOrders from "./pages/MyOrders";
import { AdminLayout, AdminDashboard, AdminOrders, AdminProducts, AdminCategories, AdminSlides, AdminUsers } from "./pages/Admin";
import { RequireAuth, RequireAdmin } from "./components/RequireAuth";
import OAuthConsent from "./pages/OAuthConsent";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/produtos" element={<Products />} />
                <Route path="/produto/:slug" element={<ProductDetail />} />
                <Route path="/carrinho" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/pedido-confirmado" element={<OrderConfirmation />} />
                <Route path="/personalizado" element={<Personalizado />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                <Route path="/conta" element={<RequireAuth><Account /></RequireAuth>} />
                <Route path="/meus-pedidos" element={<RequireAuth><MyOrders /></RequireAuth>} />
                <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="pedidos" element={<AdminOrders />} />
                  <Route path="produtos" element={<AdminProducts />} />
                  <Route path="categorias" element={<AdminCategories />} />
                  <Route path="carrossel" element={<AdminSlides />} />
                  <Route path="usuarios" element={<AdminUsers />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
