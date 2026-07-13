import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Users, Shield, Trash2, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI } from "../../utils/api";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminUsers() {
    const [search, setSearch] = useState("");
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["admin-users-all", search],
        queryFn: () => adminAPI.users({ search: search || undefined }).then((r) => r.data),
    });

    const updateUser = useMutation({
        mutationFn: ({ id, ...data }) => adminAPI.updateUser(id, data),
        onSuccess: () => { queryClient.invalidateQueries(["admin-users-all"]); toast.success("User updated"); },
        onError: () => toast.error("Failed to update"),
    });

    const deleteUser = useMutation({
        mutationFn: (id) => adminAPI.deleteUser(id),
        onSuccess: () => { queryClient.invalidateQueries(["admin-users-all"]); toast.success("User deleted"); },
        onError: () => toast.error("Delete failed"),
    });

    const users = data?.users || [];
    const adminCount = users.filter((u) => u.role === "admin").length;
    const clientCount = users.filter((u) => u.role === "client").length;

    return (
        <AdminLayout>
            <div>
                {/* Header */}
                <div style={{ marginBottom: "1.5rem" }}>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C2420", margin: 0 }}>User Management</h1>
                    <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: "4px 0 0" }}>{data?.total || 0} total users · {adminCount} admins · {clientCount} clients</p>
                </div>

                {/* Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E1D8", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Users size={22} color="#2563EB" />
                        </div>
                        <div>
                            <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>Total Clients</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2C2420" }}>{clientCount}</div>
                        </div>
                    </div>
                    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E1D8", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FEF3E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Shield size={22} color="#C9A84C" />
                        </div>
                        <div>
                            <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>Admin Accounts</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2C2420" }}>{adminCount}</div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div style={{ position: "relative", marginBottom: "1.5rem", width: "300px" }}>
                    <Search size={14} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" style={{ paddingLeft: "2.25rem", paddingRight: "0.75rem", paddingTop: "0.4rem", paddingBottom: "0.4rem", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "0.875rem", outline: "none", width: "100%" }} />
                </div>

                {/* Table */}
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "4rem" }}><div className="spinner" /></div>
                ) : (
                    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E1D8", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ background: "#F8F6F3" }}>
                                <tr>
                                    {["User", "Email", "Role", "Verified", "Joined", "Actions"].map((h) => (
                                        <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, color: "#6B7280" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id} style={{ borderTop: "1px solid #F3F4F6" }}>
                                        <td style={{ padding: "0.875rem 1rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                                                <div style={{ width: 34, height: 34, borderRadius: "50%", background: u.role === "admin" ? "#2C2420" : "#C9A84C", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, flexShrink: 0 }}>
                                                    {u.name?.charAt(0)}
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#2C2420" }}>{u.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#4B5563" }}>{u.email}</td>
                                        <td style={{ padding: "0.875rem 1rem" }}>
                                            <select value={u.role} onChange={(e) => updateUser.mutate({ id: u._id, role: e.target.value })} style={{ padding: "0.25rem 0.5rem", background: u.role === "admin" ? "#FEF3E2" : "#ECFDF5", color: u.role === "admin" ? "#C9A84C" : "#059669", border: "none", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                                                <option value="client">Client</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: "0.875rem 1rem" }}>
                                            <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: 20, fontWeight: 600, background: u.isVerified ? "#ECFDF5" : "#FEF3E2", color: u.isVerified ? "#059669" : "#D97706" }}>
                                                {u.isVerified ? "Verified" : "Unverified"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "#9CA3AF" }}>{new Date(u.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                                        <td style={{ padding: "0.875rem 1rem" }}>
                                            <button onClick={() => { if (window.confirm(`Delete user ${u.name}?`)) deleteUser.mutate(u._id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444" }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
