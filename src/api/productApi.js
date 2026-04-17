import axiosInstance from './axiosInstance';

/**
 * Retorna todos os produtos ativos
 * GET /products
 * @returns {Promise<Array>} lista de produtos
 */
export const getProducts = async () => {
  const response = await axiosInstance.get('/products');
  return response.data;
};

/**
 * Retorna detalhe de um produto
 * GET /products/:id
 * @param {string} id - UUID do produto
 * @returns {Promise<Object>} produto
 */
export const getProductById = async (id) => {
  const response = await axiosInstance.get(`/products/${id}`);
  return response.data;
};

/**
 * Retorna o carrinho do usuário autenticado
 * GET /cart
 */
export const getCart = async () => {
  const response = await axiosInstance.get('/cart');
  return response.data;
};

/**
 * Adiciona item ao carrinho
 * POST /cart/items
 * @param {{ productId: string, size: string, quantity: number }} item
 */
export const addToCart = async (item) => {
  const response = await axiosInstance.post('/cart/items', item);
  return response.data;
};
