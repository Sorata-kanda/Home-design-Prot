import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    Menu,
    X,
    LogOut,
    User,
    Settings,
    ShoppingCart,
    Sun,
    Moon,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useAdmin } from "../../context/AdminContext";
import { cartAPI } from "../../utils/api";
import CartDrawer from "./CartDrawer";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const { user, logout, isAdmin } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { sidebarOpen, setSidebarOpen } = useAdmin();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [showNavbar, setShowNavbar] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const isAdminPage = location.pathname.startsWith("/admin");

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 60) {
                setShowNavbar(false);
            } else {
                setShowNavbar(true);
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const { data: cartData } = useQuery({
        queryKey: ["cart"],
        queryFn: () => cartAPI.get().then((r) => r.data),
        enabled: !!user,
    });
    const cartItemCount = cartData?.cart?.items?.length || 0;

    const handleLogout = () => {
        logout();
        queryClient.clear();
        navigate("/");
        setOpen(false);
    };

    const isActive = (path) => location.pathname === path;

    // Admin navbar (minimal, right side only)
    if (isAdminPage) {
        return (
            <>
            <nav
                style={{
                    position: "fixed",
                    top: 0,
                    left: sidebarOpen ? "240px" : "0",
                    right: 0,
                    zIndex: 1000,
                    background: "var(--nav-bg)",
                    borderBottom: "1px solid var(--border)",
                    height: "64px",
                    transition: "left 0.3s ease",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        height: "100%",
                        padding: "0 2rem",
                    }}
                >
                    {/* Left side - Hamburger Menu and Visualizer Button */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                        }}
                    >
                        {/* Hamburger Menu Toggle */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "0.5rem",
                                display: "flex",
                                alignItems: "center",
                                color: "var(--charcoal)",
                            }}
                            title={
                                sidebarOpen ? "Hide sidebar" : "Show sidebar"
                            }
                        >
                            <Menu size={24} />
                        </button>

                        {/* Visualizer Button */}
                        <Link
                            to="/visualizer"
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.625rem",
                                padding: "0.75rem 2rem",
                                background:
                                    "linear-gradient(135deg, #4A3714 0%, #856323 100%)",
                                color: "white",
                                borderRadius: "12px",
                                textDecoration: "none",
                                fontSize: "0.9375rem",
                                fontWeight: "600",
                                transition: "all 0.3s ease",
                                boxShadow:
                                    "0 4px 12px rgba(74, 55, 20, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                                overflow: "hidden",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform =
                                    "translateY(-2px)";
                                e.currentTarget.style.boxShadow =
                                    "0 6px 20px rgba(74, 55, 20, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform =
                                    "translateY(0)";
                                e.currentTarget.style.boxShadow =
                                    "0 4px 12px rgba(74, 55, 20, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
                            }}
                        >
                            {/* Stars image on top right */}
                            <img
                                src="/images/stars.png"
                                alt=""
                                style={{
                                    position: "absolute",
                                    top: "6px",
                                    right: "10px",
                                    width: "25px",
                                    height: "20px",
                                    opacity: 0.7,
                                }}
                            />

                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#CEA955"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                                }}
                            >
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                            <span
                                style={{
                                    textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                    letterSpacing: "0.02em",
                                }}
                            >
                                Visualizer
                            </span>
                        </Link>
                    </div>

                    {/* Right side - Icons */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1.3rem",
                        }}
                    >
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "0.5rem",
                                display: "flex",
                                alignItems: "center",
                                color: "var(--charcoal)",
                                borderRadius: 8,
                                transition: "background 0.2s",
                            }}
                            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--border)"}
                            onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                            {theme === "dark" ? (
                                <Sun size={20} />
                            ) : (
                                <Moon size={20} />
                            )}
                        </button>

                        {/* Notifications */}
                        <NotificationBell />

                        {/* Cart */}
                        {user && (
                            <div style={{ position: "relative" }}>
                                <button
                                    onClick={() => setCartOpen(true)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "0.5rem",
                                        display: "flex",
                                        alignItems: "center",
                                        color: "var(--charcoal)",
                                        borderRadius: 8,
                                        transition: "background 0.2s",
                                    }}
                                    title="View Cart"
                                    onMouseEnter={e => e.currentTarget.style.background = "var(--border)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                                >
                                    <ShoppingCart size={20} />
                                </button>
                                {cartItemCount > 0 && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: "-5px",
                                            right: "-3px",
                                            background: "#C9A84C",
                                            color: "white",
                                            fontSize: "0.625rem",
                                            padding: "2px 6px",
                                            borderRadius: "10px",
                                            fontWeight: "600",
                                            minWidth: "18px",
                                            textAlign: "center",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {cartItemCount}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* User Profile */}
                        {user && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    padding: "0.5rem 1rem",
                                    background: "var(--warm-white)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "24px",
                                    cursor: "default",
                                }}
                            >
                                <div
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        background: "#2C2420",
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "0.875rem",
                                        fontWeight: "600",
                                    }}
                                >
                                    {user.name?.charAt(0) || "A"}
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: "0.875rem",
                                            fontWeight: "600",
                                            color: "var(--charcoal)",
                                        }}
                                    >
                                        {user.name?.split(" ")[0]}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "0.625rem",
                                            color: "#8B6914",
                                        }}
                                    >
                                        Admin
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Logout */}
                        {user && (
                            <button
                                onClick={handleLogout}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "0.5rem",
                                    display: "flex",
                                    alignItems: "center",
                                    color: "var(--charcoal)",
                                    borderRadius: 8,
                                    transition: "background 0.2s",
                                }}
                                title="Sign out"
                                onMouseEnter={e => e.currentTarget.style.background = "var(--border)"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}
                            >
                                <LogOut size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Cart Drawer - available on admin pages too */}
            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
            </>
        );
    }

    // Regular navbar for other pages
    return (
        <>
            <nav
                style={{
                    position: "fixed",
                    top: showNavbar ? 0 : "-70px",
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    width: "100%",
                    background: "rgba(var(--cream-rgb), 0.95)",
                    backdropFilter: "blur(12px)",
                    borderBottom: "1px solid var(--border)",
                    fontFamily: "var(--font-body)",
                    transition: "top 0.3s ease-in-out",
                }}
            >
                <div
                    className="container"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        height: "64px",
                    }}
                >
                    {/* Logo */}
                    <Link
                        to="/"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            textDecoration: "none",
                        }}
                    >
                        <img
                            src={
                                theme === "dark"
                                    ? "/images/logo(TR3).png"
                                    : "/images/logo(TR2).png"
                            }
                            alt="Stratum by DSYN Luxury"
                            style={{
                                height: "35px",
                                width: "auto",
                                objectFit: "contain",
                                borderRadius: "14px",
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: "6px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "22.4px",
                                    fontWeight: "700",
                                    color:
                                        theme === "dark"
                                            ? "#89847E"
                                            : "#2C2420",
                                    letterSpacing: "0.08em",
                                    lineHeight: "1",
                                    fontFamily:
                                        '"Cormorant Garamond", Georgia, serif',
                                }}
                            >
                                STRATUM
                            </span>
                            <span
                                style={{
                                    fontSize: "10px",
                                    fontWeight: "500",
                                    color: "#8B6914",
                                    letterSpacing: "0.05em",
                                    lineHeight: "1",
                                    fontFamily: "Inter, system-ui, sans-serif",
                                }}
                            >
                                BY DSYN LUXURY
                            </span>
                        </div>
                    </Link>

                    {/* Desktop nav */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "2rem",
                        }}
                        className="desktop-nav"
                    >
                        {[
                            { path: "/", label: "Home" },
                            { path: "/visualizer", label: "Visualizer" },
                            { path: "/products", label: "Products" },
                        ].map(({ path, label }) => (
                            <Link
                                key={path}
                                to={path}
                                style={{
                                    textDecoration: "none",
                                    fontSize: "0.875rem",
                                    fontWeight: isActive(path) ? 600 : 400,
                                    color: isActive(path)
                                        ? "var(--gold-dark)"
                                        : "var(--charcoal-light)",
                                    borderBottom: isActive(path)
                                        ? "2px solid var(--gold)"
                                        : "2px solid transparent",
                                    paddingBottom: "2px",
                                    transition: "all 0.15s",
                                }}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* Auth area */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                        }}
                    >
                        <button
                            onClick={toggleTheme}
                            className="btn btn-ghost btn-sm"
                            title="Toggle theme"
                        >
                            {theme === "dark" ? (
                                <Sun size={18} />
                            ) : (
                                <Moon size={18} />
                            )}
                        </button>

                        {user && (
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setCartOpen(true)}
                                style={{
                                    position: "relative",
                                    marginRight: "8px",
                                }}
                            >
                                <ShoppingCart size={18} />
                                {cartItemCount > 0 && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: -4,
                                            right: -4,
                                            background: "red",
                                            color: "white",
                                            fontSize: "0.6rem",
                                            fontWeight: "bold",
                                            width: 16,
                                            height: 16,
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {cartItemCount}
                                    </span>
                                )}
                            </button>
                        )}

                        {user ? (
                            <div
                                className="desktop-nav"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                }}
                            >
                                {isAdmin ? (
                                    /* Admin: go straight to Admin Panel */
                                    <Link
                                        to="/admin"
                                        className="btn btn-secondary btn-sm"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                        title="Admin Panel"
                                    >
                                        <Settings size={14} />
                                        <span className="hidden-mobile">Admin Panel</span>
                                    </Link>
                                ) : (
                                    /* Regular user: go to client dashboard */
                                    <Link
                                        to="/dashboard"
                                        className="btn btn-ghost btn-sm"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <User size={15} />
                                        <span className="hidden-mobile">
                                            {user.name.split(" ")[0]}
                                        </span>
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="btn btn-ghost btn-sm"
                                    title="Sign out"
                                >
                                    <LogOut size={15} />
                                </button>
                            </div>
                        ) : (
                            <div
                                className="desktop-nav"
                                style={{ display: "flex", gap: "0.75rem" }}
                            >
                                <Link
                                    to="/login"
                                    className="btn btn-ghost btn-sm"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn btn-primary btn-sm"
                                >
                                    Get started
                                </Link>
                            </div>
                        )}

                        {/* Mobile menu toggle */}
                        <button
                            onClick={() => setOpen(!open)}
                            className="btn btn-ghost btn-sm"
                            style={{ display: "none" }}
                            aria-label="Toggle menu"
                            id="mobile-menu-btn"
                        >
                            {open ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {open && (
                    <div
                        style={{
                            background: "var(--cream)",
                            borderTop: "1px solid var(--border)",
                            padding: "1rem",
                        }}
                    >
                        {[
                            { path: "/", label: "Home" },
                            { path: "/visualizer", label: "AI Visualizer" },
                            { path: "/products", label: "Products" },
                            ...(user && !isAdmin
                                ? [{ path: "/dashboard", label: "My Renders" }]
                                : []),
                            ...(isAdmin
                                ? [{ path: "/admin", label: "Admin Panel" }]
                                : []),
                        ].map(({ path, label }) => (
                            <Link
                                key={path}
                                to={path}
                                onClick={() => setOpen(false)}
                                style={{
                                    display: "block",
                                    padding: "0.625rem 0",
                                    textDecoration: "none",
                                    color: "var(--charcoal)",
                                    borderBottom: "1px solid var(--border)",
                                    fontSize: "0.9375rem",
                                }}
                            >
                                {label}
                            </Link>
                        ))}
                        {user ? (
                            <button
                                onClick={handleLogout}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "0.625rem 0",
                                    background: "none",
                                    border: "none",
                                    color: "var(--charcoal-light)",
                                    fontSize: "0.9375rem",
                                    cursor: "pointer",
                                    marginTop: "0.5rem",
                                }}
                            >
                                Sign out
                            </button>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    gap: "0.75rem",
                                    marginTop: "1rem",
                                }}
                            >
                                <Link
                                    to="/login"
                                    className="btn btn-secondary"
                                    style={{
                                        flex: 1,
                                        justifyContent: "center",
                                    }}
                                    onClick={() => setOpen(false)}
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn btn-primary"
                                    style={{
                                        flex: 1,
                                        justifyContent: "center",
                                    }}
                                    onClick={() => setOpen(false)}
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
            </nav>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    );
}
