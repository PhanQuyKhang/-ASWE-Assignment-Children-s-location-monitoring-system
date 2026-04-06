import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polygon } from 'react-leaflet';
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
        setTimeout(() => { map.invalidateSize(); }, 200);
    }, [map]);
    return null;
}

function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) { map.flyTo(center, map.getZoom(), { animate: true }); }
    }, [center, map]);
    return null;
}

function MapClickHandler({ mode, drawType, setPoints }) {
    useMapEvents({
        click: (e) => {
            if (mode === 'edit' && drawType === 'POLYGON') {
                const { lat, lng } = e.latlng;
                setPoints(prev => [...prev, [lat, lng]]);
            }
        },
    });
    return null;
}

export default function Map({ deviceId, mode, onSave }) {
    const [position, setPosition] = useState([10.7626, 106.6602]);
    const [isOnline, setIsOnline] = useState(false);
    const [drawType, setDrawType] = useState('POLYGON');
    const [polygonPoints, setPolygonPoints] = useState([]);

    useEffect(() => {
        if (mode !== 'edit') setPolygonPoints([]);

        const socket = io('http://localhost:3000', {
            withCredentials: true,
            transports: ['polling', 'websocket'] 
        });

        socket.on('connect', () => {
            setIsOnline(true)
            console.log("🟢 Socket connected");
        });

        socket.on('location_update', (data) => {
            if (data.lat && data.lon) setPosition([data.lat, data.lon]);
        });
        socket.on('connect_error', (err) => {
            setIsOnline(false)
            console.log("Socket failed to connect: ", err)
        });

        return () => socket.disconnect();
    }, [deviceId, mode]);

    const handleRemovePoint = (index) => {
        if (mode !== 'edit') return;
        setPolygonPoints(prev => prev.filter((_, i) => i !== index));
    };

    const handleDragPoint = (index, newLatLng) => {
        setPolygonPoints(prev => {
            const updated = [...prev];
            updated[index] = [newLatLng.lat, newLatLng.lng];
            return updated;
        });
    };

    const handleSave = () => {
        if (drawType === 'POLYGON') {
            if (polygonPoints.length < 3) return alert("Select at least 3 points!");
            
            const boundaryData = {
                type: 'POLYGON',
                points: polygonPoints.map(p => ({ latitude: p[0], longitude: p[1] })),
                radius: null,
                center_lat: null,
                center_lon: null
            };
            onSave(boundaryData);
        }
    };

    return (
        <div className="relative w-full h-[500px] rounded-xl overflow-hidden border shadow-lg">
            <div className="absolute top-2 right-2 z-[1000] bg-white/90 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {isOnline ? 'LIVE UPDATING' : 'DISCONNECTED'}
            </div>

            {mode === 'edit' && (
                <div className="absolute top-4 left-14 z-[1000] flex gap-2">
                    <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg shadow-lg text-sm font-bold">
                        Save Boundary
                    </button>
                    <button onClick={() => setPolygonPoints([])} className="bg-white text-gray-700 px-4 py-1.5 rounded-lg shadow border text-sm font-bold">
                        Clear All
                    </button>
                </div>
            )}

            <MapContainer center={position} zoom={16} style={{ height: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                <Marker position={position}>
                    <Popup>Device ID: {deviceId || 'Unknown'}</Popup>
                </Marker>

                {polygonPoints.length > 0 && (
                    <Polygon 
                        positions={polygonPoints} 
                        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.3 }} 
                    />
                )}

                {mode === 'edit' && polygonPoints.map((p, idx) => (
                    <Marker 
                        key={`point-${idx}-${p[0]}-${p[1]}`} // Key kết hợp tọa độ để Marker render lại khi kéo
                        position={p} 
                        draggable={true}
                        eventHandlers={{ 
                            click: () => handleRemovePoint(idx),
                            dragend: (e) => handleDragPoint(idx, e.target.getLatLng())
                        }}
                        icon={L.divIcon({
                            className: 'bg-blue-500 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md cursor-move',
                            iconSize: [14, 14],
                            iconAnchor: [7, 7]
                        })} 
                    />
                ))}
                
                <MapResizer />
                <ChangeView center={position} />
                <MapClickHandler mode={mode} drawType={drawType} setPoints={setPolygonPoints} />
            </MapContainer>

            {mode === 'edit' && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] bg-black/60 text-white px-3 py-1 rounded-full text-[10px]">
                    Click to add • Drag to move • Click point to remove
                </div>
            )}
        </div>
    );
}