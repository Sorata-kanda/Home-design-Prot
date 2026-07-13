import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Package,
    Check,
    AlertCircle,
    TrendingUp,
    Search,
    Download,
    Plus,
    Edit2,
    Trash2,
    X,
    Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import { productsAPI } from "../../utils/api";
import AdminLayout from "../../components/admin/AdminLayout";

const CATEGORIES = [
    "marble",
    "gwalior_stone",
    "moca_crema",
    "white_stone",
    "moulding",
    "column",
    "limestone",
    "granite",
    "other",
];
const CATEGORY_LABELS = {
    marble: "Marble",
    gwalior_stone: "Gwalior Stone",
    moca_crema: "Moca Crema",
    white_stone: "White Stone",
    moulding: "Moulding",
    column: "Columns",
    limestone: "Limestone",
    granite: "Granite",
    other: "Other",
};
const ZONES = [
    "floor",
    "wall",
    "ceiling",
    "pillar",
    "cornice",
    "wainscoting",
    "elevation",
    "exterior",
    "staircase",
];
const EMPTY_PRODUCT = {
    sku: "",
    name: "",
    category: "marble",
    pricePerSqFt: "",
    finish: "polished",
    grade: "both",
    description: "",
    applicableZones: [],
    tags: "",
    reflectivity: 0.5,
    roughness: 0.3,
    isNeoClassicalPreset: false,
    presetType: null,
    isFeatured: false,
};

export default function AdminProducts() {
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
    const [textureFile, setTextureFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef();
    const queryClient = useQueryClient();

    const { data: productsData, isLoading } = useQuery({
        queryKey: ["admin-products"],
        queryFn: () => productsAPI.getAll({}).then((r) => r.data),
    });

    const deleteMutation = useMutation({
        mutationFn: productsAPI.delete,
        onSuccess: () => {
            toast.success("Product deleted");
            queryClient.invalidateQueries(["admin-products"]);
        },
        onError: () => toast.error("Delete failed"),
    });

    const products = productsData?.products || [];
    const filtered = products.filter(
        (p) =>
            p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // KPIs
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.isActive !== false).length;
    const lowStock = products.filter((p) => (p.stock || 0) < 10).length;
    const totalValue = products.reduce((s, p) => s + (p.pricePerSqFt || 0), 0);

    const exportCSV = () => {
        const headers = [
            "SKU",
            "Name",
            "Category",
            "Price/SqFt",
            "Stock",
            "Status",
        ];
        const rows = products.map((p) => [
            p.sku || "",
            p.name || "",
            p.category || "",
            p.pricePerSqFt || 0,
            p.stock || 0,
            p.isActive !== false ? "Active" : "Inactive",
        ]);
        const csv = [headers, ...rows]
            .map((r) => r.map((c) => `"${c}"`).join(","))
            .join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = `products_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        toast.success("Exported!");
    };

    const openAdd = () => {
        setEditingProduct(null);
        setProductForm(EMPTY_PRODUCT);
        setTextureFile(null);
        setShowForm(true);
    };

    const openEdit = (product) => {
        setEditingProduct(product);
        setProductForm({
            sku: product.sku,
            name: product.name,
            category: product.category,
            pricePerSqFt: product.pricePerSqFt,
            finish: product.finish,
            grade: product.grade,
            description: product.description || "",
            applicableZones: product.applicableZones || [],
            tags: product.tags?.join(", ") || "",
            reflectivity: product.reflectivity,
            roughness: product.roughness,
            isNeoClassicalPreset: product.isNeoClassicalPreset,
            presetType: product.presetType,
            isFeatured: product.isFeatured,
        });
        setTextureFile(null);
        setShowForm(true);
    };

    const pf = (field) => (e) =>
        setProductForm((f) => ({
            ...f,
            [field]:
                e.target.type === "checkbox"
                    ? e.target.checked
                    : e.target.value,
        }));

    const toggleZone = (zone) =>
        setProductForm((f) => ({
            ...f,
            applicableZones: f.applicableZones.includes(zone)
                ? f.applicableZones.filter((z) => z !== zone)
                : [...f.applicableZones, zone],
        }));

    const handleSave = async (e) => {
        e.preventDefault();
        if (
            !productForm.sku ||
            !productForm.name ||
            !productForm.pricePerSqFt
        ) {
            toast.error("SKU, name and price are required");
            return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            Object.entries(productForm).forEach(([k, v]) => {
                if (k === "applicableZones") {
                    fd.append(k, JSON.stringify(v));
                } else if (k === "tags") {
                    fd.append(
                        k,
                        JSON.stringify(
                            v
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                        ),
                    );
                } else if (v !== null && v !== undefined) {
                    fd.append(k, v);
                }
            });
            if (textureFile) fd.append("texture", textureFile);

            if (editingProduct) {
                await productsAPI.update(editingProduct._id, fd);
                toast.success("Product updated");
            } else {
                await productsAPI.create(fd);
                toast.success("Product added!");
            }
            queryClient.invalidateQueries(["admin-products"]);
            setShowForm(false);
        } catch (err) {
            toast.error(err.response?.data?.error || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout>
            <div>
                {/* Page Header */}
                <div style={{ marginBottom: "2rem" }}>
                    <h1
                        style={{
                            fontSize: "2rem",
                            fontWeight: "700",
                            marginBottom: "0.25rem",
                            color: "#2C2420",
                        }}
                    >
                        Products
                    </h1>
                    <p
                        style={{
                            color: "#888",
                            fontSize: "0.875rem",
                            margin: 0,
                        }}
                    >
                        Manage your product catalog and inventory.
                    </p>
                </div>

                {/* KPI Cards */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "1.25rem",
                        marginBottom: "2rem",
                    }}
                >
                    <KPICard
                        label="Total Products"
                        value={totalProducts}
                        icon={Package}
                        bgColor="#FEF3E2"
                        iconColor="#C9A84C"
                    />
                    <KPICard
                        label="Active Products"
                        value={activeProducts}
                        icon={Check}
                        bgColor="#F0E7FF"
                        iconColor="#8b5cf6"
                    />
                    <KPICard
                        label="Low Stock"
                        value={lowStock}
                        icon={AlertCircle}
                        bgColor="#FFE8E8"
                        iconColor="#ef4444"
                    />
                    <KPICard
                        label="Total Value"
                        value={`₹${totalValue.toLocaleString()}`}
                        icon={TrendingUp}
                        bgColor="#E8F5E9"
                        iconColor="#4caf50"
                    />
                </div>

                {/* Toolbar */}
                <div
                    style={{
                        background: "white",
                        padding: "1.25rem 1.5rem",
                        borderRadius: "12px",
                        marginBottom: "1.25rem",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem",
                        flexWrap: "wrap",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            flex: 1,
                            minWidth: "200px",
                        }}
                    >
                        <Search
                            size={16}
                            style={{
                                position: "absolute",
                                left: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#aaa",
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.625rem 0.75rem 0.625rem 2.5rem",
                                border: "1px solid #E5E1D8",
                                borderRadius: "8px",
                                fontSize: "0.875rem",
                            }}
                        />
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                            onClick={exportCSV}
                            className="btn btn-secondary btn-sm"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                            }}
                        >
                            <Download size={15} /> Export
                        </button>
                        <button
                            onClick={openAdd}
                            className="btn btn-primary btn-sm"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                background: "#C9A84C",
                                border: "none",
                            }}
                        >
                            <Plus size={15} /> Add New Product
                        </button>
                    </div>
                </div>

                {/* Product Table */}
                <div
                    style={{
                        background: "white",
                        borderRadius: "12px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        overflow: "hidden",
                    }}
                >
                    {isLoading ? (
                        <div style={{ padding: "3rem", textAlign: "center" }}>
                            <div className="spinner" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div
                            style={{
                                padding: "3rem",
                                textAlign: "center",
                                color: "#999",
                            }}
                        >
                            {searchTerm
                                ? "No products match your search"
                                : "No products yet — add one!"}
                        </div>
                    ) : (
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        borderBottom: "1px solid #E5E1D8",
                                        background: "#FAFAF9",
                                    }}
                                >
                                    {[
                                        "Product",
                                        "Category",
                                        "Price/SqFt",
                                        "Stock",
                                        "Status",
                                        "Actions",
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: "0.875rem 1rem",
                                                textAlign: "left",
                                                fontSize: "0.75rem",
                                                fontWeight: "600",
                                                color: "#888",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.04em",
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p) => (
                                    <tr
                                        key={p._id}
                                        style={{
                                            borderBottom: "1px solid #F5F5F5",
                                        }}
                                    >
                                        <td
                                            style={{ padding: "0.875rem 1rem" }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.75rem",
                                                }}
                                            >
                                                {(p.textureImage?.url ||
                                                    p.thumbnailImage?.url) && (
                                                    <img
                                                        src={
                                                            p.textureImage
                                                                ?.url ||
                                                            p.thumbnailImage
                                                                ?.url
                                                        }
                                                        alt={p.name}
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 8,
                                                            objectFit: "cover",
                                                        }}
                                                        onError={(e) =>
                                                            (e.target.style.display =
                                                                "none")
                                                        }
                                                    />
                                                )}
                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize:
                                                                "0.875rem",
                                                            fontWeight: "600",
                                                            color: "#2C2420",
                                                        }}
                                                    >
                                                        {p.name}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: "0.75rem",
                                                            color: "#999",
                                                        }}
                                                    >
                                                        SKU: {p.sku}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td
                                            style={{ padding: "0.875rem 1rem" }}
                                        >
                                            <span
                                                style={{
                                                    padding: "0.25rem 0.75rem",
                                                    borderRadius: "12px",
                                                    background: "#F0E7FF",
                                                    color: "#8b5cf6",
                                                    fontSize: "0.75rem",
                                                }}
                                            >
                                                {CATEGORY_LABELS[p.category] ||
                                                    p.category}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                padding: "0.875rem 1rem",
                                                fontWeight: "600",
                                                fontSize: "0.875rem",
                                            }}
                                        >
                                            ₹{p.pricePerSqFt}
                                        </td>
                                        <td
                                            style={{
                                                padding: "0.875rem 1rem",
                                                fontSize: "0.875rem",
                                            }}
                                        >
                                            {p.stock || 0}
                                        </td>
                                        <td
                                            style={{ padding: "0.875rem 1rem" }}
                                        >
                                            <span
                                                style={{
                                                    padding: "0.25rem 0.75rem",
                                                    borderRadius: "12px",
                                                    fontSize: "0.75rem",
                                                    fontWeight: "600",
                                                    background:
                                                        p.isActive !== false
                                                            ? "#E8F5E9"
                                                            : "#FFE8E8",
                                                    color:
                                                        p.isActive !== false
                                                            ? "#4caf50"
                                                            : "#ef4444",
                                                }}
                                            >
                                                {p.isActive !== false
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>
                                        <td
                                            style={{ padding: "0.875rem 1rem" }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "0.5rem",
                                                }}
                                            >
                                                <button
                                                    onClick={() => openEdit(p)}
                                                    className="btn btn-ghost btn-sm"
                                                    style={{
                                                        padding: "0.375rem",
                                                    }}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                "Delete this product?",
                                                            )
                                                        )
                                                            deleteMutation.mutate(
                                                                p._id,
                                                            );
                                                    }}
                                                    className="btn btn-ghost btn-sm"
                                                    style={{
                                                        padding: "0.375rem",
                                                        color: "#ef4444",
                                                    }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add / Edit Product Modal */}
            {showForm && (
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
                    onClick={() => setShowForm(false)}
                >
                    <div
                        style={{
                            background: "white",
                            borderRadius: 20,
                            width: "100%",
                            maxWidth: 600,
                            maxHeight: "92vh",
                            overflowY: "auto",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div
                            style={{
                                padding: "1.25rem 1.5rem",
                                borderBottom: "1px solid #E5E1D8",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                position: "sticky",
                                top: 0,
                                background: "white",
                                zIndex: 10,
                            }}
                        >
                            <h3 style={{ margin: 0 }}>
                                {editingProduct
                                    ? "Edit Product"
                                    : "Add New Product"}
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="btn btn-ghost btn-sm"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleSave}
                            style={{
                                padding: "1.5rem",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                            }}
                        >
                            <div className="form-grid-2">
                                <div>
                                    <label>SKU *</label>
                                    <input
                                        value={productForm.sku}
                                        onChange={pf("sku")}
                                        placeholder="MRB-001"
                                        required
                                        style={{ textTransform: "uppercase" }}
                                    />
                                </div>
                                <div>
                                    <label>Price per sq.ft (₹) *</label>
                                    <input
                                        type="number"
                                        value={productForm.pricePerSqFt}
                                        onChange={pf("pricePerSqFt")}
                                        placeholder="450"
                                        required
                                        min={1}
                                    />
                                </div>
                            </div>
                            <div>
                                <label>Product name *</label>
                                <input
                                    value={productForm.name}
                                    onChange={pf("name")}
                                    placeholder="Italian Carrara White Marble"
                                    required
                                />
                            </div>
                            <div className="form-grid-2">
                                <div>
                                    <label>Category</label>
                                    <select
                                        value={productForm.category}
                                        onChange={pf("category")}
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c}>
                                                {CATEGORY_LABELS[c]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label>Finish</label>
                                    <select
                                        value={productForm.finish}
                                        onChange={pf("finish")}
                                    >
                                        {[
                                            "polished",
                                            "honed",
                                            "brushed",
                                            "antique",
                                            "natural",
                                            "flamed",
                                        ].map((f) => (
                                            <option key={f} value={f}>
                                                {f}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label>Grade</label>
                                    <select
                                        value={productForm.grade}
                                        onChange={pf("grade")}
                                    >
                                        <option value="interior">
                                            Interior only
                                        </option>
                                        <option value="exterior">
                                            Exterior grade
                                        </option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label>Applicable zones</label>
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 6,
                                        marginTop: 6,
                                    }}
                                >
                                    {ZONES.map((zone) => (
                                        <button
                                            key={zone}
                                            type="button"
                                            onClick={() => toggleZone(zone)}
                                            className={`btn btn-sm ${productForm.applicableZones.includes(zone) ? "btn-primary" : "btn-secondary"}`}
                                        >
                                            {productForm.applicableZones.includes(
                                                zone,
                                            ) && <Check size={12} />}{" "}
                                            {zone}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label>Tags (comma separated)</label>
                                <input
                                    value={productForm.tags}
                                    onChange={pf("tags")}
                                    placeholder="marble, white, luxury, classic"
                                />
                            </div>
                            <div>
                                <label>Description</label>
                                <textarea
                                    value={productForm.description}
                                    onChange={pf("description")}
                                    placeholder="Brief product description…"
                                    rows={3}
                                />
                            </div>
                            <div className="form-grid-2">
                                <div>
                                    <label>Reflectivity (0–1)</label>
                                    <input
                                        type="number"
                                        value={productForm.reflectivity}
                                        onChange={pf("reflectivity")}
                                        min={0}
                                        max={1}
                                        step={0.1}
                                    />
                                </div>
                                <div>
                                    <label>Roughness (0–1)</label>
                                    <input
                                        type="number"
                                        value={productForm.roughness}
                                        onChange={pf("roughness")}
                                        min={0}
                                        max={1}
                                        step={0.1}
                                    />
                                </div>
                            </div>
                            <div>
                                <label>Texture image</label>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.75rem",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="btn btn-secondary btn-sm"
                                    >
                                        <Upload size={14} />{" "}
                                        {textureFile
                                            ? textureFile.name
                                            : "Choose texture"}
                                    </button>
                                    {(textureFile ||
                                        editingProduct?.textureImage?.url) && (
                                        <img
                                            src={
                                                textureFile
                                                    ? URL.createObjectURL(
                                                          textureFile,
                                                      )
                                                    : editingProduct
                                                          .textureImage.url
                                            }
                                            alt="preview"
                                            style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 8,
                                                objectFit: "cover",
                                            }}
                                        />
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={(e) =>
                                        setTextureFile(e.target.files[0])
                                    }
                                />
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    gap: "1.5rem",
                                    flexWrap: "wrap",
                                }}
                            >
                                <label
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        textTransform: "none",
                                        marginBottom: 0,
                                        cursor: "pointer",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={productForm.isFeatured}
                                        onChange={pf("isFeatured")}
                                    />
                                    Featured product
                                </label>
                                <label
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        textTransform: "none",
                                        marginBottom: 0,
                                        cursor: "pointer",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={
                                            productForm.isNeoClassicalPreset
                                        }
                                        onChange={pf("isNeoClassicalPreset")}
                                    />
                                    Neoclassical preset
                                </label>
                            </div>
                            {productForm.isNeoClassicalPreset && (
                                <div>
                                    <label>Preset type</label>
                                    <select
                                        value={productForm.presetType || ""}
                                        onChange={(e) =>
                                            setProductForm((f) => ({
                                                ...f,
                                                presetType:
                                                    e.target.value || null,
                                            }))
                                        }
                                    >
                                        <option value="">None</option>
                                        <option value="ionic_column">
                                            Ionic column
                                        </option>
                                        <option value="cornice">Cornice</option>
                                        <option value="wainscoting">
                                            Wainscoting
                                        </option>
                                        <option value="pilaster">
                                            Pilaster
                                        </option>
                                        <option value="arch">Arch</option>
                                    </select>
                                </div>
                            )}
                            <div
                                style={{
                                    display: "flex",
                                    gap: "0.75rem",
                                    paddingTop: "0.5rem",
                                }}
                            >
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-primary"
                                    style={{
                                        flex: 1,
                                        justifyContent: "center",
                                        background: "#C9A84C",
                                        border: "none",
                                    }}
                                >
                                    {saving ? (
                                        <>
                                            <div
                                                className="spinner"
                                                style={{
                                                    width: 16,
                                                    height: 16,
                                                    borderWidth: 2,
                                                }}
                                            />{" "}
                                            Saving…
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />{" "}
                                            {editingProduct
                                                ? "Save changes"
                                                : "Add product"}
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function KPICard({ label, value, icon: Icon, bgColor, iconColor }) {
    return (
        <div
            style={{
                background: "white",
                padding: "1.25rem",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
            }}
        >
            <div
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <Icon size={24} color={iconColor} />
            </div>
            <div>
                <div
                    style={{
                        fontSize: "1.75rem",
                        fontWeight: "700",
                        color: "#2C2420",
                        lineHeight: 1,
                    }}
                >
                    {value}
                </div>
                <div
                    style={{
                        fontSize: "0.8rem",
                        color: "#888",
                        marginTop: "0.25rem",
                    }}
                >
                    {label}
                </div>
            </div>
        </div>
    );
}
