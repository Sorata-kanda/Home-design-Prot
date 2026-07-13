import axios from "axios";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "/api",
    timeout: 60000,
});

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("ae_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem("ae_token");
            localStorage.removeItem("ae_user");
            if (!window.location.pathname.includes("/login")) {
                window.location.href = "/login";
            }
        }
        return Promise.reject(err);
    },
);

// Auth
export const authAPI = {
    register: (data) => api.post("/auth/register", data),
    login: (data) => api.post("/auth/login", data),
    googleLogin: (data) => api.post("/auth/google", data),
    facebookLogin: (data) => api.post("/auth/facebook", data),
    verifyOTP: (data) => api.post("/auth/verify-otp", data),
    resendOTP: (data) => api.post("/auth/resend-otp", data),
    me: () => api.get("/auth/me"),
    updateProfile: (data) => api.patch("/auth/profile", data),
};

// Products
export const productsAPI = {
    getAll: (params) => api.get("/products", { params }),
    getById: (id) => api.get(`/products/${id}`),
    getCategories: () => api.get("/products/categories"),
    getPresets: () => api.get("/products/presets"),
    create: (data) =>
        api.post("/products", data, {
            headers: { "Content-Type": "multipart/form-data" },
        }),
    update: (id, data) =>
        api.patch(`/products/${id}`, data, {
            headers: { "Content-Type": "multipart/form-data" },
        }),
    delete: (id) => api.delete(`/products/${id}`),
};

// Visualizer
export const visualizerAPI = {
    uploadPhoto: (formData) =>
        api.post("/visualizer/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 30000,
        }),
    segment: (photoUrl) =>
        api.post(
            "/visualizer/segment",
            { photoUrl },
            {
                timeout: 150000, // 2.5 min — first run downloads SegFormer model (~85MB)
            },
        ),
    generate: (data) =>
        api.post("/visualizer/generate", data, { timeout: 300000 }),
};

// Renders
export const rendersAPI = {
    getMine: () => api.get("/renders"),
    getById: (id) => api.get(`/renders/${id}`),
    getShared: (token) => api.get(`/renders/shared/${token}`),
    share: (id) => api.post(`/renders/${id}/share`),
    delete: (id) => api.delete(`/renders/${id}`),
};

// Quotes
export const quotesAPI = {
    submit: (data) => api.post("/quotes", data),
    getMine: () => api.get("/quotes/mine"),
    getAll: (params) => api.get("/quotes", { params }),
    updateStatus: (id, data) => api.patch(`/quotes/${id}/status`, data),
};

// Admin
export const adminAPI = {
    dashboard: () => api.get("/admin/dashboard"),
    analytics: () => api.get("/admin/analytics"),
    users: (params) => api.get("/admin/users", { params }),
    updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    allRenders: (params) => api.get("/admin/renders", { params }),
    deleteRender: (id) => api.delete(`/admin/renders/${id}`),
    categories: () => api.get("/admin/categories"),
    seed: () => api.post("/admin/seed"),
};

// Coupons (Admin)
export const couponsAPI = {
    getAll: () => api.get("/admin/coupons"),
    validate: (code) => api.get("/orders/coupon/validate", { params: { code } }),
    create: (data) => api.post("/admin/coupons", data),
    update: (id, data) => api.patch(`/admin/coupons/${id}`, data),
    delete: (id) => api.delete(`/admin/coupons/${id}`),
};

// Orders
export const ordersAPI = {
    simulatedCheckout: (data) => api.post("/orders/simulated-checkout", data),
    razorpayCreate: (data) => api.post("/orders/razorpay/create", data),
    razorpayVerify: (data) => api.post("/orders/razorpay/verify", data),
    getAll: () => api.get("/orders"),
    getMine: () => api.get("/orders/mine"),
    updateFulfillment: (id, status) =>
        api.patch(`/orders/${id}/fulfillment`, { fulfillmentStatus: status }),
};

// Cart
export const cartAPI = {
    get: () => api.get("/cart"),
    add: (data) => api.post("/cart/add", data),
    remove: (id) => api.delete(`/cart/remove/${id}`),
    update: (id, data) => api.patch(`/cart/update/${id}`, data),
    clear: () => api.delete("/cart/clear"),
};

// Notifications
export const notificationsAPI = {
    getAll: () => api.get("/notifications"),
    readAll: () => api.patch("/notifications/read-all"),
    read: (id) => api.patch(`/notifications/${id}/read`),
    clear: () => api.delete("/notifications/clear"),
};

export default api;
