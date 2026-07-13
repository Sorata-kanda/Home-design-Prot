import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    MessageSquare,
    Users,
    Image,
    FolderTree,
    Star,
    UserCog,
    Tag,
    Settings,
    Crown,
} from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import Navbar from "../shared/Navbar";

const SIDEBAR_ITEMS = [
    {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/admin",
    },
    {
        id: "products",
        label: "Products",
        icon: Package,
        path: "/admin/products",
    },
    {
        id: "orders",
        label: "Orders",
        icon: ShoppingCart,
        path: "/admin/orders",
    },
    {
        id: "quotes",
        label: "Quotes",
        icon: MessageSquare,
        path: "/admin/quotes",
    },
    { id: "clients", label: "Clients", icon: Users, path: "/admin/clients" },
    { id: "renders", label: "Renders", icon: Image, path: "/admin/renders" },
    {
        id: "categories",
        label: "Categories",
        icon: FolderTree,
        path: "/admin/categories",
    },
    { id: "reviews", label: "Reviews", icon: Star, path: "/admin/reviews" },
    { id: "users", label: "Users", icon: UserCog, path: "/admin/users" },
    { id: "coupons", label: "Coupons", icon: Tag, path: "/admin/coupons" },
    {
        id: "settings",
        label: "Settings",
        icon: Settings,
        path: "/admin/settings",
    },
];

export default function AdminLayout({ children }) {
    const { sidebarOpen } = useAdmin();
    const location = useLocation();

    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                background: "var(--page-bg)",
            }}
        >
            {/* Top Navbar - Visualizer button, hamburger, icons */}
            <Navbar />

            {/* Sidebar */}
            <div
                style={{
                    width: "240px",
                    background: "#2C2420",
                    color: "white",
                    display: "flex",
                    flexDirection: "column",
                    position: "fixed",
                    height: "100vh",
                    top: 0,
                    left: sidebarOpen ? 0 : "-240px",
                    zIndex: 100,
                    transition: "left 0.3s ease",
                }}
            >
                {/* Logo — click to go home */}
                <Link
                    to="/"
                    style={{
                        display: "block",
                        padding: "1rem 1.25rem",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        textDecoration: "none",
                        color: "inherit",
                    }}
                    title="Go to Home"
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <img
                            src="/images/logo(TR3).png"
                            alt="Stratum"
                            style={{
                                height: "36px",
                                width: "auto",
                                borderRadius: "8px",
                            }}
                        />
                        <div>
                            <div
                                style={{
                                    fontSize: "0.875rem",
                                    fontWeight: "600",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                STRATUM
                            </div>
                            <div
                                style={{
                                    fontSize: "0.625rem",
                                    color: "#B8964A",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                BY DSYN LUXURY
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: "1rem 0", overflowY: "auto" }}>
                    {SIDEBAR_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "0.75rem 1.25rem",
                                    background: isActive
                                        ? "#3a3330"
                                        : "transparent",
                                    color: isActive
                                        ? "#C9A84C"
                                        : "rgba(255,255,255,0.7)",
                                    border: "none",
                                    fontSize: "0.875rem",
                                    fontWeight: isActive ? "600" : "400",
                                    textDecoration: "none",
                                    transition: "all 0.2s",
                                }}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Premium Upgrade Box */}
                <div
                    style={{
                        padding: "1rem",
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                    }}
                >
                    <div
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            padding: "1rem",
                            borderRadius: "12px",
                            textAlign: "center",
                        }}
                    >
                        <Crown
                            size={32}
                            color="#C9A84C"
                            style={{ marginBottom: "0.5rem" }}
                        />
                        <div
                            style={{
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                marginBottom: "0.25rem",
                            }}
                        >
                            Upgrade to Premium
                        </div>
                        <div
                            style={{
                                fontSize: "0.75rem",
                                color: "rgba(255,255,255,0.6)",
                                marginBottom: "0.75rem",
                            }}
                        >
                            Unlock advanced features and priority support.
                        </div>
                        <button
                            style={{
                                width: "100%",
                                padding: "0.5rem",
                                background: "#C9A84C",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                cursor: "pointer",
                            }}
                        >
                            Upgrade Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div
                style={{
                    marginLeft: sidebarOpen ? "240px" : "0",
                    flex: 1,
                    paddingTop: "64px",
                    transition: "margin-left 0.3s ease",
                }}
            >
                <div
                    style={{ padding: "2rem", minHeight: "calc(100vh - 64px)" }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
