// frontend/src/hooks/useDevice.js
import { useState, useEffect } from 'react';
import { getMyDevices } from '../services/deviceService';

export default function useDevices(userId) {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Nếu chưa có userId (chưa login xong), không gọi API
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getMyDevices(userId); 
        const deviceList = response.data;        
        setDevices(deviceList);
        
        // Tự động chọn thiết bị đầu tiên nếu mảng có dữ liệu
        if (deviceList.length > 0) {
          setSelectedDevice(deviceList[0]);
        } else {
          setSelectedDevice(null);
        }
      } catch (err) {
        console.error("Fetch devices error:", err);
        setDevices([]);
        setSelectedDevice(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]); // Chỉ chạy lại khi userId thay đổi

  return { devices, selectedDevice, setSelectedDevice, loading };
}