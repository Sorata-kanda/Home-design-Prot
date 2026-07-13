import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Trash, Circle } from "lucide-react";
import { notificationsAPI } from "../../utils/api";
import { Link } from "react-router-dom";

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const queryClient = useQueryClient();

    const { data } = useQuery({
        queryKey: ["notifications"],
        queryFn: () => notificationsAPI.getAll().then((r) => r.data),
        refetchInterval: 15000, // Poll every 15 seconds to look real-time!
    });

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;

    const readMutation = useMutation({
        mutationFn: (id) => notificationsAPI.read(id),
        onSuccess: () => queryClient.invalidateQueries(["notifications"]),
    });

    const readAllMutation = useMutation({
        mutationFn: () => notificationsAPI.readAll(),
        onSuccess: () => queryClient.invalidateQueries(["notifications"]),
    });

    const clearMutation = useMutation({
        mutationFn: () => notificationsAPI.clear(),
        onSuccess: () => queryClient.invalidateQueries(["notifications"]),
    });

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatTime = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    return (
        <div ref={containerRef} style={{ position: "relative" }}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    color: "#2C2420",
                    position: "relative",
                }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: "2px",
                            right: "2px",
                            background: "#EF4444",
                            color: "white",
                            fontSize: "0.625rem",
                            padding: "1px 5px",
                            borderRadius: "10px",
                            fontWeight: "700",
                            minWidth: "16px",
                            textAlign: "center",
                            boxShadow: "0 0 0 2px white",
                        }}
                    >
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        marginTop: "0.5rem",
                        width: "320px",
                        background: "white",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1), 0 2px 10px rgba(0, 0, 0, 0.05)",
                        border: "1px solid #E5E1D8",
                        overflow: "hidden",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: "0.75rem 1rem",
                            borderBottom: "1px solid #F3F4F6",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#F8F6F3",
                        }}
                    >
                        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#2C2420" }}>Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => readAllMutation.mutate()}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#C9A84C",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "2px",
                                }}
                            >
                                <Check size={12} /> Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: "2rem", textAlign: "center", color: "#9CA3AF", fontSize: "0.875rem" }}>
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif._id}
                                    onClick={() => {
                                        if (!notif.isRead) readMutation.mutate(notif._id);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        padding: "0.75rem 1rem",
                                        borderBottom: "1px solid #F3F4F6",
                                        background: notif.isRead ? "transparent" : "#FFFDF9",
                                        cursor: "pointer",
                                        display: "flex",
                                        gap: "0.5rem",
                                        alignItems: "flex-start",
                                        transition: "background 0.2s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F9F8F6")}
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = notif.isRead ? "transparent" : "#FFFDF9")
                                    }
                                >
                                    {!notif.isRead && (
                                        <Circle
                                            size={6}
                                            fill="#C9A84C"
                                            color="#C9A84C"
                                            style={{ marginTop: "6px", flexShrink: 0 }}
                                        />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        {notif.link ? (
                                            <Link
                                                to={notif.link}
                                                style={{
                                                    textDecoration: "none",
                                                    color: "inherit",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontWeight: notif.isRead ? 600 : 700,
                                                        fontSize: "0.8rem",
                                                        color: "#2C2420",
                                                    }}
                                                >
                                                    {notif.title}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.75rem",
                                                        color: "#4B5563",
                                                        marginTop: "2px",
                                                        lineHeight: "1.25",
                                                    }}
                                                >
                                                    {notif.message}
                                                </div>
                                            </Link>
                                        ) : (
                                            <>
                                                <div
                                                    style={{
                                                        fontWeight: notif.isRead ? 600 : 700,
                                                        fontSize: "0.8rem",
                                                        color: "#2C2420",
                                                    }}
                                                >
                                                    {notif.title}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.75rem",
                                                        color: "#4B5563",
                                                        marginTop: "2px",
                                                        lineHeight: "1.25",
                                                    }}
                                                >
                                                    {notif.message}
                                                </div>
                                            </>
                                        )}
                                        <div
                                            style={{
                                                fontSize: "0.65rem",
                                                color: "#9CA3AF",
                                                marginTop: "4px",
                                            }}
                                        >
                                            {formatTime(notif.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div
                            style={{
                                padding: "0.5rem 1rem",
                                borderTop: "1px solid #F3F4F6",
                                display: "flex",
                                justifyContent: "center",
                                background: "#F8F6F3",
                            }}
                        >
                            <button
                                onClick={() => clearMutation.mutate()}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#EF4444",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                <Trash size={12} /> Clear all
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
