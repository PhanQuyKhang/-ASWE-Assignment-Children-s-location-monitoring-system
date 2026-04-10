import api from './api';

export const getMyDevices = async (userId) => {
  const response = await api.get(`/device/${userId}`);
  return response.data; 
};