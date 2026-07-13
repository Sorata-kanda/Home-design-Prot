import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Download,
    Filter,
    Search,
    Eye,
    MoreVertical,
    ShoppingCart,
    Clock,
    Truck,
    CheckCircle,
    XCircle,
    Check,
} from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/AdminLayout";
import { ordersAPI } from "../../utils/api";
import OrderDetailsModal from "../../components/shared/OrderDetailsModal";

export default function AdminOrders() {
    const queryClient = useQueryClient();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTab, setSelectedTab] = useState("all");
    const [activeDropdownOrder, setActiveDropdownOrder] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [paymentFilter, setPaymentFilter] = useState("all");

    // Fetch all orders
    const { data: ordersData, isLoading, refetch } = useQuery({
        queryKey: ["adminOrders"],
        queryFn: () => ordersAPI.getAll().then((r) => r.data),
    });

    const orders = ordersData?.orders || [];

    // Mutation to update fulfillment
    const updateFulfillmentMutation = useMutation({
        mutationFn: ({ id, status }) => ordersAPI.updateFulfillment(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries(["adminOrders"]);
            refetch();
            toast.success("Order fulfillment status updated!");
            setActiveDropdownOrder(null);
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || "Fulfillment update failed");
        },
    });

    // Compute Metrics based on actual order data
    const totalOrdersCount = orders.length;
    const pendingCount = orders.filter((o) => o.fulfillmentStatus === "processing").length;
    const shippedCount = orders.filter((o) => o.fulfillmentStatus === "shipped").length;
    const deliveredCount = orders.filter((o) => o.fulfillmentStatus === "delivered").length;

    // Filter Logic
    const filteredOrders = orders.filter((order) => {
        // Tab Filter
        if (selectedTab === "pending" && order.fulfillmentStatus !== "processing") return false;
        if (selectedTab === "processing" && order.fulfillmentStatus !== "processing") return false; // model defaults to 'processing'
        if (selectedTab === "shipped" && order.fulfillmentStatus !== "shipped") return false;
        if (selectedTab === "delivered" && order.fulfillmentStatus !== "delivered") return false;
        if (selectedTab === "cancelled" && order.fulfillmentStatus !== "cancelled") return false;

        // Payment status filter
        if (paymentFilter !== "all" && order.paymentStatus !== paymentFilter) return false;

        // Text Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const orderNum = (order.orderNumber || "").toLowerCase();
            const orderId = (order._id || "").toLowerCase();
            const name = (order.contactName || "").toLowerCase();
            const email = (order.contactEmail || "").toLowerCase();
            const phone = (order.contactPhone || "").toLowerCase();

            return (
                orderNum.includes(query) ||
                orderId.includes(query) ||
                name.includes(query) ||
                email.includes(query) ||
                phone.includes(query)
            );
        }

        return true;
    });

    // Selection management
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedOrders(filteredOrders.map((o) => o._id));
        } else {
            setSelectedOrders([]);
        }
    };

    const handleSelectOrder = (orderId) => {
        setSelectedOrders((prev) =>
            prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
        );
    };

    // Client-side CSV export
    const handleExportCSV = () => {
        if (filteredOrders.length === 0) {
            toast.error("No orders to export");
            return;
        }

        const headers = ["Order ID", "Customer Name", "Customer Email", "Customer Phone", "Items Count", "Amount", "Fulfillment Status", "Payment Status", "Payment Method", "Date"];
        const rows = filteredOrders.map((o) => [
            o.orderNumber || o._id,
            o.contactName,
            o.contactEmail || "",
            o.contactPhone,
            o.lineItems?.length || 0,
            o.totalAmount,
            o.fulfillmentStatus,
            o.paymentStatus,
            o.paymentMethod || "pending",
            new Date(o.createdAt).toLocaleDateString("en-IN"),
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((e) => e.map(val => `"${val}"`).join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `stratum_orders_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV export downloaded!");
    };

    // Helper: format payment tags
    const renderPaymentBadge = (order) => {
        const isPaid = order.paymentStatus === "paid";
        const isCOD = order.paymentMethod === "cod" || order.paymentMethod?.includes("simulated");

        return (
            <span
                style={{
                    padding: "4px 8px",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    background: isPaid ? "#ECFDF5" : "#F3F4F6",
                    color: isPaid ? "#059669" : "#4B5563",
                    textTransform: "uppercase",
                }}
            >
                {isPaid ? "Paid" : isCOD ? "COD" : "Pending"}
            </span>
        );
    };

    return (
        <AdminLayout>
            <div>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.25rem", color: "#2C2420" }}>
                            Orders
                        </h1>
                        <p style={{ color: "#6B7280", fontSize: "0.9rem", margin: 0 }}>
                            View and manage all customer orders.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                            onClick={handleExportCSV}
                            className="btn btn-secondary btn-sm"
                            style={{ display: "flex", alignItems: "center", gap: 6, background: "white", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer" }}
                        >
                            <Download size={16} /> Export
                        </button>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: "flex", alignItems: "center", gap: 6, background: showFilters ? "#F5EFE6" : "white", border: showFilters ? "1px solid #C9A84C" : "1px solid #E5E7EB", borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer" }}
                        >
                            <Filter size={16} /> Filter
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
                    {/* Card 1: Total Orders */}
                    <div style={{ background: "white", borderRadius: "12px", padding: "1.25rem", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContext: "center", justifyContent: "center", color: "#D97706" }}>
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <span style={{ fontSize: "0.875rem", color: "#6B7280", display: "block" }}>Total Orders</span>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                <strong style={{ fontSize: "1.5rem", color: "#1F2937" }}>{totalOrdersCount}</strong>
                                <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "600" }}>+18%</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Pending Orders */}
                    <div style={{ background: "white", borderRadius: "12px", padding: "1.25rem", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#EEF2F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#4B5563" }}>
                            <Clock size={24} />
                        </div>
                        <div>
                            <span style={{ fontSize: "0.875rem", color: "#6B7280", display: "block" }}>Pending Orders</span>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                <strong style={{ fontSize: "1.5rem", color: "#1F2937" }}>{pendingCount}</strong>
                                <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "600" }}>+12%</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Shipped Orders */}
                    <div style={{ background: "white", borderRadius: "12px", padding: "1.25rem", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>
                            <Truck size={24} />
                        </div>
                        <div>
                            <span style={{ fontSize: "0.875rem", color: "#6B7280", display: "block" }}>Shipped Orders</span>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                <strong style={{ fontSize: "1.5rem", color: "#1F2937" }}>{shippedCount}</strong>
                                <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "600" }}>+8%</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Delivered Orders */}
                    <div style={{ background: "white", borderRadius: "12px", padding: "1.25rem", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <span style={{ fontSize: "0.875rem", color: "#6B7280", display: "block" }}>Delivered Orders</span>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                <strong style={{ fontSize: "1.5rem", color: "#1F2937" }}>{deliveredCount}</strong>
                                <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "600" }}>+24%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Controls (Expandable) */}
                {showFilters && (
                    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "#4B5563" }}>Payment Status</label>
                            <select
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value)}
                                style={{ padding: "0.375rem 0.75rem", borderRadius: "6px", border: "1px solid #D1D5DB", outline: "none" }}
                            >
                                <option value="all">All States</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>

                        <button
                            onClick={() => {
                                setPaymentFilter("all");
                                setSearchQuery("");
                                setSelectedTab("all");
                            }}
                            style={{ alignSelf: "flex-end", padding: "0.375rem 0.75rem", background: "none", border: "none", color: "#C9A84C", cursor: "pointer", fontSize: "0.875rem", fontWeight: "600" }}
                        >
                            Reset Filters
                        </button>
                    </div>
                )}

                {/* Search & Tabs Layout */}
                <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                    <div style={{ display: "flex", borderBottom: "1px solid #F3F4F6", flexWrap: "wrap", padding: "0.5rem 1rem", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>

                        {/* Status Tabs */}
                        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto" }}>
                            {[
                                { id: "all", label: "All Orders" },
                                { id: "pending", label: "Pending" },
                                { id: "processing", label: "Processing" },
                                { id: "shipped", label: "Shipped" },
                                { id: "delivered", label: "Delivered" },
                                { id: "cancelled", label: "Cancelled" },
                            ].map((tab) => {
                                const isActive = selectedTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSelectedTab(tab.id)}
                                        style={{
                                            padding: "0.5rem 1rem",
                                            background: "none",
                                            border: "none",
                                            fontSize: "0.875rem",
                                            fontWeight: isActive ? "600" : "500",
                                            color: isActive ? "#C9A84C" : "#6B7280",
                                            borderBottom: isActive ? "2px solid #C9A84C" : "2px solid transparent",
                                            cursor: "pointer",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search Input bar */}
                        <div style={{ position: "relative", width: "260px" }}>
                            <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.45rem 1rem 0.45rem 2.25rem",
                                    fontSize: "0.875rem",
                                    border: "1px solid #D1D5DB",
                                    borderRadius: "8px",
                                    outline: "none",
                                    transition: "border-color 0.15s",
                                }}
                            />
                        </div>
                    </div>

                    {/* Table View */}
                    <div style={{ overflowX: "auto" }}>
                        {isLoading ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
                                <div className="spinner" style={{ width: 36, height: 36 }} />
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#9CA3AF" }}>
                                <ShoppingCart size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                                <p style={{ fontSize: "1rem", margin: 0 }}>No orders match this selection</p>
                            </div>
                        ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                                <thead>
                                    <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", color: "#4B5563", fontWeight: "600" }}>
                                        <th style={{ padding: "1rem", width: "40px" }}>
                                            <input
                                                type="checkbox"
                                                onChange={handleSelectAll}
                                                checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                                            />
                                        </th>
                                        <th style={{ padding: "1rem" }}>Order ID</th>
                                        <th style={{ padding: "1rem" }}>Customer</th>
                                        <th style={{ padding: "1rem" }}>Items</th>
                                        <th style={{ padding: "1rem" }}>Amount</th>
                                        <th style={{ padding: "1rem" }}>Status</th>
                                        <th style={{ padding: "1rem" }}>Payment</th>
                                        <th style={{ padding: "1rem" }}>Date</th>
                                        <th style={{ padding: "1rem", textAlign: "center" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((order) => {
                                        const isSelected = selectedOrders.includes(order._id);
                                        const statusColors = {
                                            processing: { bg: "#FEF3C7", text: "#D97706" },
                                            shipped: { bg: "#EFF6FF", text: "#2563EB" },
                                            delivered: { bg: "#ECFDF5", text: "#059669" },
                                            cancelled: { bg: "#FEE2E2", text: "#DC2626" },
                                        }[order.fulfillmentStatus] || { bg: "#F3F4F6", text: "#4B5563" };

                                        return (
                                            <tr
                                                key={order._id}
                                                style={{
                                                    borderBottom: "1px solid #F3F4F6",
                                                    background: isSelected ? "#FDFBF7" : "transparent",
                                                    transition: "background-color 0.15s",
                                                }}
                                            >
                                                <td style={{ padding: "1rem" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectOrder(order._id)}
                                                    />
                                                </td>
                                                <td style={{ padding: "1rem", fontWeight: "600", color: "#1F2937" }}>
                                                    <span
                                                        onClick={() => setSelectedOrder(order)}
                                                        style={{ cursor: "pointer", color: "#2C2420", textDecoration: "underline" }}
                                                    >
                                                        #{order.orderNumber || order._id.substring(0, 8)}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "1rem" }}>
                                                    <strong style={{ display: "block", color: "#1F2937" }}>{order.contactName}</strong>
                                                    <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>{order.contactEmail || order.contactPhone}</span>
                                                </td>
                                                <td style={{ padding: "1rem" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        {/* Preview Thumbnails */}
                                                        <div style={{ display: "flex", gap: "2px" }}>
                                                            {order.lineItems?.slice(0, 2).map((item, idx) => (
                                                                <img
                                                                    key={idx}
                                                                    src={item.product?.textureImage?.url || item.product?.thumbnailImage?.url}
                                                                    alt=""
                                                                    style={{ width: "30px", height: "30px", borderRadius: "4px", objectFit: "cover", border: "1px solid #E5E7EB" }}
                                                                    onError={(e) => { e.target.style.display = "none"; }}
                                                                />
                                                            ))}
                                                            {order.lineItems?.length > 2 && (
                                                                <div style={{ width: "30px", height: "30px", borderRadius: "4px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "#4B5563", fontWeight: "600" }}>
                                                                    +{order.lineItems.length - 2}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span style={{ color: "#6B7280", fontSize: "0.8rem" }}>{order.lineItems?.length} items</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "1rem", fontWeight: "600", color: "#C9A84C" }}>
                                                    ₹{order.totalAmount?.toLocaleString("en-IN")}
                                                </td>
                                                <td style={{ padding: "1rem" }}>
                                                    <span
                                                        style={{
                                                            padding: "4px 8px",
                                                            borderRadius: "20px",
                                                            fontSize: "0.75rem",
                                                            fontWeight: "600",
                                                            background: statusColors.bg,
                                                            color: statusColors.text,
                                                            textTransform: "capitalize",
                                                        }}
                                                    >
                                                        {order.fulfillmentStatus === "processing" ? "Processing" : order.fulfillmentStatus}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "1rem" }}>
                                                    {renderPaymentBadge(order)}
                                                </td>
                                                <td style={{ padding: "1rem", color: "#6B7280", fontSize: "0.8rem" }}>
                                                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                                                    <span style={{ display: "block", fontSize: "0.7rem", opacity: 0.8 }}>
                                                        {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "1rem" }}>
                                                    <div style={{ display: "flex", justifyContent: "center", gap: "8px", position: "relative" }}>
                                                        <button
                                                            onClick={() => setSelectedOrder(order)}
                                                            title="View Order Details"
                                                            style={{ border: "none", background: "none", cursor: "pointer", color: "#6B7280", padding: "4px" }}
                                                        >
                                                            <Eye size={16} />
                                                        </button>

                                                        {/* Status Update Trigger Dropdown */}
                                                        <div>
                                                            <button
                                                                onClick={() => setActiveDropdownOrder(activeDropdownOrder === order._id ? null : order._id)}
                                                                style={{ border: "none", background: "none", cursor: "pointer", color: "#6B7280", padding: "4px" }}
                                                            >
                                                                <MoreVertical size={16} />
                                                            </button>
                                                            {activeDropdownOrder === order._id && (
                                                                <div
                                                                    style={{
                                                                        position: "absolute",
                                                                        right: 0,
                                                                        top: "100%",
                                                                        background: "white",
                                                                        border: "1px solid #E5E7EB",
                                                                        borderRadius: "8px",
                                                                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                                                        zIndex: 50,
                                                                        minWidth: "150px",
                                                                        padding: "6px 0",
                                                                        textAlign: "left",
                                                                    }}
                                                                >
                                                                    <div style={{ fontSize: "0.75rem", padding: "6px 12px", borderBottom: "1px solid #F3F4F6", color: "#9CA3AF", fontWeight: "600", textTransform: "uppercase" }}>
                                                                        Update State
                                                                    </div>
                                                                    {[
                                                                        { id: "processing", label: "Processing" },
                                                                        { id: "shipped", label: "Shipped" },
                                                                        { id: "delivered", label: "Delivered" },
                                                                        { id: "cancelled", label: "Cancelled" },
                                                                    ].map((opt) => (
                                                                        <button
                                                                            key={opt.id}
                                                                            onClick={() => updateFulfillmentMutation.mutate({ id: order._id, status: opt.id })}
                                                                            style={{
                                                                                width: "100%",
                                                                                border: "none",
                                                                                background: order.fulfillmentStatus === opt.id ? "#F3F4F6" : "transparent",
                                                                                padding: "8px 12px",
                                                                                fontSize: "0.8125rem",
                                                                                color: order.fulfillmentStatus === opt.id ? "#2C2420" : "#4B5563",
                                                                                cursor: "pointer",
                                                                                display: "flex",
                                                                                justifyContent: "space-between",
                                                                                alignItems: "center",
                                                                            }}
                                                                        >
                                                                            {opt.label}
                                                                            {order.fulfillmentStatus === opt.id && <Check size={12} />}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Show Order Details Drawer Modal */}
            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </AdminLayout>
    );
}
