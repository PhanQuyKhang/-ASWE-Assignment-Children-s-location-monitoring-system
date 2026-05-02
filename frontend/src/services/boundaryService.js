import api from './api';

export const createBoundary = async (deviceId, boundaryData) => {
  const payload = {
    device_id: deviceId,
    ...boundaryPayload(boundaryData),
  };
  const response = await api.post(`/device/boundary/create/${deviceId}`, payload);
  return response.data;
};

export const getBoundaries = async (deviceId) => {
  const response = await api.get(`/device/boundary/${deviceId}`);
  return response.data;
};

const boundaryPayload = (boundaryData) => ({
  zone_name: boundaryData.zone_name,
  type: boundaryData.type,
  schedule_type: boundaryData.schedule_type,
  start_time: boundaryData.start_time,
  duration: boundaryData.duration,
  days_of_week: boundaryData.days_of_week,
  days_of_month: boundaryData.days_of_month,
  specific_date: boundaryData.specific_date,
  radius: boundaryData.radius,
  center_lat: boundaryData.center_lat,
  center_lon: boundaryData.center_lon,
  points: boundaryData.points,
});

export const updateBoundary = async (zoneId, boundaryData) => {
  const response = await api.put(`/device/boundary/update/${zoneId}`, boundaryPayload(boundaryData));
  return response.data;
};

export const deleteBoundary = async (zoneId) => {
  const response = await api.post(`/device/boundary/delete/${zoneId}`);
  return response.data;
};
