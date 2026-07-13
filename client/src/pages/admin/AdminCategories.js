import { useQuery } from "@tanstack/react-query";
import { FolderTree, Package } from "lucide-react";
import { adminAPI } from "../../utils/api";
import AdminLayout from "../../components/admin/AdminLayout";

const CATEGORY_LABELS = {
    marble: "Marble",
    granite: "Granite",
    moca_crema: "Moca Crema",
    gwalior_stone: "Gwalior Stone",
    moulding: "Moulding",
    column: "Column",
    travertine: "Travertine",
    limestone: "Limestone",
    sandstone: "Sandstone",
};

export default function AdminCategories() {
    const { data: catData, isLoading: catLoading } = useQuery({
        queryKey: ["admin-categories"],
        queryFn: () => adminAPI.categories().then((r) => r.data),
    });

    const categories = catData?.categories || [];
    const totalProducts = categories.reduce((s, c) => s + c.count, 0);

    return (
        <AdminLayout>
            <div>
                <div style={{ marginBottom: "1.5rem" }}>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C2420", margin: 0 }}>Product Categories</h1>
                    <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: "4px 0 0" }}>{categories.length} categories · {totalProducts} total products</p>
                </div>

                {catLoading ? (
                    <div style={{ textAlign: "center", padding: "4rem" }}><div className="spinner" /></div>
                ) : categories.length === 0 ? (
                    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E5E1D8", padding: "4rem", textAlign: "center", color: "#9CA3AF" }}>
                        <FolderTree size={44} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
                        <p style={{ margin: 0 }}>No categories yet. Add products to populate data.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.25rem" }}>
                        {categories.map((cat) => {
                            const pct = totalProducts > 0 ? Math.round((cat.count / totalProducts) * 100) : 0;
                            return (
                                <div key={cat._id} style={{ background: "white", borderRadius: "14px", border: "1px solid #E5E1D8", padding: "1.25rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                                        <div style={{ width: 44, height: 44, borderRadius: "10px", background: "#FEF3E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Package size={20} color="#C9A84C" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: "1rem", color: "#2C2420" }}>{CATEGORY_LABELS[cat._id] || cat._id}</div>
                                            <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>{cat.count} product{cat.count !== 1 ? "s" : ""}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#6B7280", marginBottom: "0.5rem" }}>
                                        <span>Avg Price</span>
                                        <strong style={{ color: "#2C2420" }}>₹{Math.round(cat.avgPrice).toLocaleString("en-IN")}/sqft</strong>
                                    </div>
                                    {/* Mini progress bar */}
                                    <div style={{ height: 6, background: "#F3F4F6", borderRadius: 10, overflow: "hidden" }}>
                                        <div style={{ width: `${pct}%`, height: "100%", background: "#C9A84C", borderRadius: 10, transition: "width 0.6s ease" }} />
                                    </div>
                                    <div style={{ fontSize: "0.7rem", color: "#9CA3AF", marginTop: "0.25rem", textAlign: "right" }}>{pct}% of catalog</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
