import api from './api';

/**
 * @param {Object} boundaryData
 * @param {string} deviceId
 * @param {string} zoneName
 */
export const createBoundary = async (deviceId, boundaryData, zoneName) => {
  const payload = {
    device_id: deviceId,
    zone_name: zoneName,
    type: boundaryData.type,
    schedule_type: "ALWAYS",
    start_time: null,
    end_time: null,
    days_of_week: null,
    days_of_month: null,
    specific_date: null,
    radius: boundaryData.radius || null,
    center_lat: boundaryData.center_lat || null,
    center_lon: boundaryData.center_lon || null,
    points: boundaryData.points || null
  };

  const response = await api.post('/device/boundary/create', payload);
  return response.data;
};