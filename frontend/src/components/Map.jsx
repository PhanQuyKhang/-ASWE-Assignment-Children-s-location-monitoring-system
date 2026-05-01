import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import api from '../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [10.7626, 106.6602];
const RECENT_MS = 2 * 60 * 1000;

function apiOrigin() {
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] != null && center[1] != null) {
      map.flyTo(center, map.getZoom(), { animate: true, duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

function formatBattery(b) {
  if (b == null || Number.isNaN(Number(b))) return null;
  const n = Number(b);
  return `${Math.round(n)}%`;
}

export default function Map({ deviceId, device }) {
  const [position, setPosition] = useState(DEFAULT_CENTER);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastLiveAt, setLastLiveAt] = useState(null);
  const [overlay, setOverlay] = useState({
    battery: null,
    activity: null,
    timestampLabel: null,
  });
  const [clock, setClock] = useState(() => Date.now());

  const childName = device?.child_name || 'Child';

  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  let trackerOk = false;
  if (deviceId) {
    if (device?.status !== 'INACTIVE' && device?.status !== 'NOSIGNAL') {
      const recent = lastLiveAt != null && clock - lastLiveAt < RECENT_MS;
      trackerOk = recent || device?.status === 'ACTIVE';
    }
  }

  useEffect(() => {
    if (!deviceId) return;

    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get(`/log/latest/${deviceId}`);
        const log = data?.data;
        if (cancelled || !log) return;

        const lat = Number(log.latitude);
        const lon = Number(log.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          setPosition([lat, lon]);
        }

        setOverlay({
          battery: log.battery_level,
          activity: log.activity_type,
          timestampLabel: log.timestamp || log.updated_at || null,
        });
      } catch {
        const lat = device?.last_lat != null ? Number(device.last_lat) : NaN;
        const lon = device?.last_lon != null ? Number(device.last_lon) : NaN;
        if (!cancelled && !Number.isNaN(lat) && !Number.isNaN(lon)) {
          setPosition([lat, lon]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deviceId, device?.last_lat, device?.last_lon]);

  useEffect(() => {
    if (!deviceId) return;

    const socket = io(apiOrigin(), {
      withCredentials: true,
      transports: ['polling', 'websocket'],
    });

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('connect_error', () => setSocketConnected(false));

    socket.on('location_update', (payload) => {
      if (!payload || payload.device_id !== deviceId) return;

      const lat = Number(payload.latitude);
      const lon = Number(payload.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        setPosition([lat, lon]);
      }

      const t = Date.now();
      setLastLiveAt(t);
      setClock(t);
      setOverlay({
        battery: payload.battery,
        activity: payload.activity_type,
        timestampLabel: payload.timestamp || null,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [deviceId]);

  if (!deviceId) {
    return (
      <div className="card-note" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
        Select a child device on the <strong>Devices</strong> tab to see the live map.
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border-2 border-gray-100 shadow-lg">
      <div className="absolute top-2 right-2 z-[1000] flex flex-col items-end gap-1">
        <div className="bg-white/90 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
          />
          {socketConnected ? 'App connected' : 'App offline'}
        </div>
        <div className="bg-white/90 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${trackerOk ? 'bg-green-500 animate-pulse' : 'bg-amber-600'}`}
          />
          {trackerOk ? 'Tracker OK' : device?.status === 'NOSIGNAL' ? 'No signal' : 'Waiting for ping'}
        </div>
      </div>

      <MapContainer center={position} zoom={16} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <Marker position={position}>
          <Popup>
            {childName}
            <br />
            <span style={{ fontSize: '11px', wordBreak: 'break-all' }}>{deviceId}</span>
          </Popup>
        </Marker>

        <MapResizer />
        <ChangeView center={position} />
      </MapContainer>

      <div className="map-meta-bar">
        <strong>{childName}</strong>
        {overlay.activity ? (
          <>
            {' '}
            · Activity: {overlay.activity}
          </>
        ) : null}
        {formatBattery(overlay.battery) ? (
          <>
            {' '}
            · Battery: {formatBattery(overlay.battery)}
          </>
        ) : null}
        {overlay.timestampLabel ? (
          <>
            <br />
            Last update: {overlay.timestampLabel}
          </>
        ) : null}
      </div>
    </div>
  );
}
