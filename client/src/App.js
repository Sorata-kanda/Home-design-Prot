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
import Navbar from "./components/shared/Navbar";
import HomePage from "./pages/HomePage";
import VisualizerPage from "./pages/VisualizerPage";
import ProductsPage from "./pages/ProductsPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SharedRenderPage from "./pages/SharedRenderPage";
import AdminPage from "./pages/NewAdminPage";

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

    return (
        <>
            <Navbar />
            <div
                style={{
                    paddingTop: isHome ? "0" : "64px",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100vh",
                }}
            >
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
                                <AdminPage />
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
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
