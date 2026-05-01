import { useState, useEffect } from 'react';
import { getBoundaries } from '../services/boundaryService';

export default function useBoundaries(deviceId) {
  const [existingZones, setExistingZones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!deviceId) return;
      try {
        setLoading(true);
        const result = await getBoundaries(deviceId);
        if (result.success) {
          setExistingZones(result.data);
        }
      } catch (err) {
        console.error("Error fetching boundaries:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [deviceId]);

  return { existingZones, setExistingZones, loading };
}