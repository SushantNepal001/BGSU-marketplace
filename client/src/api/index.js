import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ============ AUTH API ============
export const auth = {
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
}

// ============ LISTINGS API ============
export const listings = {
  // Get all listings with optional filters
  getAll: (filters = {}) =>
    api.get('/listings', { params: filters }),
  
  // Get single listing by ID
  getById: (id) =>
    api.get(`/listings/${id}`),
  
  // Create new listing
  create: (data) =>
    api.post('/listings', data),
  
  // Update listing
  update: (id, data) =>
    api.put(`/listings/${id}`, data),
  
  // Delete single listing
  delete: (id) =>
    api.delete(`/listings/${id}`),
  
  // Admin: Delete all listings
  deleteAll: () =>
    api.delete('/listings/admin/all'),
}

// ============ USERS API ============
export const users = {
  // Get all users
  getAll: () =>
    api.get('/users'),
  
  // Get all users with their listings
  getAllWithListings: () =>
    api.get('/users/with-listings'),
  
  // Get current logged-in user
  getMe: () =>
    api.get('/users/me'),
}

export default api