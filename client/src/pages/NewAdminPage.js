import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    TrendingUp,
    TrendingDown,
    Calendar,
    Search,
    Download,
    Plus,
    Eye,
    Layers,
    AlertCircle,
    X,
    Check,
    Upload,
    Edit,
    Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI, productsAPI, quotesAPI, ordersAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../context/AdminContext";

const SIDEBAR_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "quotes", label: "Quotes", icon: MessageSquare },
    { id: "clients", label: "Clients", icon: Users },
    { id: "renders", label: "Renders", icon: Image },
    { id: "categories", label: "Categories", icon: FolderTree },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "users", label: "Users", icon: UserCog },
    { id: "coupons", label: "Coupons", icon: Tag },
    { id: "settings", label: "Settings", icon: Settings },
];

export default function NewAdminPage() {
    const [activeSection, setActiveSection] = useState("dashboard");
    const [dateRange, setDateRange] = useState("Jul 1 - Jul 7, 2025");
    const { sidebarOpen } = useAdmin();
    const { user } = useAuth();

    // Queries
    const { data: dashData } = useQuery({
        queryKey: ["admin-dash"],
        queryFn: () => adminAPI.dashboard().then((r) => r.data),
    });

    const { data: productsData } = useQuery({
        queryKey: ["admin-products"],
        queryFn: () => productsAPI.getAll({}).then((r) => r.data),
    });

    const { data: quotesData } = useQuery({
        queryKey: ["admin-quotes"],
        queryFn: () => quotesAPI.getAll({}).then((r) => r.data),
    });

    const { data: ordersData } = useQuery({
        queryKey: ["admin-orders"],
        queryFn: () => ordersAPI.getAll().then((r) => r.data),
    });

    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                background: "#F8F6F3",
            }}
        >
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
                {/* Logo */}
                <div
                    style={{
                        padding: "1rem 1.25rem",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                    }}
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
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: "1rem 0", overflowY: "auto" }}>
                    {SIDEBAR_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
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
                                    cursor: "pointer",
                                    fontSize: "0.875rem",
                                    fontWeight: isActive ? "600" : "400",
                                    transition: "all 0.2s",
                                    textAlign: "left",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background =
                                            "rgba(255,255,255,0.05)";
                                        e.currentTarget.style.color = "white";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background =
                                            "transparent";
                                        e.currentTarget.style.color =
                                            "rgba(255,255,255,0.7)";
                                    }
                                }}
                            >
                                <Icon size={18} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Premium Upgrade Box */}
                <div
                    style={{
                        margin: "1rem",
                        padding: "1.25rem",
                        background:
                            "linear-gradient(135deg, #3a3330 0%, #2C2420 100%)",
                        borderRadius: "12px",
                        border: "1px solid rgba(201, 168, 76, 0.3)",
                        textAlign: "center",
                    }}
                >
                    <Crown
                        size={32}
                        color="#C9A84C"
                        style={{ margin: "0 auto 0.75rem" }}
                    />
                    <h4
                        style={{
                            margin: 0,
                            fontSize: "0.875rem",
                            marginBottom: "0.5rem",
                        }}
                    >
                        Upgrade to Premium
                    </h4>
                    <p
                        style={{
                            fontSize: "0.75rem",
                            color: "rgba(255,255,255,0.6)",
                            marginBottom: "1rem",
                        }}
                    >
                        Unlock advanced features and priority support.
                    </p>
                    <button
                        style={{
                            width: "100%",
                            padding: "0.625rem",
                            background: "#C9A84C",
                            color: "#2C2420",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "0.8125rem",
                            fontWeight: "600",
                            cursor: "pointer",
                        }}
                    >
                        Upgrade Now
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div
                style={{
                    marginLeft: sidebarOpen ? "240px" : "0",
                    flex: 1,
                    paddingTop: "10px",
                    transition: "margin-left 0.3s ease",
                }}
            >
                {/* Content Area */}
                <div
                    style={{ padding: "2rem", minHeight: "calc(100vh - 64px)" }}
                >
                    {activeSection === "dashboard" && (
                        <DashboardSection
                            dashData={dashData}
                            quotesData={quotesData}
                            ordersData={ordersData}
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            user={user}
                        />
                    )}
                    {activeSection === "products" && <ProductsSection />}
                    {activeSection === "orders" && <OrdersSection />}
                    {activeSection === "quotes" && <QuotesSection />}
                    {activeSection === "clients" && <ClientsSection />}
                    {activeSection === "renders" && <RendersSection />}
                    {activeSection === "categories" && <CategoriesSection />}
                    {activeSection === "reviews" && <ReviewsSection />}
                    {activeSection === "users" && <UsersSection />}
                    {activeSection === "coupons" && <CouponsSection />}
                    {activeSection === "settings" && <SettingsSection />}
                </div>
            </div>
        </div>
    );
}

// Dashboard Section Component
function DashboardSection({
    dashData,
    quotesData,
    ordersData,
    dateRange,
    setDateRange,
    user,
}) {
    return (
        <div>
            {/* Welcome Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2rem",
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "1.75rem",
                            color: "#2C2420",
                        }}
                    >
                        Welcome back, {user?.name?.split(" ")[0] || "Rahul"} 👋
                    </h1>
                    <p
                        style={{
                            margin: "0.5rem 0 0",
                            color: "#6B5D4F",
                            fontSize: "0.875rem",
                        }}
                    >
                        Here's what's happening with your store today.
                    </p>
                </div>
                <button
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.625rem 1.25rem",
                        background: "white",
                        border: "1px solid #E5E1D8",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                    }}
                >
                    <Calendar size={16} />
                    {dateRange}
                </button>
            </div>

            {/* Stats Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "2rem",
                }}
            >
                <StatCard
                    label="Total Clients"
                    value={dashData?.stats?.users || 9}
                    change="+12%"
                    isPositive={true}
                    icon={<Users size={24} color="#C9A84C" />}
                    bgColor="#FEF3E2"
                />
                <StatCard
                    label="Products"
                    value={dashData?.stats?.products || 11}
                    change="+8%"
                    isPositive={true}
                    icon={<Package size={24} color="#C9A84C" />}
                    bgColor="#FFF4E6"
                />
                <StatCard
                    label="Total Renders"
                    value={dashData?.stats?.renders || 31}
                    change="+24%"
                    isPositive={true}
                    icon={<TrendingUp size={24} color="#8b5cf6" />}
                    bgColor="#F0E7FF"
                />
                <StatCard
                    label="New Quotes"
                    value={dashData?.stats?.newQuotes || 1}
                    change="+20%"
                    isPositive={true}
                    icon={<MessageSquare size={24} color="#ef4444" />}
                    bgColor="#FFE8E8"
                />
            </div>

            {/* Charts and Tables Row */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr",
                    gap: "1.5rem",
                    marginBottom: "2rem",
                }}
            >
                {/* Sales Overview Chart */}
                <div
                    style={{
                        background: "white",
                        borderRadius: "16px",
                        padding: "1.5rem",
                        border: "1px solid #E5E1D8",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1.5rem",
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: "1.125rem" }}>
                            Sales Overview
                        </h3>
                        <select
                            style={{
                                padding: "0.5rem",
                                border: "1px solid #E5E1D8",
                                borderRadius: "6px",
                                fontSize: "0.8125rem",
                            }}
                        >
                            <option>This Week</option>
                            <option>This Month</option>
                            <option>This Year</option>
                        </select>
                    </div>
                    <div
                        style={{
                            height: "250px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#999",
                        }}
                    >
                        [Chart.js integration - Sales line chart will go here]
                    </div>
                </div>

                {/* Orders by Status */}
                <div
                    style={{
                        background: "white",
                        borderRadius: "16px",
                        padding: "1.5rem",
                        border: "1px solid #E5E1D8",
                    }}
                >
                    <h3
                        style={{ margin: "0 0 1.5rem 0", fontSize: "1.125rem" }}
                    >
                        Orders by Status
                    </h3>
                    <div
                        style={{
                            height: "250px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#999",
                        }}
                    >
                        [Chart.js integration - Donut chart will go here]
                    </div>
                </div>
            </div>

            {/* Recent Quotes and Orders */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1.5rem",
                }}
            >
                {/* Recent Quote Requests */}
                <div
                    style={{
                        background: "white",
                        borderRadius: "16px",
                        padding: "1.5rem",
                        border: "1px solid #E5E1D8",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1rem",
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: "1.125rem" }}>
                            Recent Quote Requests
                        </h3>
                        <button
                            style={{
                                fontSize: "0.8125rem",
                                color: "#C9A84C",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            View all
                        </button>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                        }}
                    >
                        {quotesData?.quotes
                            ?.slice(0, 3)
                            .map((quote) => (
                                <QuoteItem key={quote._id} quote={quote} />
                            )) || (
                            <div
                                style={{
                                    padding: "2rem",
                                    textAlign: "center",
                                    color: "#999",
                                }}
                            >
                                No recent quotes
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div
                    style={{
                        background: "white",
                        borderRadius: "16px",
                        padding: "1.5rem",
                        border: "1px solid #E5E1D8",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1rem",
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: "1.125rem" }}>
                            Recent Orders
                        </h3>
                        <button
                            style={{
                                fontSize: "0.8125rem",
                                color: "#C9A84C",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            View all
                        </button>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                        }}
                    >
                        {ordersData?.orders
                            ?.slice(0, 3)
                            .map((order) => (
                                <OrderItem key={order._id} order={order} />
                            )) || (
                            <div
                                style={{
                                    padding: "2rem",
                                    textAlign: "center",
                                    color: "#999",
                                }}
                            >
                                No recent orders
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ label, value, change, isPositive, icon, bgColor }) {
    return (
        <div
            style={{
                background: "white",
                borderRadius: "12px",
                padding: "1.25rem",
                border: "1px solid #E5E1D8",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
            }}
        >
            {/* Icon on left - perfect circle */}
            <div
                style={{
                    width: "56px",
                    height: "56px",
                    background: bgColor,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                {icon}
            </div>

            {/* Content on right */}
            <div style={{ flex: 1 }}>
                <div
                    style={{
                        fontSize: "0.8125rem",
                        color: "#6B5D4F",
                        marginBottom: "0.25rem",
                        fontWeight: "500",
                    }}
                >
                    {label}
                </div>
                <div
                    style={{
                        fontSize: "1.75rem",
                        fontWeight: "700",
                        color: "#2C2420",
                        marginBottom: "0.5rem",
                    }}
                >
                    {value}
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        fontSize: "0.75rem",
                    }}
                >
                    <TrendingUp size={12} color="#10b981" />
                    <span style={{ color: "#10b981", fontWeight: "600" }}>
                        {change}
                    </span>
                    <span style={{ color: "#999" }}>from last week</span>
                </div>
            </div>
        </div>
    );
}

// Quote Item Component
function QuoteItem({ quote }) {
    return (
        <div
            style={{
                padding: "1rem",
                background: "#F8F6F3",
                borderRadius: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                    style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "#C9A84C",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                    }}
                >
                    {quote.contactName?.charAt(0) || "U"}
                </div>
                <div>
                    <div
                        style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#2C2420",
                        }}
                    >
                        {quote.contactName}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6B5D4F" }}>
                        {quote.city || "N/A"}
                    </div>
                </div>
            </div>
            <div style={{ textAlign: "right" }}>
                <div
                    style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#C9A84C",
                    }}
                >
                    ₹{quote.totalEstimate?.toLocaleString("en-IN") || "0"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#999" }}>
                    {new Date(quote.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    })}
                </div>
            </div>
        </div>
    );
}

// Order Item Component
function OrderItem({ order }) {
    const statusColors = {
        pending: "#f59e0b",
        confirmed: "#3b82f6",
        processing: "#8b5cf6",
        completed: "#10b981",
        cancelled: "#ef4444",
    };

    return (
        <div
            style={{
                padding: "1rem",
                background: "#F8F6F3",
                borderRadius: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            <div>
                <div
                    style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#2C2420",
                        marginBottom: "0.25rem",
                    }}
                >
                    #{order.orderNumber || order._id?.substring(0, 8)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6B5D4F" }}>
                    {order.contactName}
                </div>
            </div>
            <div style={{ textAlign: "right" }}>
                <div
                    style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#2C2420",
                        marginBottom: "0.25rem",
                    }}
                >
                    ₹{order.totalAmount?.toLocaleString("en-IN") || "0"}
                </div>
                <span
                    style={{
                        fontSize: "0.6875rem",
                        padding: "0.25rem 0.625rem",
                        borderRadius: "12px",
                        background:
                            statusColors[order.fulfillmentStatus] || "#999",
                        color: "white",
                        fontWeight: "600",
                    }}
                >
                    {order.fulfillmentStatus || "Pending"}
                </span>
            </div>
        </div>
    );
}

// Placeholder sections for other routes
function ProductsSection() {
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const queryClient = useQueryClient();

    const { data: productsData, isLoading } = useQuery({
        queryKey: ["admin-products"],
        queryFn: () => productsAPI.getAll({}).then((r) => r.data),
    });

    const products = productsData?.products || [];
    const filteredProducts = products.filter((p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate KPIs
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.isActive !== false).length;
    const lowStockProducts = products.filter((p) => (p.stock || 0) < 10).length;
    const totalValue = products.reduce((sum, p) => sum + (p.pricePerSqFt || 0), 0);

    const exportToExcel = () => {
        // Simple CSV export
        const headers = ["SKU", "Name", "Category", "Price/SqFt", "Stock", "Status"];
        const rows = products.map((p) => [
            p.sku || "",
            p.name || "",
            p.category || "",
            p.pricePerSqFt || 0,
            p.stock || 0,
            p.isActive !== false ? "Active" : "Inactive",
        ]);

        const csvContent =
            [headers, ...rows]
                .map((row) => row.map((cell) => `"${cell}"`).join(","))
                .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `products_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Products exported successfully!");
    };

    return (
        <div>
            {/* KPI Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "2rem",
                }}
            >
                <ProductKPICard
                    label="Total Products"
                    value={totalProducts}
                    icon={Package}
                    bgColor="#FEF3E2"
                    iconColor="#C9A84C"
                />
                <ProductKPICard
                    label="Active Products"
                    value={activeProducts}
                    icon={Check}
                    bgColor="#F0E7FF"
                    iconColor="#8b5cf6"
                />
                <ProductKPICard
                    label="Low Stock"
                    value={lowStockProducts}
                    icon={AlertCircle}
                    bgColor="#FFE8E8"
                    iconColor="#ef4444"
                />
                <ProductKPICard
                    label="Total Value"
                    value={`₹${totalValue.toLocaleString()}`}
                    icon={TrendingUp}
                    bgColor="#E8F5E9"
                    iconColor="#4caf50"
                />
            </div>

            {/* Header with Search and Actions */}
            <div
                style={{
                    background: "white",
                    padding: "1.5rem",
                    borderRadius: "12px",
                    marginBottom: "1.5rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                    }}
                >
                    <h3 style={{ margin: 0 }}>All Products</h3>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                            onClick={exportToExcel}
                            className="btn btn-secondary btn-sm"
                            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                        >
                            <Download size={16} />
                            Export
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary btn-sm"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                background: "#C9A84C",
                            }}
                        >
                            <Plus size={16} />
                            Add New Product
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div style={{ position: "relative" }}>
                    <Search
                        size={18}
                        style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#999",
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search products by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.75rem 0.75rem 0.75rem 2.75rem",
                            border: "1px solid #E5E1D8",
                            borderRadius: "8px",
                            fontSize: "0.875rem",
                        }}
                    />
                </div>
            </div>

            {/* Products List */}
            <div
                style={{
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                }}
            >
                {isLoading ? (
                    <div style={{ padding: "3rem", textAlign: "center" }}>
                        <div className="spinner" />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div
                        style={{
                            padding: "3rem",
                            textAlign: "center",
                            color: "#999",
                        }}
                    >
                        {searchTerm ? "No products found" : "No products yet"}
                    </div>
                ) : (
                    <ProductsTable products={filteredProducts} />
                )}
            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <AddProductModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        queryClient.invalidateQueries(["admin-products"]);
                        setShowAddModal(false);
                    }}
                />
            )}
        </div>
    );
}

// Product KPI Card Component
function ProductKPICard({ label, value, icon: Icon, bgColor, iconColor }) {
    return (
        <div
            style={{
                background: "white",
                padding: "1.25rem",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
            }}
        >
            <div
                style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Icon size={24} color={iconColor} />
            </div>
            <div style={{ flex: 1 }}>
                <div
                    style={{
                        fontSize: "1.75rem",
                        fontWeight: "700",
                        color: "#2C2420",
                        marginBottom: "0.25rem",
                    }}
                >
                    {value}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#666" }}>
                    {label}
                </div>
            </div>
        </div>
    );
}

// Products Table Component  
function ProductsTable({ products }) {
    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ borderBottom: "1px solid #E5E1D8" }}>
                        {["SKU", "Product", "Category", "Price/SqFt", "Stock", "Status", "Actions"].map((header) => (
                            <th
                                key={header}
                                style={{
                                    padding: "1rem",
                                    textAlign: "left",
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                    color: "#666",
                                    textTransform: "uppercase",
                                }}
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <ProductRow key={product._id} product={product} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Product Row Component
function ProductRow({ product }) {
    return (
        <tr style={{ borderBottom: "1px solid #F5F5F5" }}>
            <td style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: "600" }}>
                {product.sku}
            </td>
            <td style={{ padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {product.textureImage?.url && (
                        <img
                            src={product.textureImage.url}
                            alt={product.name}
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "6px",
                                objectFit: "cover",
                            }}
                        />
                    )}
                    <span style={{ fontSize: "0.875rem" }}>{product.name}</span>
                </div>
            </td>
            <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                <span
                    style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "12px",
                        background: "#F0E7FF",
                        color: "#8b5cf6",
                        fontSize: "0.75rem",
                    }}
                >
                    {product.category || "Uncategorized"}
                </span>
            </td>
            <td style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: "600" }}>
                ₹{product.pricePerSqFt || 0}
            </td>
            <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                {product.stock || 0}
            </td>
            <td style={{ padding: "1rem" }}>
                <span
                    style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "12px",
                        background: product.isActive !== false ? "#E8F5E9" : "#FFE8E8",
                        color: product.isActive !== false ? "#4caf50" : "#ef4444",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                    }}
                >
                    {product.isActive !== false ? "Active" : "Inactive"}
                </span>
            </td>
            <td style={{ padding: "1rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "0.375rem" }}
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "0.375rem", color: "#ef4444" }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

// Add Product Modal Component (placeholder - will use old AdminPage form)
function AddProductModal({ onClose, onSuccess }) {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2000,
                background: "rgba(44,36,32,0.55)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: "white",
                    borderRadius: "20px",
                    width: "100%",
                    maxWidth: "600px",
                    maxHeight: "92vh",
                    overflowY: "auto",
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        padding: "1.25rem 1.5rem",
                        borderBottom: "1px solid #E5E1D8",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <h3 style={{ margin: 0 }}>Add New Product</h3>
                    <button onClick={onClose} className="btn btn-ghost btn-sm">
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: "1.5rem", textAlign: "center", color: "#666" }}>
                    Product form will be implemented here (using old AdminPage form structure)
                </div>
            </div>
        </div>
    );
}
}

function OrdersSection() {
    return (
        <PlaceholderSection
            title="Orders"
            description="View and manage customer orders"
        />
    );
}

function QuotesSection() {
    return (
        <PlaceholderSection
            title="Quotes"
            description="Handle quote requests"
        />
    );
}

function ClientsSection() {
    return (
        <PlaceholderSection
            title="Clients"
            description="Manage client information"
        />
    );
}

function RendersSection() {
    return (
        <PlaceholderSection
            title="Renders"
            description="View all customer renders"
        />
    );
}

function CategoriesSection() {
    return (
        <PlaceholderSection
            title="Categories"
            description="Organize product categories"
        />
    );
}

function ReviewsSection() {
    return (
        <PlaceholderSection
            title="Reviews"
            description="Moderate customer reviews"
        />
    );
}

function UsersSection() {
    return (
        <PlaceholderSection title="Users" description="Manage system users" />
    );
}

function CouponsSection() {
    return (
        <PlaceholderSection
            title="Coupons"
            description="Create and manage discount coupons"
        />
    );
}

function SettingsSection() {
    return (
        <PlaceholderSection
            title="Settings"
            description="Configure system settings"
        />
    );
}

function PlaceholderSection({ title, description }) {
    return (
        <div
            style={{
                background: "white",
                borderRadius: "16px",
                padding: "3rem",
                textAlign: "center",
                border: "1px solid #E5E1D8",
            }}
        >
            <h2
                style={{
                    margin: "0 0 0.5rem 0",
                    fontSize: "1.5rem",
                    color: "#2C2420",
                }}
            >
                {title}
            </h2>
            <p style={{ margin: 0, color: "#6B5D4F", fontSize: "0.875rem" }}>
                {description}
            </p>
            <p
                style={{
                    marginTop: "1rem",
                    color: "#999",
                    fontSize: "0.8125rem",
                }}
            >
                Content coming soon...
            </p>
        </div>
    );
}
