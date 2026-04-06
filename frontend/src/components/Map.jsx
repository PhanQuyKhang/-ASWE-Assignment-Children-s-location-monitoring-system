import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
            console.log("🔄 Map size invalidated - tiles fixed!");
        }, 200);
    }, [map]);
    return null;
}

// Component hỗ trợ di chuyển camera mượt mà
function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom(), { animate: true, duration: 1.5 });
        }
    }, [center, map]);
    return null;
}

export default function Map({ deviceId }) {
    const [position, setPosition] = useState([10.7626, 106.6602]);
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        // KHÔNG CẦN: const token = localStorage.getItem(...) nữa
        
        // 1. KẾT NỐI SOCKET (Tự động dùng Cookie)
        const socket = io('http://localhost:3000', {
            withCredentials: true,
            transports: ['polling', 'websocket'] 
        });

        socket.on('connect', () => {
            setIsOnline(true)
            console.log("🟢 Socket connected using Browser Cookies!");
        });

        socket.on('location_update', (data) => {
            console.log("📍 New location:", data);
            if (data.lat && data.lon) {
                setPosition([data.lat, data.lon]);
            }
        });

        socket.on('connect_error', (err) => {
            console.error("❌ Socket Error (Check if logged in):", err.message);
        });

        return () => {
            socket.disconnect();
        };
    }, [deviceId]);
    return (
        <div className="relative w-full h-[500px] rounded-xl overflow-hidden border-2 border-gray-100 shadow-lg">
            <div className="absolute top-2 right-2 z-[1000] bg-white/90 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {isOnline ? 'LIVE UPDATING' : 'DISCONNECTED'}
            </div>
            <MapContainer 
                center={position} 
                zoom={16} 
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                
                <Marker position={position}>
                    <Popup>
                        Đang theo dõi thiết bị: {deviceId}
                    </Popup>
                </Marker>
                
                <MapResizer />
                <ChangeView center={position} />
            </MapContainer>
        </div>
    );
}