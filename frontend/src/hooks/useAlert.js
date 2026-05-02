import { useState, useEffect, useCallback } from 'react';
import { getAlertHistory } from '../services/alertService';

export default function useAlerts(deviceId) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!deviceId) return;
    try {
      setLoading(true);
      const result = await getAlertHistory(deviceId);
      if (result.success) {
        setAlerts(result.data);
      }
    } catch (err) {
      console.error("Failed to load alert history", err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { alerts, loading, refreshAlerts: fetchHistory };
}