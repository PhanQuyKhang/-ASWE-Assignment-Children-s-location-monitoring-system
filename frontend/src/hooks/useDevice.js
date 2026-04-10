import { useState, useEffect } from 'react';
import { getMyDevices } from '../services/deviceService';

export default function useDevices() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getMyDevices();
        const deviceList = data.devices || [];
        setDevices(deviceList);
        
        // Tự động chọn thiết bị đầu tiên nếu có
        if (deviceList.length > 0) {
          setSelectedDevice(deviceList[0]);
        }
      } catch (err) {
        console.error("Error fetching devices:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { devices, selectedDevice, setSelectedDevice, loading };
}