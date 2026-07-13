import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";
import { couponsAPI } from "../../utils/api";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminCoupons() {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ code: "", discount: "", type: "percent", expiresAt: "" });
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["admin-coupons"],
        queryFn: () => couponsAPI.getAll().then((r) => r.data),
    });

    const createCoupon = useMutation({
        mutationFn: (data) => couponsAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-coupons"]);
            toast.success("Coupon created");
            setShowForm(false);
            setForm({ code: "", discount: "", type: "percent", expiresAt: "" });
        },
        onError: (e) => toast.error(e.response?.data?.error || "Failed to create"),
    });

    const toggleCoupon = useMutation({
        mutationFn: ({ id, active }) => couponsAPI.update(id, { active }),
        onSuccess: () => queryClient.invalidateQueries(["admin-coupons"]),
    });

    const deleteCoupon = useMutation({
        mutationFn: (id) => couponsAPI.delete(id),
        onSuccess: () => { queryClient.invalidateQueries(["admin-coupons"]); toast.success("Coupon deleted"); },
    });

    const coupons = data?.coupons || [];

    return (
        <AdminLayout>
            <div>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C2420", margin: 0 }}>Coupons</h1>
                        <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: "4px 0 0" }}>{coupons.length} discount codes active</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1.25rem", background: "#2C2420", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}
                    >
                        <Plus size={16} /> New Coupon
                    </button>
                </div>

                {/* Create Form */}
                {showForm && (
                    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E1D8", padding: "1.5rem", marginBottom: "1.5rem" }}>
                        <h3 style={{ margin: "0 0 1rem", color: "#2C2420" }}>Create Coupon</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                            <div>
                                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4B5563", display: "block", marginBottom: 4 }}>Code</label>
                                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SAVE20" style={{ width: "100%", padding: "0.5rem", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "0.875rem", outline: "none" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4B5563", display: "block", marginBottom: 4 }}>Discount</label>
                                <input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="e.g. 10" type="number" min="1" style={{ width: "100%", padding: "0.5rem", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "0.875rem", outline: "none" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4B5563", display: "block", marginBottom: 4 }}>Type</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ width: "100%", padding: "0.5rem", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "0.875rem", outline: "none" }}>
                                    <option value="percent">Percentage (%)</option>
                                    <option value="flat">Flat Amount (₹)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4B5563", display: "block", marginBottom: 4 }}>Expires</label>
                                <input value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} type="date" style={{ width: "100%", padding: "0.5rem", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "0.875rem", outline: "none" }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button onClick={() => createCoupon.mutate(form)} disabled={!form.code || !form.discount} style={{ padding: "0.5rem 1.25rem", background: "#C9A84C", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", opacity: (!form.code || !form.discount) ? 0.5 : 1 }}>
                                {createCoupon.isPending ? "Creating…" : "Create Coupon"}
                            </button>
                            <button onClick={() => setShowForm(false)} style={{ padding: "0.5rem 1rem", background: "transparent", border: "1px solid #D1D5DB", borderRadius: "8px", cursor: "pointer", fontSize: "0.875rem" }}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* Coupons Grid */}
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "4rem" }}><div className="spinner" /></div>
                ) : coupons.length === 0 ? (
                    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E1D8", padding: "4rem", textAlign: "center", color: "#9CA3AF" }}>
                        <Tag size={44} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
                        <p style={{ margin: 0 }}>No coupons created yet</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                        {coupons.map((c) => (
                            <div key={c.id} style={{ background: "white", borderRadius: "12px", border: `1px solid ${c.active ? "#E5E1D8" : "#E5E1D8"}`, padding: "1.25rem", opacity: c.active ? 1 : 0.55, position: "relative", overflow: "hidden" }}>
                                {!c.active && <div style={{ position: "absolute", top: 8, right: 8, fontSize: "0.65rem", background: "#F3F4F6", color: "#6B7280", padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>INACTIVE</div>}
                                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.875rem" }}>
                                    <div style={{ width: 40, height: 40, background: "#FEF3E2", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Tag size={18} color="#C9A84C" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#2C2420", letterSpacing: "0.05em" }}>{c.code}</div>
                                        <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>{c.uses} uses</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#C9A84C", marginBottom: "0.25rem" }}>
                                    {c.type === "percent" ? `${c.discount}% OFF` : `₹${c.discount} OFF`}
                                </div>
                                {c.expiresAt && <div style={{ fontSize: "0.75rem", color: "#9CA3AF", marginBottom: "1rem" }}>Expires {c.expiresAt}</div>}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <button onClick={() => toggleCoupon.mutate({ id: c.id, active: !c.active })} style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: c.active ? "#059669" : "#9CA3AF" }}>
                                        {c.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                        {c.active ? "Active" : "Inactive"}
                                    </button>
                                    <button onClick={() => { if (window.confirm(`Delete coupon ${c.code}?`)) deleteCoupon.mutate(c.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444" }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
