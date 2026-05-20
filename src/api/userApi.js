import axiosInstance from './axiosInstance';

export const getProfileApi       = ()           => axiosInstance.get('/users/me');
export const updateProfileApi    = (data)       => axiosInstance.put('/users/me', data);
// data = { name, email }

export const updatePasswordApi   = (data)       => axiosInstance.put('/users/me/password', data);
// data = { currentPassword, newPassword }

export const getAddressesApi     = ()           => axiosInstance.get('/users/me/addresses');
export const addAddressApi       = (data)       => axiosInstance.post('/users/me/addresses', data);
export const updateAddressApi    = (id, data)   => axiosInstance.put(`/users/me/addresses/${id}`, data);
export const deleteAddressApi    = (id)         => axiosInstance.delete(`/users/me/addresses/${id}`);
export const setDefaultAddressApi = (id)        => axiosInstance.patch(`/users/me/addresses/${id}/default`);
