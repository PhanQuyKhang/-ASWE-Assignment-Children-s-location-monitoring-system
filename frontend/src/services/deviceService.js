import api from './api';

export const getMyDevices = async () => {
  const response = await api.get(`/device`);
  return response.data;
};

/**
 * Registers a child device; backend returns generated UUID for Traccar.
 * @param {{ childName: string, timezone: string }} payload
 */
export const addDevice = async (payload) => {
  const response = await api.post('/device/add', payload);
  return response.data;
};