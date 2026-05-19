import axiosInstance from './axiosInstance';

// ── Usuário ───────────────────────────────────────────────────────────────────
export const createOrderApi       = (data) => axiosInstance.post('/orders', data);
// data = { addressId, items: [{ productId, size, quantity }] }

export const getUserOrdersApi     = ()     => axiosInstance.get('/orders/my');
export const getUserOrderByIdApi  = (id)   => axiosInstance.get(`/orders/my/${id}`);

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getAdminOrdersApi    = (params) => axiosInstance.get('/admin/orders', { params });
// params: { status?, page?, size? }

export const getAdminOrderByIdApi = (id)     => axiosInstance.get(`/admin/orders/${id}`);
export const updateOrderStatusApi = (id, status) =>
  axiosInstance.patch(`/admin/orders/${id}/status`, { status });
