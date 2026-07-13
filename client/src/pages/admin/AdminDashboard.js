import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Users, Package, TrendingUp, TrendingDown, MessageSquare, Calendar,
    ShoppingCart, DollarSign, Activity, BarChart2,
} from "lucide-react";
import { adminAPI, quotesAPI, ordersAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import AdminLayout from "../../components/admin/AdminLayout";

// ─── SMALL SVG LINE CHART ──────────────────────────────────────────────────
function LineChart({ data, color = "#C9A84C", height = 200 }) {
    if (!data || data.length === 0) return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc" }}>No data yet</div>;

    const values = data.map((d) => d.revenue);
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const range = max - min || 1;
    const w = 100;
    const h = 100;
    const pad = 8;

    const points = values.map((v, i) => {
        const x = pad + (i / (values.length - 1 || 1)) * (w - 2 * pad);
        const y = pad + ((max - v) / range) * (h - 2 * pad);
        return `${x},${y}`;
    });
    const pointsStr = points.join(" ");

    // Fill area
    const fillPath = `M${points[0]} L${pointsStr.split(" ").slice(1).join(" ")} L${pad + (w - 2 * pad)},${h - pad} L${pad},${h - pad} Z`;

    return (
        <div style={{ position: "relative" }}>
            <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }}>
                <defs>
                    <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                <path d={fillPath} fill="url(#lineGrad)" />
                <polyline points={pointsStr} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {values.map((v, i) => {
                    const [x, y] = points[i].split(",").map(Number);
                    return <circle key={i} cx={x} cy={y} r="2.5" fill={color} stroke="white" strokeWidth="1.5" />;
                })}
            </svg>
            {/* X-axis labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingLeft: 12, paddingRight: 12 }}>
                {data.map((d, i) => (
                    <span key={i} style={{ fontSize: "0.65rem", color: "#9CA3AF", whiteSpace: "nowrap" }}>
                        {d.label?.split(" ").slice(0, 2).join(" ")}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─── DONUT CHART ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
    processing: "#F59E0B",
    shipped: "#3B82F6",
    delivered: "#10B981",
    cancelled: "#EF4444",
};

function DonutChart({ data }) {
    if (!data || data.length === 0) return <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc" }}>No orders yet</div>;

    const total = data.reduce((s, d) => s + d.count, 0);
    const r = 38, cx = 50, cy = 50, strokeW = 18;
    const circumference = 2 * Math.PI * r;

    let acc = 0;
    const segments = data.map((d) => {
        const pct = d.count / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const offset = circumference - acc * circumference;
        acc += pct;
        return { ...d, dash, gap, offset };
    });

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            <svg viewBox="0 0 100 100" style={{ width: 160, height: 160, flexShrink: 0 }}>
                {segments.map((s, i) => (
                    <circle key={i} cx={cx} cy={cy} r={r}
                        fill="none"
                        stroke={STATUS_COLORS[s._id] || "#9CA3AF"}
                        strokeWidth={strokeW}
                        strokeDasharray={`${s.dash} ${s.gap}`}
                        strokeDashoffset={s.offset}
                        transform="rotate(-90 50 50)"
                    />
                ))}
                <text x="50" y="54" textAnchor="middle" fontSize="14" fontWeight="700" fill="#2C2420">{total}</text>
                <text x="50" y="64" textAnchor="middle" fontSize="6" fill="#9CA3AF">orders</text>
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {segments.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLORS[s._id] || "#9CA3AF", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.8125rem", color: "#4B5563", textTransform: "capitalize" }}>{s._id}</span>
                        <strong style={{ fontSize: "0.8125rem", marginLeft: "auto", paddingLeft: "1rem" }}>{s.count}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, change, isPositive, icon, bgColor, prefix = "" }) {
    return (
        <div style={{ background: "white", borderRadius: "12px", padding: "1.25rem", border: "1px solid #E5E1D8", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 56, height: 56, background: bgColor, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.8125rem", color: "#6B5D4F", marginBottom: "0.25rem", fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C2420", marginBottom: "0.5rem" }}>{prefix}{value?.toLocaleString()}</div>
                {change != null && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }}>
                        {isPositive ? <TrendingUp size={12} color="#10b981" /> : <TrendingDown size={12} color="#ef4444" />}
                        <span style={{ color: isPositive ? "#10b981" : "#ef4444", fontWeight: 600 }}>{change}</span>
                        <span style={{ color: "#999" }}>vs last period</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const [chartScope, setChartScope] = useState("week");
    const { user } = useAuth();

    const { data: dashData } = useQuery({
        queryKey: ["admin-dash"],
        queryFn: () => adminAPI.dashboard().then((r) => r.data),
    });
    const { data: analyticsData } = useQuery({
        queryKey: ["admin-analytics"],
        queryFn: () => adminAPI.analytics().then((r) => r.data),
    });
    const { data: quotesData } = useQuery({
        queryKey: ["admin-quotes"],
        queryFn: () => quotesAPI.getAll().then((r) => r.data),
    });
    const { data: ordersData } = useQuery({
        queryKey: ["admin-orders"],
        queryFn: () => ordersAPI.getAll().then((r) => r.data),
    });

    const stats = dashData?.stats || {};
    const chartData = chartScope === "week" ? (analyticsData?.last7Days || []) : (analyticsData?.monthlyRevenue || []).map(m => ({ label: m._id, revenue: m.revenue, orders: m.orders }));

    const totalRevenueLast7 = analyticsData?.last7Days?.reduce((s, d) => s + d.revenue, 0) || 0;

    return (
        <AdminLayout>
            <div>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: "1.75rem", color: "#2C2420", fontWeight: 700 }}>
                            Welcome back, {user?.name?.split(" ")[0] || "Admin"} 👋
                        </h1>
                        <p style={{ margin: "0.5rem 0 0", color: "#6B5D4F", fontSize: "0.875rem" }}>
                            Here's what's happening with your store today.
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "white", border: "1px solid #E5E1D8", borderRadius: "8px", fontSize: "0.875rem", color: "#444" }}>
                        <Calendar size={16} />
                        {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
                    </div>
                </div>

                {/* KPI Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
                    <StatCard label="Total Clients" value={stats.users ?? "—"} change="+Active" isPositive icon={<Users size={24} color="#C9A84C" />} bgColor="#FEF3E2" />
                    <StatCard label="Active Products" value={stats.products ?? "—"} change="Listed" isPositive icon={<Package size={24} color="#C9A84C" />} bgColor="#FFF4E6" />
                    <StatCard label="Total Renders" value={stats.renders ?? "—"} change={`+${analyticsData?.last7Days?.reduce((s, d) => s + d.orders, 0) || 0} this week`} isPositive icon={<Activity size={24} color="#8b5cf6" />} bgColor="#F0E7FF" />
                    <StatCard label="New Quotes" value={stats.newQuotes ?? "—"} change="Pending" isPositive={false} icon={<MessageSquare size={24} color="#ef4444" />} bgColor="#FFE8E8" />
                    <StatCard label="Total Orders" value={stats.totalOrders ?? "—"} change="All time" isPositive icon={<ShoppingCart size={24} color="#3B82F6" />} bgColor="#EFF6FF" />
                    <StatCard label="Revenue (7d)" value={`₹${totalRevenueLast7.toLocaleString("en-IN")}`} change="paid orders" isPositive icon={<DollarSign size={24} color="#10B981" />} bgColor="#ECFDF5" />
                </div>

                {/* Charts Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
                    {/* Sales Line Chart */}
                    <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", border: "1px solid #E5E1D8" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.125rem", color: "#2C2420" }}>Revenue Overview</h3>
                                <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>Paid orders only</span>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                {["week", "month"].map((s) => (
                                    <button key={s} onClick={() => setChartScope(s)} style={{ padding: "0.35rem 0.75rem", border: "1px solid #E5E1D8", borderRadius: "6px", fontSize: "0.75rem", background: chartScope === s ? "#2C2420" : "white", color: chartScope === s ? "white" : "#555", cursor: "pointer" }}>
                                        {s === "week" ? "7 Days" : "6 Months"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <LineChart data={chartData} height={200} />
                    </div>

                    {/* Orders Donut */}
                    <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", border: "1px solid #E5E1D8" }}>
                        <h3 style={{ margin: "0 0 1.25rem", fontSize: "1.125rem", color: "#2C2420" }}>Orders by Status</h3>
                        <DonutChart data={analyticsData?.ordersByStatus || []} />
                    </div>
                </div>

                {/* Top Products Table */}
                {analyticsData?.topProducts?.length > 0 && (
                    <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", border: "1px solid #E5E1D8", marginBottom: "2rem" }}>
                        <h3 style={{ margin: "0 0 1rem", fontSize: "1.125rem", color: "#2C2420" }}>Top Ordered Products</h3>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #E5E1D8" }}>
                                    {["Product", "Orders", "Revenue"].map((h) => (
                                        <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontSize: "0.8125rem", color: "#6B7280", fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {analyticsData.topProducts.map((p, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                                        <td style={{ padding: "0.625rem 0.75rem", fontSize: "0.875rem", color: "#2C2420", fontWeight: 500 }}>{p._id || "Unknown"}</td>
                                        <td style={{ padding: "0.625rem 0.75rem", fontSize: "0.875rem" }}>{p.count}</td>
                                        <td style={{ padding: "0.625rem 0.75rem", fontSize: "0.875rem", color: "#059669", fontWeight: 600 }}>₹{p.revenue?.toLocaleString("en-IN")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Recent Quotes & Orders */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    {/* Quotes */}
                    <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", border: "1px solid #E5E1D8" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Recent Quote Requests</h3>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {(quotesData?.quotes || []).slice(0, 4).map((quote) => (
                                <div key={quote._id} style={{ padding: "0.875rem", background: "#F8F6F3", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#C9A84C", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 600, flexShrink: 0 }}>
                                            {quote.contactName?.charAt(0) || "U"}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#2C2420" }}>{quote.contactName}</div>
                                            <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>{quote.city} · ₹{quote.totalEstimate?.toLocaleString("en-IN")}</div>
                                        </div>
                                    </div>
                                    <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 600, background: quote.status === "new" ? "#ECFDF5" : "#FEF3E2", color: quote.status === "new" ? "#059669" : "#C9A84C" }}>
                                        {quote.status || "new"}
                                    </span>
                                </div>
                            )) || <div style={{ padding: "2rem", textAlign: "center", color: "#999" }}>No recent quotes</div>}
                        </div>
                    </div>

                    {/* Orders */}
                    <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", border: "1px solid #E5E1D8" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Recent Orders</h3>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {(ordersData?.orders || []).slice(0, 4).map((order) => (
                                <div key={order._id} style={{ padding: "0.875rem", background: "#F8F6F3", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#2C2420" }}>{order.contactName || order.user?.name || "Customer"}</div>
                                        <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>₹{order.totalAmount?.toLocaleString("en-IN")} · {order.lineItems?.length} items</div>
                                    </div>
                                    <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 600, background: "#FEF3E2", color: "#C9A84C", textTransform: "capitalize" }}>
                                        {order.fulfillmentStatus || "processing"}
                                    </span>
                                </div>
                            )) || <div style={{ padding: "2rem", textAlign: "center", color: "#999" }}>No recent orders</div>}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
