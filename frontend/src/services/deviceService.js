import api from './api';

export const getMyDevices = async () => {
  // Gọi tới API backend mà bạn bạn đã viết (giả sử là /device)
  const response = await api.get('/device');
  return response.data; // Thường trả về { success: true, devices: [...] }
};