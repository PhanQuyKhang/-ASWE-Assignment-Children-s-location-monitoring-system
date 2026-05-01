import api from './api';

/**
 * Lấy cảnh báo mới nhất của một thiết bị cụ thể
 */
export const getLatestAlert = async (deviceId) => {
  const response = await api.get(`/alert/latest/${deviceId}`);
  return response.data; // Mong đợi { success: true, data: { alert_type, message, ... } }
};

/**
 * Lấy lịch sử tất cả cảnh báo của một thiết bị
 */
export const getAlertHistory = async (deviceId) => {
  const response = await api.get(`/alert/history/${deviceId}`);
  return response.data;
};

/**
 * Lấy toàn bộ cảnh báo của tất cả các con thuộc về User này
 */
export const getAllUserAlerts = async () => {
  const response = await api.get('/alert/');
  return response.data;
};