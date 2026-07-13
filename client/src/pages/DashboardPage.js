import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Wand2,
    Calendar,
    Clock,
    Package,
    User as UserIcon,
    Eye,
    Heart,
    MapPin,
    Settings,
    LogOut,
    Menu,
    X,
    Sun,
    Moon,
    Bell,
    ShoppingCart,
    Lock,
    Search,
    ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { rendersAPI, ordersAPI, authAPI, cartAPI } from "../utils/api";
import { getWishlist, removeFromWishlist } from "../utils/wishlist";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import OrderDetailsModal from "../components/shared/OrderDetailsModal";
import NotificationBell from "../components/shared/NotificationBell";
import CartDrawer from "../components/shared/CartDrawer";

export default function DashboardPage() {
    const { user, logout, updateUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState("orders");
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderSearchQuery, setOrderSearchQuery] = useState("");
    const [orderTab, setOrderTab] = useState("all");
    const [cartOpen, setCartOpen] = useState(false);

    // Handle viewport resize for sidebar responsive state
    useEffect(() => {
        const handleResize = () => {
            setSidebarOpen(window.innerWidth > 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Get Cart count dynamically
    const { data: cartData } = useQuery({
        queryKey: ["cart"],
        queryFn: () => cartAPI.get().then((r) => r.data),
        enabled: !!user,
    });
    const cartCount = cartData?.cart?.items?.length || 0;

    // Renders data
    const { data: renderData, isLoading: rendersLoading } = useQuery({
        queryKey: ["renders"],
        queryFn: () => rendersAPI.getMine().then((r) => r.data),
        enabled: !!user,
    });
    const renders = renderData?.renders || [];

    // Orders data
    const { data: orderData, isLoading: ordersLoading } = useQuery({
        queryKey: ["myOrders"],
        queryFn: () => ordersAPI.getMine().then((r) => r.data),
        enabled: !!user,
    });
    const orders = orderData?.orders || [];

    const handleLogout = () => {
        logout();
        queryClient.clear();
        navigate("/");
        toast.success("Successfully logged out");
    };

    const daysLeft = (expiresAt) => {
        const diff = new Date(expiresAt) - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    // Filter orders by tab and search query
    const filteredOrders = orders.filter((order) => {
        // Tab Filter
        if (orderTab === "processing" && order.fulfillmentStatus !== "processing") return false;
        if (orderTab === "shipped" && order.fulfillmentStatus !== "shipped") return false;
        if (orderTab === "delivered" && order.fulfillmentStatus !== "delivered") return false;
        if (orderTab === "cancelled" && order.fulfillmentStatus !== "cancelled") return false;

        // Search Filter
        if (orderSearchQuery.trim()) {
            const query = orderSearchQuery.toLowerCase();
            const orderNum = (order.orderNumber || "").toLowerCase();
            const orderId = (order._id || "").toLowerCase();
            const name = (order.contactName || "").toLowerCase();
            const contact = (order.contactPhone || "").toLowerCase();
            return orderNum.includes(query) || orderId.includes(query) || name.includes(query) || contact.includes(query);
        }

        return true;
    });

    const sidebarItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "orders", label: "My Orders", icon: Package },
        { id: "wishlist", label: "Wishlist", icon: Heart },
        { id: "profile", label: "Profile", icon: UserIcon },
        { id: "addresses", label: "Addresses", icon: MapPin },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    const handleSidebarItemClick = (id) => {
        setActiveTab(id);
        if (window.innerWidth <= 768) {
            setSidebarOpen(false);
        }
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--page-bg)" }}>
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
                {/* Brand Logo Header — click to go home */}
                <Link
                    to="/"
                    style={{ display: "block", padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", textDecoration: "none", color: "inherit" }}
                    title="Go to Home"
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img
                            src="/images/logo(TR3).png"
                            alt="Stratum Logo"
                            style={{ height: "35px", width: "auto", borderRadius: "10px" }}
                        />
                        <div>
                            <div style={{ fontSize: "0.875rem", fontWeight: "700", letterSpacing: "0.06em" }}>STRATUM</div>
                            <div style={{ fontSize: "0.625rem", color: "#C9A84C", letterSpacing: "0.05em" }}>
                                BY DSYN LUXURY
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Sidebar Navigation Options */}
                <nav style={{ flex: 1, padding: "1rem 0", overflowY: "auto" }}>
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleSidebarItemClick(item.id)}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "0.875rem 1.5rem",
                                    background: isActive ? "#3D3430" : "transparent",
                                    color: isActive ? "#C9A84C" : "rgba(255,255,255,0.75)",
                                    border: "none",
                                    fontSize: "0.875rem",
                                    fontWeight: isActive ? "600" : "400",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                            >
                                <Icon size={18} />
                                {item.label}
                            </button>
                        );
                    })}

                    {/* Red logout button */}
                    <button
                        onClick={handleLogout}
                        style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "0.875rem 1.5rem",
                            background: "transparent",
                            color: "#EF4444",
                            border: "none",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            marginTop: "1rem",
                        }}
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </nav>
            </div>

            {/* Backdrop for mobile drawer */}
            {sidebarOpen && window.innerWidth <= 768 && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.4)",
                        zIndex: 99,
                        backdropFilter: "blur(2px)",
                    }}
                />
            )}

            {/* Main Area */}
            <div
                style={{
                    marginLeft: sidebarOpen && window.innerWidth > 768 ? "240px" : "0",
                    flex: 1,
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    paddingTop: "64px",
                    transition: "margin-left 0.3s ease",
                }}
            >
                {/* Dashboard Top bar */}
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: sidebarOpen && window.innerWidth > 768 ? "240px" : "0",
                        right: 0,
                        height: "64px",
                        background: "var(--nav-bg)",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 2rem",
                        zIndex: 98,
                        transition: "left 0.3s ease",
                    }}
                >
                    {/* Left toggles */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#2C2420", display: "flex", alignItems: "center" }}
                        >
                            <Menu size={24} />
                        </button>

                        <Link
                            to="/visualizer"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                background: "#C9A84C",
                                color: "white",
                                padding: "0.5rem 1.25rem",
                                borderRadius: "8px",
                                textDecoration: "none",
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                boxShadow: "0 2px 8px rgba(201,168,76,0.3)",
                            }}
                        >
                            <Wand2 size={15} /> Visualize
                        </Link>
                    </div>

                    {/* Right toggles info */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                        {/* Theme */}
                        <button onClick={toggleTheme} style={{ background: "none", border: "none", cursor: "pointer", color: "#2C2420" }}>
                            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {/* Notifications */}
                        <NotificationBell />

                        {/* Cart - opens cart drawer */}
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => setCartOpen(true)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--charcoal)", display: "flex", alignItems: "center", padding: "0.375rem", borderRadius: 6 }}
                                title="View Cart"
                            >
                                <ShoppingCart size={20} />
                            </button>
                            {cartCount > 0 && (
                                <span style={{ position: "absolute", top: -4, right: -4, background: "#C9A84C", color: "white", fontSize: "0.625rem", padding: "1px 5px", borderRadius: "10px", fontWeight: "600", pointerEvents: "none" }}>
                                    {cartCount}
                                </span>
                            )}
                        </div>

                        {/* User Tag */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.75rem", background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: "20px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2C2420", color: "white", display: "flex", alignItems: "center", justifyContext: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "600" }}>
                                {user?.name?.charAt(0) || "U"}
                            </div>
                            <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#2C2420" }}>
                                {user?.name || "User"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sub Tab Contents */}
                <div style={{ padding: "2rem", flex: 1 }}>
                    {/* MY ORDERS TAB */}
                    {activeTab === "orders" && (
                        <div>
                            <div style={{ marginBottom: "1.5rem" }}>
                                <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#2C2420", margin: 0 }}>My Orders</h2>
                                <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: "4px 0 0" }}>
                                    Track and view the details of your orders
                                </p>
                            </div>

                            {/* Sub Filters & Search */}
                            <div style={{ display: "flex", borderBottom: "1px solid #E5E1D8", gap: "1rem", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
                                <div style={{ display: "flex", gap: "0.25rem", overflowX: "auto" }}>
                                    {[
                                        { id: "all", label: "All Orders" },
                                        { id: "processing", label: "Processing" },
                                        { id: "shipped", label: "Shipped" },
                                        { id: "delivered", label: "Delivered" },
                                        { id: "cancelled", label: "Cancelled" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setOrderTab(opt.id)}
                                            style={{
                                                padding: "0.5rem 1rem",
                                                border: "none",
                                                background: orderTab === opt.id ? "#F3EFE9" : "transparent",
                                                color: orderTab === opt.id ? "#C9A84C" : "#6B7280",
                                                fontSize: "0.875rem",
                                                fontWeight: orderTab === opt.id ? "600" : "400",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                transition: "all 0.15s",
                                            }}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ position: "relative", width: "240px" }}>
                                    <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                                    <input
                                        type="text"
                                        placeholder="Search orders..."
                                        value={orderSearchQuery}
                                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "0.4rem 1rem 0.4rem 2.25rem",
                                            fontSize: "0.875rem",
                                            borderRadius: "8px",
                                            border: "1px solid #D1D5DB",
                                            outline: "none",
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Card Grid List */}
                            {ordersLoading ? (
                                <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
                                    <div className="spinner" style={{ width: 36, height: 36 }} />
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div style={{ background: "white", padding: "4rem 2rem", borderRadius: "12px", border: "1px solid #E5E1D8", textAlign: "center", color: "#9CA3AF" }}>
                                    <Package size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                                    <p style={{ margin: 0, fontSize: "1rem" }}>No orders found</p>
                                    <Link to="/products" className="btn btn-primary btn-sm" style={{ marginTop: "1rem", display: "inline-block" }}>
                                        Browse Stratum Collection
                                    </Link>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    {filteredOrders.map((order) => {
                                        // Pick first item's image as card preview thumbnail
                                        const firstItem = order.lineItems?.[0];
                                        const thumbnailUrl = firstItem?.product?.textureImage?.url || firstItem?.product?.thumbnailImage?.url || "/images/placeholder.jpg";

                                        // Compute estimated delivery (placed date + 7 days)
                                        const placedDate = new Date(order.createdAt);
                                        const deliveryEstDate = new Date(placedDate.getTime() + 7 * 24 * 60 * 60 * 1000);

                                        const badgeColors = {
                                            processing: { bg: "#FEF3C7", text: "#D97706" },
                                            shipped: { bg: "#EFF6FF", text: "#2563EB", label: "In Transit" },
                                            delivered: { bg: "#ECFDF5", text: "#059669" },
                                            cancelled: { bg: "#FEE2E2", text: "#DC2626" },
                                        }[order.fulfillmentStatus] || { bg: "#F3F4F6", text: "#4B5563" };

                                        return (
                                            <div
                                                key={order._id}
                                                style={{
                                                    background: "white",
                                                    border: "1px solid #E5E1D8",
                                                    borderRadius: "12px",
                                                    padding: "1.25rem",
                                                    display: "grid",
                                                    gridTemplateColumns: "auto 1fr auto",
                                                    alignItems: "center",
                                                    gap: "1.5rem",
                                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                                }}
                                            >
                                                {/* Left Picture */}
                                                <img
                                                    src={thumbnailUrl}
                                                    alt="Render item"
                                                    style={{ width: "110px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid #E5EDEC" }}
                                                    onError={(e) => { e.target.src = "/images/logo(TR2).png"; }}
                                                />

                                                {/* Middle Metadatas */}
                                                <div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
                                                        <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#2C2420", margin: 0 }}>
                                                            Order #{order.orderNumber || order._id.substring(0, 8)}
                                                        </h3>
                                                        <span
                                                            style={{
                                                                padding: "2px 8px",
                                                                background: badgeColors.bg,
                                                                color: badgeColors.text,
                                                                fontWeight: "600",
                                                                fontSize: "0.7rem",
                                                                borderRadius: "20px",
                                                                textTransform: "capitalize",
                                                            }}
                                                        >
                                                            {badgeColors.label || order.fulfillmentStatus}
                                                        </span>
                                                    </div>

                                                    <div style={{ fontSize: "0.85rem", color: "#6B7280", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                                                        <span>{order.lineItems?.length} Items</span>
                                                        <span>•</span>
                                                        <strong style={{ color: "#2C2420" }}>₹{order.totalAmount?.toLocaleString("en-IN")}</strong>
                                                        <span>•</span>
                                                        <span>Placed on {placedDate.toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                                                    </div>
                                                </div>

                                                {/* Right status action button */}
                                                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.75rem" }}>
                                                    <div>
                                                        <span style={{ fontSize: "0.75rem", color: "#6B7280", display: "block" }}>
                                                            {order.fulfillmentStatus === "delivered" ? "Delivered on" : "Estimated Delivery"}
                                                        </span>
                                                        <strong style={{ fontSize: "0.875rem", color: order.fulfillmentStatus === "delivered" ? "#059669" : "#1F2937" }}>
                                                            {order.fulfillmentStatus === "delivered"
                                                                ? new Date(order.updatedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
                                                                : deliveryEstDate.toLocaleDateString("en-IN", { dateStyle: "medium" })
                                                            }
                                                        </strong>
                                                    </div>

                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            color: "#C9A84C",
                                                            fontSize: "0.875rem",
                                                            fontWeight: "600",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            padding: 0,
                                                        }}
                                                    >
                                                        View Details <ChevronRight size={14} style={{ marginLeft: 2 }} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PROFILE TAB */}
                    {activeTab === "profile" && <ProfileTab user={user} updateUser={updateUser} />}

                    {/* ADDRESSES TAB */}
                    {activeTab === "addresses" && <AddressesTab user={user} updateUser={updateUser} />}

                    {/* WISHLIST TAB */}
                    {activeTab === "wishlist" && <WishlistTab />}

                    {/* SETTINGS TAB */}
                    {activeTab === "settings" && <SettingsTab theme={theme} toggleTheme={toggleTheme} />}

                    {/* DASHBOARD TAB (Renders view) */}
                    {activeTab === "dashboard" && (
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                                <div>
                                    <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#2C2420", margin: 0 }}>My Dashboard</h2>
                                    <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: "4px 0 0" }}>
                                        Manage your AI room visualizer outputs and profile.
                                    </p>
                                </div>
                                <Link to="/visualizer" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <Wand2 size={16} /> New Visualization
                                </Link>
                            </div>

                            {/* Summary Metrics */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "2rem" }}>
                                <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #E5E1D8" }}>
                                    <span style={{ fontSize: "0.875rem", color: "#6B7280" }}>Renders Created</span>
                                    <h3 style={{ fontSize: "1.5rem", margin: "4px 0 0", color: "#2C2420" }}>{renders.length}</h3>
                                </div>
                                <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #E5E1D8" }}>
                                    <span style={{ fontSize: "0.875rem", color: "#6B7280" }}>Orders Placed</span>
                                    <h3 style={{ fontSize: "1.5rem", margin: "4px 0 0", color: "#2C2420" }}>{orders.length}</h3>
                                </div>
                            </div>

                            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#2C2420", marginBottom: "1rem" }}>Recent Visualizations</h3>

                            {rendersLoading ? (
                                <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
                                    <div className="spinner" style={{ width: 36, height: 36 }} />
                                </div>
                            ) : renders.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "4rem 2rem", background: "white", border: "1px solid #E5E1D8", borderRadius: "12px" }}>
                                    <Wand2 size={48} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
                                    <p style={{ margin: 0, color: "#6B7280" }}>No renders saved yet.</p>
                                </div>
                            ) : (
                                <div className="grid-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.25rem" }}>
                                    {renders.slice(0, 6).map((render) => (
                                        <div key={render._id} className="card" style={{ padding: 0, overflow: "hidden", background: "white", border: "1px solid #E5E1D8", borderRadius: "12px" }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                                                <div style={{ aspectRatio: "4/3", overflow: "hidden", position: "relative" }}>
                                                    <img src={render.originalPhoto?.url} alt="Before" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    <span style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.6)", color: "white", fontSize: "0.6875rem", padding: "2px 6px", borderRadius: 4 }}>Before</span>
                                                </div>
                                                <div style={{ aspectRatio: "4/3", overflow: "hidden", position: "relative" }}>
                                                    <img src={render.renderedPhoto?.url || render.originalPhoto?.url} alt="After" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    <span style={{ position: "absolute", bottom: 4, left: 4, background: "#C9A84C", color: "white", fontSize: "0.6875rem", padding: "2px 6px", borderRadius: 4 }}>After</span>
                                                </div>
                                            </div>
                                            <div style={{ padding: "1rem" }}>
                                                <h4 style={{ fontSize: "0.9375rem", margin: "0 0 4px", color: "#2C2420" }}>{render.title || "Room Render"}</h4>
                                                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.875rem", flexWrap: "wrap" }}>
                                                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "#6B7280" }}>
                                                        <Calendar size={12} /> {new Date(render.createdAt).toLocaleDateString("en-IN")}
                                                    </span>
                                                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: daysLeft(render.expiresAt) < 5 ? "#DC2626" : "#6B7280" }}>
                                                        <Clock size={12} /> {daysLeft(render.expiresAt)}d left
                                                    </span>
                                                </div>
                                                <Link to={`/render/${render._id}`} className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center", display: "flex", gap: 6 }}>
                                                    <Eye size={14} /> View Render Details
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
            )}

            {/* Cart Drawer */}
            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </div>
    );
}

// PROFILE TAB COMPONENT
function ProfileTab({ user, updateUser }) {
    const [name, setName] = useState(user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setPhone(user.phone || "");
        }
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await authAPI.updateProfile({ name, phone });
            updateUser(res.data.user);
            toast.success("Profile details updated successfully!");
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: "white", padding: "2rem", borderRadius: "12px", border: "1px solid #E5E1D8", maxWidth: "600px" }}>
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.25rem", color: "#2C2420" }}>Personal Profile Details</h3>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#4B5563" }}>Email Address</label>
                    <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        style={{ padding: "0.5rem", border: "1px solid #D1D5DB", borderRadius: "6px", background: "#F5F5F5", cursor: "not-allowed", outline: "none" }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>Email address cannot be changed.</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#4B5563" }}>Full Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ padding: "0.5rem 0.75rem", border: "1px solid #D1D5DB", borderRadius: "6px", outline: "none" }}
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#4B5563" }}>Phone Number</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{ padding: "0.5rem 0.75rem", border: "1px solid #D1D5DB", borderRadius: "6px", outline: "none" }}
                    />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}>
                    {loading ? "Saving Profile..." : "Save Changes"}
                </button>
            </form>
        </div>
    );
}

// ADDRESSES TAB COMPONENT
function AddressesTab({ user, updateUser }) {
    const [street, setStreet] = useState(user?.address?.street || "");
    const [city, setCity] = useState(user?.address?.city || user?.city || "");
    const [state, setState] = useState(user?.address?.state || "");
    const [pincode, setPincode] = useState(user?.address?.pincode || "");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setStreet(user.address?.street || "");
            setCity(user.address?.city || user.city || "");
            setState(user.address?.state || "");
            setPincode(user.address?.pincode || "");
        }
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const address = { street, city, state, pincode };
            const res = await authAPI.updateProfile({ address });
            updateUser(res.data.user);
            toast.success("Shipping address saved successfully!");
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update address");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: "white", padding: "2rem", borderRadius: "12px", border: "1px solid #E5E1D8", maxWidth: "600px" }}>
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.25rem", color: "#2C2420" }}>Default Shipping Address</h3>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#4B5563" }}>Street Address</label>
                    <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="House No, Apartment, Street Name"
                        style={{ padding: "0.5rem 0.75rem", border: "1px solid #D1D5DB", borderRadius: "6px", outline: "none" }}
                    />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#4B5563" }}>City</label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            style={{ padding: "0.5rem 0.75rem", border: "1px solid #D1D5DB", borderRadius: "6px", outline: "none" }}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#4B5563" }}>State</label>
                        <input
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            style={{ padding: "0.5rem 0.75rem", border: "1px solid #D1D5DB", borderRadius: "6px", outline: "none" }}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#4B5563" }}>Pincode</label>
                        <input
                            type="text"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            style={{ padding: "0.5rem 0.75rem", border: "1px solid #D1D5DB", borderRadius: "6px", outline: "none" }}
                        />
                    </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}>
                    {loading ? "Saving Address..." : "Save Address Info"}
                </button>
            </form>
        </div>
    );
}

// WISHLIST TAB COMPONENT
function WishlistTab() {
    const queryClient = useQueryClient();
    const [wishlist, setWishlist] = useState(() => getWishlist());

    // Keep in sync with changes from other components/tabs
    useEffect(() => {
        const handler = () => setWishlist(getWishlist());
        window.addEventListener('wishlist-change', handler);
        return () => window.removeEventListener('wishlist-change', handler);
    }, []);

    const addToCartMutation = useMutation({
        mutationFn: (productId) => cartAPI.add({ productId, quantity: 1, zone: 'General' }),
        onSuccess: () => {
            queryClient.invalidateQueries(['cart']);
            toast.success('Added to cart!');
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to add to cart')
    });

    const handleRemove = (productId) => {
        removeFromWishlist(productId);
        setWishlist(getWishlist());
        toast(`Removed from wishlist`, { icon: '🗑️' });
    };

    if (wishlist.length === 0) {
        return (
            <div style={{ background: "var(--warm-white)", padding: "3rem 2rem", borderRadius: "12px", border: "1px solid var(--border)", textAlign: "center", color: "#9CA3AF" }}>
                <Heart size={48} color="#C9A84C" style={{ margin: "0 auto 1rem", display: 'block' }} />
                <h3 style={{ color: "var(--charcoal)", margin: "0 0 0.5rem" }}>Your Wishlist is Empty</h3>
                <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem" }}>Tap the ♡ heart on any product to save it here for later.</p>
                <Link to="/products" className="btn btn-primary btn-sm">
                    Browse Collection
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--charcoal)", margin: 0 }}>My Wishlist</h2>
                    <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: "4px 0 0" }}>{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p>
                </div>
                <Link to="/products" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Heart size={14} /> Browse more
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                {wishlist.map(product => (
                    <div key={product._id} style={{ background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                        {/* Remove from wishlist */}
                        <button
                            onClick={() => handleRemove(product._id)}
                            title="Remove from wishlist"
                            style={{
                                position: 'absolute', top: 8, right: 8, zIndex: 2,
                                background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%',
                                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.92)'; }}
                        >
                            <Heart size={15} color="#C9A84C" fill="#C9A84C" />
                        </button>

                        {/* Product Image */}
                        <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                            <img
                                src={product.textureImage?.url || product.thumbnailImage?.url}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                                onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
                                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                                onError={e => { e.target.src = '/images/logo(TR2).png'; }}
                            />
                        </div>

                        {/* Product Info */}
                        <div style={{ padding: '0.875rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                <h4 style={{ fontSize: '0.9375rem', margin: 0, color: 'var(--charcoal)', fontWeight: 600 }}>{product.name}</h4>
                                <span style={{ fontSize: '0.625rem', color: 'var(--charcoal-light)', marginLeft: 6, whiteSpace: 'nowrap' }}>{product.sku}</span>
                            </div>
                            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#8B6914', margin: '4px 0 10px', fontFamily: 'var(--font-body)' }}>
                                ₹{product.pricePerSqFt?.toLocaleString('en-IN')}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--charcoal-light)' }}>/sq.ft</span>
                            </p>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <Link
                                    to="/visualizer"
                                    className="btn btn-secondary btn-sm"
                                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                                >
                                    Visualize
                                </Link>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => addToCartMutation.mutate(product._id)}
                                    disabled={addToCartMutation.isLoading}
                                    title="Add to cart"
                                    style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
                                >
                                    <ShoppingCart size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// SETTINGS TAB COMPONENT
function SettingsTab({ theme, toggleTheme }) {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        // simulated password change output
        setTimeout(() => {
            setLoading(false);
            setOldPassword("");
            setNewPassword("");
            toast.success("Security credentials updated (Simulated)");
        }, 1000);
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", maxWidth: "600px" }}>
            {/* Theme Toggle option */}
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #E5E1D8" }}>
                <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", color: "#2C2420" }}>Theme and Accessibility</h3>
                <p style={{ fontSize: "0.85rem", color: "#6B7280", margin: "0 0 1rem" }}>
                    Select between light and dark mode for your user visualizer dashboard panel.
                </p>
                <button
                    onClick={toggleTheme}
                    style={{
                        padding: "0.5rem 1rem",
                        background: "#2C2420",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                    Switch to {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>
            </div>

            {/* Password security settings */}
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #E5E1D8" }}>
                <h3 style={{ margin: "0 0 1rem", fontSize: "1.15rem", color: "#2C2420" }}>Account Security</h3>
                <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#4B5563" }}>Current Password</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                            style={{ padding: "0.5rem", border: "1px solid #D1D5DB", borderRadius: "6px", outline: "none" }}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#4B5563" }}>New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            style={{ padding: "0.5rem", border: "1px solid #D1D5DB", borderRadius: "6px", outline: "none" }}
                        />
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6 }}>
                        <Lock size={14} /> {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
