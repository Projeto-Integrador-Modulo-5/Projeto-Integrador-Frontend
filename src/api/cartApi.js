import axiosInstance from './axiosInstance';

export const getCartApi        = ()               => axiosInstance.get('/cart');
export const addToCartApi      = (item)           => axiosInstance.post('/cart/items', item);
// item = { productId, size, quantity }

export const updateCartItemApi = (productId, data) => axiosInstance.put(`/cart/items/${productId}`, data);
// data = { size, quantity }

export const removeCartItemApi = (productId, size) => axiosInstance.delete(`/cart/items/${productId}`, { params: { size } });
export const clearCartApi      = ()               => axiosInstance.delete('/cart');
