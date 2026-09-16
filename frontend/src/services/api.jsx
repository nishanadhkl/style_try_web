import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8090";

// Create axios instance with base configuration
const API = axios.create({
  baseURL: API_BASE_URL, // Base URL for backend API
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem("adminToken");
    const userToken = localStorage.getItem("userToken");
    const adminOnlyPaths = ["/api/admin", "/api/orders/admin", "/api/users"];
    const isAdminRoute = adminOnlyPaths.some((path) => config.url?.startsWith(path));
    const isAdminProductWrite =
      ["/api/products", "/api/variants"].some((path) => config.url?.startsWith(path)) &&
      ["post", "put", "delete"].includes(config.method?.toLowerCase());

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    if ((isAdminRoute || isAdminProductWrite) && adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    } else if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || "";
    const adminOnlyPaths = ["/api/admin", "/api/orders/admin", "/api/users"];
    const isAdminRoute = adminOnlyPaths.some((path) => requestUrl.startsWith(path));
    const isAdminProductWrite =
      ["/api/products", "/api/variants"].some((path) => requestUrl.startsWith(path)) &&
      ["post", "put", "delete"].includes(error.config?.method?.toLowerCase());
    const isCustomerProtectedRoute =
      ["/api/cart", "/api/orders", "/api/payments"].some((path) => requestUrl.startsWith(path)) &&
      !isAdminRoute;

    if (error.response?.status === 401) {
      // Unauthorized - clear tokens and redirect
      if (isAdminRoute || isAdminProductWrite) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
      } else {
        localStorage.removeItem("userToken");
        localStorage.removeItem("user");
      }

      // Redirect to login if not already there
      if (window.location.pathname !== "/admin/login" && window.location.pathname !== "/login") {
        window.location.href = (isAdminRoute || isAdminProductWrite || window.location.pathname.startsWith("/admin"))
          ? "/admin/login"
          : "/login";
      }
    }

    if (error.response?.status === 403) {
      console.error("Access forbidden:", error.response.data);

      if (isAdminRoute || isAdminProductWrite) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
        if (window.location.pathname !== "/admin/login") {
          window.location.href = "/admin/login";
        }
      } else if (isCustomerProtectedRoute) {
        localStorage.removeItem("userToken");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    if (error.response?.status >= 500) {
      // Server error
      console.error("Server error:", error.response.data);
    }

    return Promise.reject(error);
  }
);

// API endpoints for products
export const productAPI = {
  getAll: (params) => API.get("/api/products", { params }),
  getById: (id) => API.get(`/api/products/${id}`),
  create: (productData) => API.post("/api/products", productData),
  update: (id, productData) => API.put(`/api/products/${id}`, productData),
  delete: (id) => API.delete(`/api/products/${id}`),
  getByCategory: (category) => API.get(`/api/products/category/${category}`),
  getSaleProducts: () => API.get("/api/products/sale"),
  getNewArrivals: () => API.get("/api/products/new-arrivals"),
};

// API endpoints for categories
export const categoryAPI = {
  // Get all categories
  getAll: () => API.get("/api/categories"),

  // Get category by ID
  getById: (id) => API.get(`/api/categories/${id}`),

  // Create new category
  create: (categoryData) => API.post("/api/categories", categoryData),

  // Update category
  update: (id, categoryData) => API.put(`/api/categories/${id}`, categoryData),

  // Delete category
  delete: (id) => API.delete(`/api/categories/${id}`),
};

// API endpoints for admin authentication
export const adminAPI = {
  login: (credentials) => API.post("/api/auth/login", credentials),
  getDashboardStats: () => API.get("/api/admin/dashboard/stats"),
  getAllOrders: (params) => API.get("/api/orders/admin/all", { params }),
  updateOrderStatus: (orderId, status) => API.put(`/api/orders/admin/${orderId}/status`, null, { params: { status } }),
  getAllUsers: (params) => API.get("/api/users", { params }),
  deleteUser: (userId) => API.delete(`/api/users/${userId}`),
};

// API endpoints for user authentication
export const authAPI = {
  // User registration
  register: (userData) => API.post("/api/auth/register", userData),

  // User login
  login: (credentials) => API.post("/api/auth/login", credentials),

  // Get user profile
  getProfile: () => API.get("/auth/profile"),

  // Update user profile
  updateProfile: (userData) => API.put("/auth/profile", userData),
};

// API endpoints for orders
export const orderAPI = {
  // Get user's orders
  getUserOrders: (params) => API.get("/api/orders", { params }),

  // Get order by ID
  getById: (id) => API.get(`/api/orders/${id}`),

  // Create new order
  create: (orderData) => API.post("/api/orders", orderData),

  // Cancel order
  cancel: (orderId) => API.put(`/api/orders/${orderId}/cancel`),
};

export const paymentAPI = {
  initiateEsewa: (paymentData) => API.post("/api/payments/esewa/initiate", paymentData),
};

// API endpoints for product variants
export const variantAPI = {
  // Create new variant
  create: (variantData) => API.post("/api/variants", variantData),

  // Get variant by ID
  getById: (id) => API.get(`/api/variants/${id}`),

  // Get all variants for a product
  getByProductId: (productId) => API.get(`/api/variants/product/${productId}`),

  // Update variant
  update: (id, variantData) => API.put(`/api/variants/${id}`, variantData),

  // Delete variant
  delete: (id) => API.delete(`/api/variants/${id}`),
};

// API endpoints for shopping cart
export const cartAPI = {
  // Add item to cart
  addItem: (cartData) => API.post("/api/cart/add", cartData),

  // Get user's cart
  getCart: () => API.get("/api/cart"),

  // Update item quantity
  updateItem: (itemId, quantity) => API.put(`/api/cart/update/${itemId}`, null, { params: { quantity } }),

  // Remove item from cart
  removeItem: (itemId) => API.delete(`/api/cart/remove/${itemId}`),

  // Clear entire cart
  clearCart: () => API.delete("/api/cart/clear"),
};

export default API;
