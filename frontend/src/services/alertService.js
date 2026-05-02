import api from './api';

export const getLatestAlert = async (deviceId) => {
  const response = await api.get(`/alert/latest/${deviceId}`);
  return response.data;
};

export const getAlertHistory = async (deviceId, params = {}) => {
  const response = await api.get(`/alert/history/${deviceId}`, { params });
  return response.data;
};

export const getAllUserAlerts = async ({ limit = 30, cursor } = {}) => {
  const response = await api.get('/alert/', { params: { limit, cursor } });
  return {
    alerts: response.data?.data ?? [],
    nextCursor: response.data?.nextCursor ?? null,
  };
};
