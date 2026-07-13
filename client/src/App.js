import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AdminProvider } from "./context/AdminContext";
import Navbar from "./components/shared/Navbar";
import HomePage from "./pages/HomePage";
import VisualizerPage from "./pages/VisualizerPage";
import ProductsPage from "./pages/ProductsPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SharedRenderPage from "./pages/SharedRenderPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminQuotes from "./pages/admin/AdminQuotes";
import AdminClients from "./pages/admin/AdminClients";
import AdminRenders from "./pages/admin/AdminRenders";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
});

function ProtectedRoute({ children, adminOnly = false }) {
    const { user, loading } = useAuth();
    if (loading)
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                }}
            >
                <div className="spinner" />
            </div>
        );
    if (!user) return <Navigate to="/login" replace />;
    if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
    return children;
}

function AppRoutes() {
    const location = useLocation();
    const isHome = location.pathname === "/";
    const isAdminRoute = location.pathname.startsWith("/admin");
    const isDashboardRoute = location.pathname.startsWith("/dashboard");

    return (
        <>
            {!isAdminRoute && !isDashboardRoute && <Navbar />}
            <div
                style={{
                    paddingTop: isHome || isAdminRoute || isDashboardRoute ? "0" : "64px",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100vh",
                }}
            >
                {" "}
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route
                        path="/visualizer"
                        element={
                            <ProtectedRoute>
                                <VisualizerPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/view/:token" element={<SharedRenderPage />} />
                    <Route
                        path="/render/:id"
                        element={
                            <ProtectedRoute>
                                <SharedRenderPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/products"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminProducts />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/orders"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminOrders />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/quotes"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminQuotes />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/clients"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminClients />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/renders"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminRenders />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/categories"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminCategories />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/reviews"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminReviews />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/users"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminUsers />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/coupons"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminCoupons />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/settings"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminSettings />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </div>
        </>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AuthProvider>
                    <AdminProvider>
                        <BrowserRouter>
                            <AppRoutes />
                            <Toaster
                                position="top-center"
                                toastOptions={{
                                    style: {
                                        fontFamily: "Inter, sans-serif",
                                        fontSize: "0.875rem",
                                        borderRadius: "8px",
                                    },
                                }}
                            />
                        </BrowserRouter>
                    </AdminProvider>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
