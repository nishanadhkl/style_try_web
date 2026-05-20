import axios from "axios";

// Create axios instance with base configuration
const API = axios.create({
  baseURL: "https://rosalva-basiliscan-penney.ngrok-free.dev",
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    // Add admin token if available
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }

    // Add user token if available (for customer routes)
    const userToken = localStorage.getItem("userToken");
    if (userToken && !adminToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
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
    if (error.response?.status === 401) {
      // Unauthorized - clear tokens and redirect
      localStorage.removeItem("adminToken");
      localStorage.removeItem("userToken");
      localStorage.removeItem("admin");

      // Redirect to login if not already there
      if (window.location.pathname !== "/admin/login" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    if (error.response?.status === 403) {
      // Forbidden - show message
      console.error("Access forbidden:", error.response.data);
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
  // Get all products
  getAll: () => API.get("/products"),

  // Get product by ID
  getById: (id) => API.get(`/products/${id}`),

  // Create new product
  create: (productData) => API.post("/products", productData),

  // Update product
  update: (id, productData) => API.put(`/products/${id}`, productData),

  // Delete product
  delete: (id) => API.delete(`/products/${id}`),

  // Get products by category
  getByCategory: (categoryId) => API.get(`/products/category/${categoryId}`),
};

// API endpoints for categories
export const categoryAPI = {
  // Get all categories
  getAll: () => API.get("/categories"),

  // Get category by ID
  getById: (id) => API.get(`/categories/${id}`),

  // Create new category
  create: (categoryData) => API.post("/categories", categoryData),

  // Update category
  update: (id, categoryData) => API.put(`/categories/${id}`, categoryData),

  // Delete category
  delete: (id) => API.delete(`/categories/${id}`),
};

// API endpoints for admin authentication
export const adminAPI = {
  // Admin login
  login: (credentials) => API.post("/api/auth/login", credentials),

  // Get admin dashboard stats
  getDashboardStats: () => API.get("/admin/dashboard/stats"),

  // Get all orders (admin)
  getAllOrders: () => API.get("/admin/orders"),

  // Update order status
  updateOrderStatus: (orderId, status) => API.put(`/admin/orders/${orderId}/status`, { status }),
};

// API endpoints for user authentication
export const authAPI = {
  // User registration
  register: (userData) => API.post("/auth/register", userData),

  // User login
  login: (credentials) => API.post("/auth/login", credentials),

  // Get user profile
  getProfile: () => API.get("/auth/profile"),

  // Update user profile
  updateProfile: (userData) => API.put("/auth/profile", userData),
};

// API endpoints for orders
export const orderAPI = {
  // Get user's orders
  getUserOrders: () => API.get("/orders"),

  // Get order by ID
  getById: (id) => API.get(`/orders/${id}`),

  // Create new order
  create: (orderData) => API.post("/orders", orderData),

  // Cancel order
  cancel: (orderId) => API.put(`/orders/${orderId}/cancel`),
};

export default API;
