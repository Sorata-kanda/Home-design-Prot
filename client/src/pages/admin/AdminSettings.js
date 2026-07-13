import { useState } from "react";
import { Settings, Moon, Sun, Database, Mail, Lock, Save } from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI } from "../../utils/api";
import { useTheme } from "../../context/ThemeContext";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminSettings() {
    const { theme, toggleTheme } = useTheme();
    const [storeName, setStoreName] = useState(() => localStorage.getItem("admin_store_name") || "Stratum by DSYN Luxury");
    const [contactEmail, setContactEmail] = useState(() => localStorage.getItem("admin_contact_email") || "");
    const [oldPw, setOldPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [seeding, setSeeding] = useState(false);
    const [savingStore, setSavingStore] = useState(false);

    const saveStoreInfo = () => {
        setSavingStore(true);
        localStorage.setItem("admin_store_name", storeName);
        localStorage.setItem("admin_contact_email", contactEmail);
        setTimeout(() => { setSavingStore(false); toast.success("Store settings saved"); }, 600);
    };

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const res = await adminAPI.seed();
            toast.success(`Seeded: ${JSON.stringify(res.data.results)}`);
        } catch (e) {
            toast.error("Seeding failed: " + (e.response?.data?.error || e.message));
        } finally {
            setSeeding(false);
        }
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (newPw.length < 6) { toast.error("Password must be at least 6 characters"); return; }
        // Simulated only — hook into auth API for real implementation
        toast.success("Password updated (Simulated)");
        setOldPw(""); setNewPw("");
    };

    return (
        <AdminLayout>
            <div style={{ maxWidth: 680 }}>
                <div style={{ marginBottom: "1.5rem" }}>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2C2420", margin: 0 }}>Settings</h1>
                    <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: "4px 0 0" }}>Manage store preferences and admin account</p>
                </div>

                {/* Store Info */}
                <div style={{ background: "white", borderRadius: "14px", border: "1px solid #E5E1D8", padding: "1.5rem", marginBottom: "1.25rem" }}>
                    <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", color: "#2C2420", display: "flex", alignItems: "center", gap: 8 }}><Settings size={18} /> Store Information</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4B5563", display: "block", marginBottom: 4 }}>Store Name</label>
                            <input value={storeName} onChange={(e) => setStoreName(e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "0.875rem", outline: "none" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4B5563", display: "block", marginBottom: 4 }}>
                                <Mail size={13} style={{ marginRight: 4 }} />Contact Email
                            </label>
                            <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" placeholder="contact@yourdomain.com" style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "0.875rem", outline: "none" }} />
                        </div>
                        <button onClick={saveStoreInfo} disabled={savingStore} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "0.5rem 1.25rem", background: "#2C2420", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
                            <Save size={15} /> {savingStore ? "Saving…" : "Save Store Info"}
                        </button>
                    </div>
                </div>

                {/* Theme */}
                <div style={{ background: "white", borderRadius: "14px", border: "1px solid #E5E1D8", padding: "1.5rem", marginBottom: "1.25rem" }}>
                    <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem", color: "#2C2420", display: "flex", alignItems: "center", gap: 8 }}>
                        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />} Appearance
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: "0 0 1rem" }}>Toggle between light and dark admin panel theme</p>
                    <button onClick={toggleTheme} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.5rem 1.25rem", background: "#F3F4F6", color: "#2C2420", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
                        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                        Switch to {theme === "dark" ? "Light" : "Dark"} Mode
                    </button>
                </div>

                {/* Password */}
                <div style={{ background: "white", borderRadius: "14px", border: "1px solid #E5E1D8", padding: "1.5rem", marginBottom: "1.25rem" }}>
                    <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", color: "#2C2420", display: "flex", alignItems: "center", gap: 8 }}><Lock size={18} /> Change Password</h3>
                    <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4B5563", display: "block", marginBottom: 4 }}>Current Password</label>
                            <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} required style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "0.875rem", outline: "none" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4B5563", display: "block", marginBottom: 4 }}>New Password</label>
                            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "0.875rem", outline: "none" }} />
                        </div>
                        <button type="submit" style={{ alignSelf: "flex-start", padding: "0.5rem 1.25rem", background: "#C9A84C", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
                            Update Password
                        </button>
                    </form>
                </div>

                {/* Database Seed */}
                <div style={{ background: "white", borderRadius: "14px", border: "1px solid #E5E1D8", padding: "1.5rem" }}>
                    <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", color: "#2C2420", display: "flex", alignItems: "center", gap: 8 }}><Database size={18} /> Development Tools</h3>
                    <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: "0 0 1rem" }}>Seed sample products and users into the database (safe to run multiple times — skips if already seeded)</p>
                    <button onClick={handleSeed} disabled={seeding} style={{ padding: "0.5rem 1.25rem", background: "#F3F4F6", color: "#2C2420", border: "1px solid #D1D5DB", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
                        {seeding ? "Seeding…" : "🌱 Seed Sample Data"}
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
