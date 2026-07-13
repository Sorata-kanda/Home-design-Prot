import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, Trash2 } from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import toast from "react-hot-toast";

// Simulated reviews — no Review model in schema. Can be replaced with API call when model is added.
const MOCK_REVIEWS = [
    { _id: "r1", author: "Priya Sharma", product: "Italian Carrara White Marble", rating: 5, text: "Absolutely stunning marble, the texture visualization was spot on. Delivered perfectly.", status: "approved", date: "2026-06-28" },
    { _id: "r2", author: "Rahul Mehta", product: "Black Galaxy Granite", rating: 4, text: "Good quality stone, very happy with the final install. Minor delay in shipping.", status: "approved", date: "2026-07-01" },
    { _id: "r3", author: "Anjali Reddy", product: "Gwalior Beige Sandstone", rating: 5, text: "Loved the AI room visualizer feature! Helped me finalize the wainscoting choice.", status: "pending", date: "2026-07-09" },
    { _id: "r4", author: "Vikram Singh", product: "Moca Crema Limestone", rating: 3, text: "Good but the finish was slightly off from the sample. Customer support helpful though.", status: "pending", date: "2026-07-11" },
    { _id: "r5", author: "Sunita Patel", product: "Italian Carrara White Marble", rating: 2, text: "Not satisfied with the polish quality. Expected better on premium grade.", status: "flagged", date: "2026-07-12" },
];

export default function AdminReviews() {
    const [reviews, setReviews] = useState(MOCK_REVIEWS);
    const [filter, setFilter] = useState("all");

    const updateStatus = (id, status) => {
        setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
        toast.success(`Review ${status}`);
    };

    const deleteReview = (id) => {
        setReviews((prev) => prev.filter((r) => r._id !== id));
        toast.success("Review removed");
    };

    const filtered = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);
    const counts = { all: reviews.length, pending: reviews.filter((r) => r.status === "pending").length, approved: reviews.filter((r) => r.status === "approved").length, flagged: reviews.filter((r) => r.status === "flagged").length };

    const STATUS_COLORS = {
        approved: { bg: "#ECFDF5", text: "#059669" },
        pending: { bg: "#FEF3E2", text: "#D97706" },
        flagged: { bg: "#FEE2E2", text: "#DC2626" },
    };

    return (
        <AdminLayout>
            <div>
                <div style={{ marginBottom: "1.5rem" }}>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C2420", margin: 0 }}>Reviews</h1>
                    <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: "4px 0 0" }}>Moderate customer product reviews</p>
                </div>

                {/* Status tabs */}
                <div style={{ display: "flex", gap: "0.25rem", borderBottom: "1px solid #E5E1D8", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
                    {["all", "pending", "approved", "flagged"].map((s) => (
                        <button key={s} onClick={() => setFilter(s)} style={{ padding: "0.4rem 0.875rem", border: "none", background: filter === s ? "#2C2420" : "transparent", color: filter === s ? "white" : "#6B7280", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500, textTransform: "capitalize" }}>
                            {s} ({counts[s]})
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {filtered.map((r) => {
                        const sc = STATUS_COLORS[r.status] || { bg: "#F3F4F6", text: "#555" };
                        return (
                            <div key={r._id} style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E1D8", padding: "1.25rem", display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "start" }}>
                                <div>
                                    {/* Stars */}
                                    <div style={{ display: "flex", gap: 2, marginBottom: "0.5rem" }}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} size={14} fill={s <= r.rating ? "#C9A84C" : "none"} stroke={s <= r.rating ? "#C9A84C" : "#D1D5DB"} />
                                        ))}
                                    </div>
                                    <p style={{ margin: "0 0 0.5rem", fontSize: "0.875rem", color: "#2C2420" }}>"{r.text}"</p>
                                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "#9CA3AF" }}>
                                        <strong style={{ color: "#4B5563" }}>{r.author}</strong>
                                        <span>on {r.product}</span>
                                        <span>{r.date}</span>
                                        <span style={{ padding: "1px 8px", background: sc.bg, color: sc.text, borderRadius: 20, fontWeight: 600, textTransform: "capitalize" }}>{r.status}</span>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    {r.status !== "approved" && (
                                        <button onClick={() => updateStatus(r._id, "approved")} title="Approve" style={{ background: "#ECFDF5", border: "none", borderRadius: 8, padding: "0.4rem 0.6rem", cursor: "pointer", display: "flex", alignItems: "center" }}>
                                            <ThumbsUp size={15} color="#059669" />
                                        </button>
                                    )}
                                    {r.status !== "flagged" && (
                                        <button onClick={() => updateStatus(r._id, "flagged")} title="Flag" style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "0.4rem 0.6rem", cursor: "pointer", display: "flex", alignItems: "center" }}>
                                            <ThumbsDown size={15} color="#DC2626" />
                                        </button>
                                    )}
                                    <button onClick={() => { if (window.confirm("Remove this review?")) deleteReview(r._id); }} title="Delete" style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "0.4rem 0.6rem", cursor: "pointer", display: "flex", alignItems: "center" }}>
                                        <Trash2 size={15} color="#6B7280" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AdminLayout>
    );
}
