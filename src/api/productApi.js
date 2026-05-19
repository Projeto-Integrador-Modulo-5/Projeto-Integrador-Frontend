import axiosInstance from './axiosInstance';

// ── Público ──────────────────────────────────────────────────────────────────
/** GET /products?page=0&size=12  → PageResponse<ProductResponse> */
export const getProducts = async ({ page = 0, size = 12, search = '' } = {}) => {
  const params = { page, size };
  if (search) params.search = search;
  const { data } = await axiosInstance.get('/products', { params });
  return data; // { content, page, size, totalElements, totalPages, last }
};

/** GET /products/:id */
export const getProductById = async (id) => {
  const { data } = await axiosInstance.get(`/products/${id}`);
  return data;
};

// ── Admin (/admin/products) ───────────────────────────────────────────────────
export const getAdminProductsApi = ({ page = 0, size = 12 } = {}) =>
  axiosInstance.get('/admin/products', { params: { page, size } });

export const createProductApi = (payload)      => axiosInstance.post('/admin/products', payload);
export const updateProductApi = (id, payload)  => axiosInstance.put(`/admin/products/${id}`, payload);
export const deactivateProductApi = (id)       => axiosInstance.delete(`/admin/products/${id}`);
export const uploadProductImageApi = (id, form) =>
  axiosInstance.post(`/admin/products/${id}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
