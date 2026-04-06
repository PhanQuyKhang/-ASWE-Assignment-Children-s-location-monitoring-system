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
        const savedToken = localStorage.getItem('accessToken') || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFsaWNlQGRlbW8uY29tIiwicm9sZSI6IlBBUkVOVCIsImlhdCI6MTc3NTQ2NDUwOSwiZXhwIjoxNzc2MDY5MzA5fQ.2wd9AOEkbjDiUH-ePBocZTOB1lNGKbQHZ4NRzOAj7nE";

        const socket = io('http://localhost:3000', {
            transports: ['polling', 'websocket'],
            extraHeaders: { token: savedToken }
        });

        socket.on('connect', () => {
            setIsOnline(true);
            console.log("🟢 Connected!");
        });

        socket.on('location_update', (data) => {
            if (data.lat && data.lon) {
                const newPos = [data.lat, data.lon];
                setPosition(newPos);
                console.log("✅ Đã cập nhật position mới, ChangeView sẽ tự lướt map.");
            }
        });

        socket.on('connect_error', () => setIsOnline(false));

        return () => { socket.disconnect(); };
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