import api from './api';

export const getMyDevices = async () => {
  const response = await api.get(`/device`);
  return response.data; 
};