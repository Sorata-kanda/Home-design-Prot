import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Image, Trash2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI } from "../../utils/api";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminRenders() {
    const [search, setSearch] = useState("");
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["admin-renders"],
        queryFn: () => adminAPI.allRenders().then((r) => r.data),
    });

    const deleteRender = useMutation({
        mutationFn: (id) => adminAPI.deleteRender(id),
        onSuccess: () => { queryClient.invalidateQueries(["admin-renders"]); toast.success("Render deleted"); },
        onError: () => toast.error("Failed to delete"),
    });

    const renders = (data?.renders || []).filter((r) => {
        if (!search.trim()) return true;
        const s = search.toLowerCase();
        return (r.user?.name || "").toLowerCase().includes(s) || (r.title || "").toLowerCase().includes(s);
    });

    return (
        <AdminLayout>
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C2420", margin: 0 }}>All Renders</h1>
                        <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: "4px 0 0" }}>{data?.total || 0} total visualizations across all users</p>
                    </div>
                    <div style={{ position: "relative" }}>
                        <Search size={14} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user or title…" style={{ paddingLeft: "2.25rem", paddingRight: "0.75rem", paddingTop: "0.4rem", paddingBottom: "0.4rem", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "0.875rem", outline: "none", width: "250px" }} />
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "4rem" }}><div className="spinner" /></div>
                ) : renders.length === 0 ? (
                    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E1D8", padding: "4rem", textAlign: "center", color: "#9CA3AF" }}>
                        <Image size={44} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
                        <p style={{ margin: 0 }}>No renders found</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
                        {renders.map((r) => {
                            const daysLeft = Math.max(0, Math.ceil((new Date(r.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)));
                            return (
                                <div key={r._id} style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E1D8", overflow: "hidden" }}>
                                    {/* Before/After preview */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: 100 }}>
                                        <div style={{ position: "relative", overflow: "hidden" }}>
                                            <img src={r.originalPhoto?.url} alt="Before" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            <span style={{ position: "absolute", bottom: 3, left: 3, fontSize: "0.6rem", background: "rgba(0,0,0,0.6)", color: "white", padding: "1px 4px", borderRadius: 4 }}>Before</span>
                                        </div>
                                        <div style={{ position: "relative", overflow: "hidden" }}>
                                            <img src={r.renderedPhoto?.url || r.originalPhoto?.url} alt="After" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            <span style={{ position: "absolute", bottom: 3, left: 3, fontSize: "0.6rem", background: "#C9A84C", color: "white", padding: "1px 4px", borderRadius: 4 }}>After</span>
                                        </div>
                                    </div>

                                    <div style={{ padding: "0.875rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#2C2420" }}>{r.title || "Untitled"}</div>
                                                <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>by {r.user?.name || "Unknown"}</div>
                                            </div>
                                            {r.isShared && <span style={{ fontSize: "0.65rem", padding: "2px 6px", background: "#EFF6FF", color: "#2563EB", borderRadius: 20, fontWeight: 600 }}>Shared</span>}
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#9CA3AF", marginBottom: "0.75rem" }}>
                                            <span>{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                                            <span style={{ color: daysLeft < 3 ? "#EF4444" : "#9CA3AF" }}>{daysLeft}d left</span>
                                        </div>

                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            {r.isShared && (
                                                <a href={`/view/${r.shareToken}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "0.4rem", border: "1px solid #E5E1D8", borderRadius: 6, fontSize: "0.75rem", color: "#4B5563", textDecoration: "none" }}>
                                                    <ExternalLink size={12} /> View
                                                </a>
                                            )}
                                            <button onClick={() => { if (window.confirm("Delete this render?")) deleteRender.mutate(r._id); }} style={{ flex: r.isShared ? "none" : 1, padding: "0.4rem 0.75rem", background: "#FEE2E2", border: "none", borderRadius: 6, fontSize: "0.75rem", color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
