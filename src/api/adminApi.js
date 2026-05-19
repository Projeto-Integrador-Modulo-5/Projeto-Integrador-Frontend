import axiosInstance from './axiosInstance';

export const getDashboardApi = () => axiosInstance.get('/admin/dashboard');
