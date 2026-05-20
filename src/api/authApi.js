import axiosInstance from './axiosInstance';

export const loginApi    = (data)         => axiosInstance.post('/auth/login', data);
export const registerApi = (data)         => axiosInstance.post('/auth/register', data);
export const refreshApi  = (refreshToken) => axiosInstance.post('/auth/refresh', { refreshToken });
export const logoutApi   = (refreshToken) => axiosInstance.post('/auth/logout', { refreshToken });
