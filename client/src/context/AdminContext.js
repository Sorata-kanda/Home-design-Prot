import { createContext, useContext, useState } from "react";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <AdminContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
            {children}
        </AdminContext.Provider>
    );
}

export const useAdmin = () => useContext(AdminContext);
