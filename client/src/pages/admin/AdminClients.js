import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Users, Trash2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI } from "../../utils/api";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminClients() {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("client");
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["admin-clients", search, roleFilter],
        queryFn: () => adminAPI.users({ search: search || undefined, role: roleFilter || undefined }).then((r) => r.data),
    });

    const updateRole = useMutation({
        mutationFn: ({ id, role }) => adminAPI.updateUser(id, { role }),
        onSuccess: () => { queryClient.invalidateQueries(["admin-clients"]); toast.success("Role updated"); },
        onError: () => toast.error("Failed to update"),
    });

    const deleteUser = useMutation({
        mutationFn: (id) => adminAPI.deleteUser(id),
        onSuccess: () => { queryClient.invalidateQueries(["admin-clients"]); toast.success("User deleted"); },
        onError: () => toast.error("Failed to delete"),
    });

    const users = data?.users || [];

    return (
        <AdminLayout>
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C2420", margin: 0 }}>Clients</h1>
                        <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: "4px 0 0" }}>{data?.total || 0} registered users</p>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                        <Search size={14} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients…" style={{ paddingLeft: "2.25rem", paddingRight: "0.75rem", paddingTop: "0.4rem", paddingBottom: "0.4rem", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "0.875rem", outline: "none", width: "260px" }} />
                    </div>
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: "0.4rem 0.75rem", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "0.875rem", outline: "none" }}>
                        <option value="">All Roles</option>
                        <option value="client">Clients</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "4rem" }}><div className="spinner" /></div>
                ) : users.length === 0 ? (
                    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E1D8", padding: "4rem", textAlign: "center", color: "#9CA3AF" }}>
                        <Users size={44} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
                        <p style={{ margin: 0 }}>No users found</p>
                    </div>
                ) : (
                    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E1D8", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ background: "#F8F6F3" }}>
                                <tr>
                                    {["User", "Email", "Phone", "City", "Role", "Joined", "Actions"].map((h) => (
                                        <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, color: "#6B7280" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id} style={{ borderTop: "1px solid #F3F4F6" }}>
                                        <td style={{ padding: "0.875rem 1rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: u.role === "admin" ? "#2C2420" : "#C9A84C", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, flexShrink: 0 }}>
                                                    {u.name?.charAt(0) || "?"}
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#2C2420" }}>{u.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#4B5563" }}>{u.email}</td>
                                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#4B5563" }}>{u.phone || "—"}</td>
                                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#4B5563" }}>{u.city || u.address?.city || "—"}</td>
                                        <td style={{ padding: "0.875rem 1rem" }}>
                                            <select
                                                value={u.role}
                                                onChange={(e) => updateRole.mutate({ id: u._id, role: e.target.value })}
                                                style={{ padding: "0.25rem 0.5rem", background: u.role === "admin" ? "#FEF3E2" : "#ECFDF5", color: u.role === "admin" ? "#C9A84C" : "#059669", border: "none", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                                            >
                                                <option value="client">Client</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "#9CA3AF" }}>{new Date(u.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                                        <td style={{ padding: "0.875rem 1rem" }}>
                                            <button
                                                onClick={() => { if (window.confirm(`Delete user ${u.name}?`)) deleteUser.mutate(u._id); }}
                                                style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", display: "flex", alignItems: "center" }}
                                                title="Delete user"
                                            >
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
