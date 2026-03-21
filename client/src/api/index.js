import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ AUTH API ============
export const auth = {
  register: (name, email, password) =>
    api.post("/auth/register", { name, email, password }),
  login: (email, password) => api.post("/auth/login", { email, password }),
};

// ============ LISTINGS API ============
export const listings = {
  // Get all listings with optional filters
  getAll: (filters = {}) => api.get("/listings", { params: filters }),

  // Search listings with advanced filters
  // Parameters: q (query), category, minPrice, maxPrice, page, limit
  search: (query, filters = {}) =>
    api.get("/listings/search", { params: { q: query, ...filters } }),

  // Get single listing by ID
  getById: (id) => api.get(`/listings/${id}`),

  // Create new listing
  // Data should be: { title, description, price, category, imageUrl }
  // imageUrl is from Cloudinary upload (string URL)
  create: (data) => api.post("/listings", data),

  // Update listing
  // Data should be: { title, description, price, category, imageUrl? }
  update: (id, data) => api.put(`/listings/${id}`, data),

  // Delete single listing
  delete: (id) => api.delete(`/listings/${id}`),

  // Admin: Delete all listings
  deleteAll: () => api.delete("/listings/admin/all"),
  // Get current user's listings (requires auth)
  getMyListings: () => api.get("/listings/me/all"),
};

// ============ USERS API ============
export const users = {
  // Get all users
  getAll: () => api.get("/users"),

  // Get all users with their listings
  getAllWithListings: () => api.get("/users/with-listings"),

  // Get current logged-in user
  getMe: () => api.get("/users/me"),
};

// ============ REMIX API ============
export const remix = {
  create: (payload) => api.post("/remix", payload),
  refresh: (id) => api.post(`/remix/${id}/refresh`),
  getById: (id) => api.get(`/remix/${id}`),
};

// ============ REVIEWS API ============
export const reviews = {
  // Create a new review
  create: (data) => api.post("/reviews", data),

  // Get all reviews for a listing with aggregated stats
  getListingReviews: (listingId) => api.get(`/reviews/listing/${listingId}`),

  // Get single review by ID
  getById: (reviewId) => api.get(`/reviews/${reviewId}`),

  // Update a review
  update: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),

  // Delete a review
  delete: (reviewId) => api.delete(`/reviews/${reviewId}`),

  // Get seller's average rating and stats
  getSellerRating: (sellerId) => api.get(`/reviews/seller/${sellerId}`),
};

export default api;
