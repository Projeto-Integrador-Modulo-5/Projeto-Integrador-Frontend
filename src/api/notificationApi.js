import axiosInstance from './axiosInstance';

export const getNotificationsApi = ()   => axiosInstance.get('/notifications');
export const markAsReadApi       = (id) => axiosInstance.patch(`/notifications/${id}/read`);
export const markAllAsReadApi    = ()   => axiosInstance.patch('/notifications/read-all');
