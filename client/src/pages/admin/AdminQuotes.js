import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, MessageSquare, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { quotesAPI } from "../../utils/api";
import AdminLayout from "../../components/admin/AdminLayout";

const STATUS_OPTIONS = ["new", "contacted", "quoted", "converted", "closed"];
const STATUS_COLORS = {
    new: { bg: "#ECFDF5", text: "#059669" },
    contacted: { bg: "#EFF6FF", text: "#2563EB" },
    quoted: { bg: "#FEF3E2", text: "#C9A84C" },
    converted: { bg: "#F0FDF4", text: "#16A34A" },
    closed: { bg: "#F3F4F6", text: "#6B7280" },
};

export default function AdminQuotes() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [expandedId, setExpandedId] = useState(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["admin-quotes-full"],
        queryFn: () => quotesAPI.getAll().then((r) => r.data),
    });

    const updateStatus = useMutation({
        mutationFn: ({ id, status, adminNotes }) => quotesAPI.updateStatus(id, { status, adminNotes }),
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-quotes-full"]);
            toast.success("Quote status updated");
        },
        onError: () => toast.error("Failed to update status"),
    });

    const quotes = (data?.quotes || []).filter((q) => {
        if (statusFilter !== "all" && q.status !== statusFilter) return false;
        if (search.trim()) {
            const s = search.toLowerCase();
            return (
                (q.contactName || "").toLowerCase().includes(s) ||
                (q.contactPhone || "").toLowerCase().includes(s) ||
                (q.city || "").toLowerCase().includes(s)
            );
        }
        return true;
    });

    const counts = STATUS_OPTIONS.reduce((acc, s) => {
        acc[s] = (data?.quotes || []).filter((q) => q.status === s).length;
        return acc;
    }, { all: (data?.quotes || []).length });

    return (
        <AdminLayout>
            <div>
                {/* Header */}
                <div style={{ marginBottom: "1.5rem" }}>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C2420", margin: 0 }}>Quote Requests</h1>
                    <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: "4px 0 0" }}>Manage and respond to customer estimate requests</p>
                </div>

                {/* Tabs + Search */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E5E1D8", paddingBottom: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.25rem", overflowX: "auto" }}>
                        {["all", ...STATUS_OPTIONS].map((s) => (
                            <button key={s} onClick={() => setStatusFilter(s)} style={{
                                padding: "0.4rem 0.875rem", border: "none",
                                background: statusFilter === s ? "#2C2420" : "transparent",
                                color: statusFilter === s ? "white" : "#6B7280",
                                borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500,
                                textTransform: "capitalize",
                            }}>
                                {s === "all" ? "All" : s} <span style={{ opacity: 0.75 }}>({counts[s] || 0})</span>
                            </button>
                        ))}
                    </div>
                    <div style={{ position: "relative" }}>
                        <Search size={14} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quotes…" style={{ paddingLeft: "2rem", paddingRight: "0.75rem", paddingTop: "0.4rem", paddingBottom: "0.4rem", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "0.875rem", outline: "none", width: "220px" }} />
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "4rem" }}><div className="spinner" /></div>
                ) : quotes.length === 0 ? (
                    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E1D8", padding: "4rem", textAlign: "center", color: "#9CA3AF" }}>
                        <MessageSquare size={44} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
                        <p style={{ margin: 0 }}>No quotes found</p>
                    </div>
                ) : (
                    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E1D8", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ background: "#F8F6F3" }}>
                                <tr>
                                    {["Client", "Phone", "City", "Estimate", "Status", "Date", "Actions"].map((h) => (
                                        <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {quotes.map((q) => {
                                    const sc = STATUS_COLORS[q.status] || { bg: "#F3F4F6", text: "#555" };
                                    const isExpanded = expandedId === q._id;
                                    return (
                                        <>
                                            <tr key={q._id} style={{ borderTop: "1px solid #F3F4F6", cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? null : q._id)}>
                                                <td style={{ padding: "0.875rem 1rem" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#C9A84C", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>
                                                            {q.contactName?.charAt(0) || "?"}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#2C2420" }}>{q.contactName}</div>
                                                            <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>{q.contactEmail}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#4B5563" }}>{q.contactPhone}</td>
                                                <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#4B5563" }}>{q.city}</td>
                                                <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", fontWeight: 700, color: "#2C2420" }}>₹{q.totalEstimate?.toLocaleString("en-IN")}</td>
                                                <td style={{ padding: "0.875rem 1rem" }}>
                                                    <select
                                                        value={q.status || "new"}
                                                        onChange={(e) => { e.stopPropagation(); updateStatus.mutate({ id: q._id, status: e.target.value }); }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{ padding: "0.25rem 0.5rem", background: sc.bg, color: sc.text, border: "none", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}
                                                    >
                                                        {STATUS_OPTIONS.map((s) => <option key={s} value={s} style={{ textTransform: "capitalize" }}>{s}</option>)}
                                                    </select>
                                                </td>
                                                <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "#9CA3AF" }}>{new Date(q.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                                                <td style={{ padding: "0.875rem 1rem" }}>
                                                    <ChevronDown size={16} style={{ color: "#9CA3AF", transform: isExpanded ? "rotate(180deg)" : "none", transition: "0.2s" }} />
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr key={`${q._id}-expand`} style={{ background: "#F8F6F3" }}>
                                                    <td colSpan={7} style={{ padding: "1rem 1.25rem" }}>
                                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                                            <div>
                                                                <strong style={{ fontSize: "0.8rem", color: "#6B7280" }}>Client Message</strong>
                                                                <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#2C2420" }}>{q.clientMessage || "No message provided."}</p>
                                                            </div>
                                                            <div>
                                                                <strong style={{ fontSize: "0.8rem", color: "#6B7280" }}>Line Items</strong>
                                                                {q.lineItems?.map((li, i) => (
                                                                    <div key={i} style={{ fontSize: "0.8rem", color: "#4B5563" }}>{li.productName} — {li.zone} — {li.estimatedArea} sqft @ ₹{li.pricePerSqFt}/sqft</div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
