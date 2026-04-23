import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error?.response?.data?.errors?.[0]?.message || error?.message || "Request failed.";
    return Promise.reject(new Error(message));
  }
);

const unwrap = async (promise) => {
  const response = await promise;
  return response.data.data;
};

export const api = {
  setToken(token) {
    if (token) client.defaults.headers.common.Authorization = `Bearer ${token}`;
    else delete client.defaults.headers.common.Authorization;
  },
  async register(input) { return unwrap(client.post("/api/auth/register", input)); },
  async login(input) { return unwrap(client.post("/api/auth/login", input)); },
  async googleLogin(input) { return unwrap(client.post("/api/auth/google", input)); },
  async getProfile() { return unwrap(client.get("/api/auth/me")); },
  async getShops() { return unwrap(client.get("/api/shops")); },
  async getShop(shopId) { return unwrap(client.get(`/api/shops/${shopId}`)); },
  async getShopFeedback(shopId) { return unwrap(client.get(`/api/feedback/shop/${shopId}`)); },
  async addToCart(input) { return unwrap(client.post("/api/cart", input)); },
  async getCart() { return unwrap(client.get("/api/cart")); },
  async updateCartItem(menuItemId, quantity) { return unwrap(client.patch(`/api/cart/items/${menuItemId}`, { quantity })); },
  async removeCartItem(menuItemId) { return unwrap(client.delete(`/api/cart/items/${menuItemId}`)); },
  async clearCart() { return unwrap(client.delete("/api/cart")); },
  async checkoutCart(input) { return unwrap(client.post("/api/cart/checkout", input)); },
  async getMyOrders() { return unwrap(client.get("/api/orders/my-orders")); },
  async cancelOrder(orderId) { return unwrap(client.patch(`/api/orders/${orderId}/cancel`)); },
  async reportOrderIssue(orderId, description) { return unwrap(client.post(`/api/orders/${orderId}/report-issue`, { description })); },
  async createFeedback(input) { return unwrap(client.post("/api/feedback", input)); },
  async getVendorShop() { return unwrap(client.get("/api/shops/vendor/me")); },
  async createShop(input) { return unwrap(client.post("/api/shops", input)); },
  async updateVendorShop(input) { return unwrap(client.patch("/api/shops/vendor/me", input)); },
  async addMenuItem(input) { return unwrap(client.post("/api/shops/vendor/me/menu", input)); },
  async updateMenuItem(itemId, input) { return unwrap(client.patch(`/api/shops/vendor/me/menu/${itemId}`, input)); },
  async uploadShopImage(file) {
    const formData = new FormData(); formData.append("image", file);
    return unwrap(client.patch("/api/shops/vendor/me/image", formData, { headers: { "Content-Type": "multipart/form-data" } }));
  },
  async uploadMenuItemImage(itemId, file) {
    const formData = new FormData(); formData.append("image", file);
    return unwrap(client.patch(`/api/shops/vendor/me/menu/${itemId}/image`, formData, { headers: { "Content-Type": "multipart/form-data" } }));
  },
  async deleteMenuItem(itemId) { return unwrap(client.delete(`/api/shops/vendor/me/menu/${itemId}`)); },
  async getVendorOrders() { return unwrap(client.get("/api/orders/vendor")); },
  async updateOrderStatus(orderId, status) { return unwrap(client.patch(`/api/orders/${orderId}/status`, { status })); },
  async getDeliveryProfile() { return unwrap(client.get("/api/delivery/me")); },
  async getMyDeliveries() { return unwrap(client.get("/api/delivery/orders")); },
  async getAvailableDeliveries() { return unwrap(client.get("/api/delivery/available")); },
  async acceptDelivery(orderId) { return unwrap(client.post(`/api/delivery/orders/${orderId}/accept`)); },
  async updateDeliveryAvailability(input) { return unwrap(client.patch("/api/delivery/me/availability", input)); },
  async getVendorSummary() { return unwrap(client.get("/api/shops/vendor/me/summary")); },
  async getVendorFeedback() { return unwrap(client.get("/api/feedback/vendor/me")); },
  async getAdminSummary() { return unwrap(client.get("/api/admin/summary")); },
  async getAdminUsers() { return unwrap(client.get("/api/admin/users")); },
  async getAdminShops() { return unwrap(client.get("/api/admin/shops")); },
  async getAdminOrders() { return unwrap(client.get("/api/orders/admin")); },
  async updateUserStatus(userId, isActive) { return unwrap(client.patch(`/api/admin/users/${userId}/status`, { isActive })); },
  async getAdminReportedOrders() { return unwrap(client.get("/api/admin/reported-orders")); },
  async resolveOrderIssue(orderId, data) { return unwrap(client.patch(`/api/admin/orders/${orderId}/resolve`, data)); },
  async getAdminFeedback() { return unwrap(client.get("/api/admin/feedback")); },
};
