import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload),
  login: (payload) => apiClient.post('/auth/login', payload)
};

export const catalogApi = {
  getCategories: () => apiClient.get('/catalog/categories/tree'),
  getProducts: (params = {}) => apiClient.get('/catalog/products', { params }),
  getProduct: (productId) => apiClient.get(`/catalog/products/${productId}`),
  getSizes: () => apiClient.get('/catalog/sizes')
};

export const cartApi = {
  getCart: (customerId) => apiClient.get(`/cart/${customerId}`),
  updateItem: (payload) => apiClient.post('/cart', payload),
  removeItem: (customerId, variantId) => apiClient.delete(`/cart/${customerId}/${variantId}`),
  checkout: (payload) => apiClient.post('/cart/checkout', payload)
};

export const wishlistApi = {
  getWishlist: (customerId) => apiClient.get(`/wishlist/${customerId}`),
  addItem: (payload) => apiClient.post('/wishlist', payload),
  removeItem: (customerId, productId) => apiClient.delete(`/wishlist/${customerId}/${productId}`)
};

export const ordersApi = {
  getOrders: (customerId) => apiClient.get(`/orders/customer/${customerId}`)
};

