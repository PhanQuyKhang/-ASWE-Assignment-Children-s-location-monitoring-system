import api from './api';

export async function getMyDevices() {
  const res = await api.get('/device');
  return res.data?.data ?? [];
}

export async function addDevice(payload) {
  const res = await api.post('/device/add', payload);
  return res.data;
}

export async function updateDevice(deviceId, payload) {
  const res = await api.put(`/device/${deviceId}`, payload);
  return res.data;
}

export async function removeDevice(deviceId) {
  const res = await api.delete(`/device/${deviceId}`);
  return res.data;
}
