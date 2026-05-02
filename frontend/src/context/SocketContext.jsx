/* eslint-disable react-refresh/only-export-components -- context + provider in one module */
import { createContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import useAuth from '../hooks/useAuth';

export const SocketContext = createContext(null);

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function SocketProvider({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [stickyAlert, setStickyAlert] = useState(null);
  const [needsAttention, setNeedsAttention] = useState(false);

  useEffect(() => {
    if (loading || !isAuthenticated || !user?.user_id) {
      return undefined;
    }

    const s = io(API_ORIGIN, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
    });

    const onConnect = () => {
      setConnected(true);
      setReconnecting(false);
    };
    const onDisconnect = () => {
      setConnected(false);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.io.on('reconnect_attempt', () => setReconnecting(true));
    s.io.on('reconnect', () => setReconnecting(false));
    s.io.on('reconnect_error', () => setReconnecting(true));

    // eslint-disable-next-line react-hooks/set-state-in-effect -- socket instance is created inside this effect
    setSocket(s);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.disconnect();
      setSocket(null);
      setConnected(false);
      setReconnecting(false);
      setStickyAlert(null);
    };
  }, [loading, isAuthenticated, user?.user_id]);

  useEffect(() => {
    if (!socket) return undefined;

    const onOut = (data) => {
      setNeedsAttention(true);
      setStickyAlert({
        kind: 'danger',
        childName: data.child_name,
        zoneName: data.zone_name,
        deviceId: data.device_id,
      });
    };
    const onEnter = () => {
      setStickyAlert(null);
    };
    const onSignal = () => {
      setNeedsAttention(true);
    };

    socket.on('alert_device_out_of_zone', onOut);
    socket.on('alert_device_enter_of_zone', onEnter);
    socket.on('alert_device_out_of_signal', onSignal);

    return () => {
      socket.off('alert_device_out_of_zone', onOut);
      socket.off('alert_device_enter_of_zone', onEnter);
      socket.off('alert_device_out_of_signal', onSignal);
    };
  }, [socket]);

  const value = useMemo(
    () => ({
      socket,
      connected,
      reconnecting,
      apiOrigin: API_ORIGIN,
      stickyAlert,
      setStickyAlert,
      needsAttention,
      clearNeedsAttention: () => setNeedsAttention(false),
    }),
    [socket, connected, reconnecting, stickyAlert, needsAttention]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
