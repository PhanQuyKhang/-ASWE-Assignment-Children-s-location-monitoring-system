import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polygon } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- FIX LEAFLET MARKER ICONS ---
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
    useEffect(() => { setTimeout(() => { map.invalidateSize(); }, 200); }, [map]);
    return null;
}

function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => { if (center) { map.flyTo(center, map.getZoom()); } }, [center, map]);
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
    const [polygonPoints, setPolygonPoints] = useState([]);

    // --- FORM STATES ---
    const [zoneName, setZoneName] = useState('');
    const [drawType, setDrawType] = useState('POLYGON');
    const [scheduleType, setScheduleType] = useState('ALWAYS');
    const [startTime, setStartTime] = useState('');
    const [duration, setDuration] = useState(60);
    const [selectedDays, setSelectedDays] = useState([]); // For WEEKLY
    const [selectedMonthDays, setSelectedMonthDays] = useState([]); // For MONTHLY
    const [specificDate, setSpecificDate] = useState(''); // For ONCE

    const daysOfWeek = [
        { label: 'S', value: 0 }, { label: 'M', value: 1 }, { label: 'T', value: 2 },
        { label: 'W', value: 3 }, { label: 'T', value: 4 }, { label: 'F', value: 5 }, { label: 'S', value: 6 }
    ];

    useEffect(() => {
        const socket = io('http://localhost:3000', { withCredentials: true, transports: ['polling', 'websocket'] });
        socket.on('connect', () => setIsOnline(true));
        socket.on('location_update', (data) => { if (data.lat && data.lon) setPosition([data.lat, data.lon]); });
        return () => socket.disconnect();
    }, []);

    const toggleDay = (day) => {
        setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const toggleMonthDay = (day) => {
        setSelectedMonthDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const handleInternalSave = () => {
        if (!zoneName) return alert("Please enter a Zone Name");
        if (drawType === 'POLYGON' && polygonPoints.length < 3) return alert("Select at least 3 points");

        const boundaryData = {
            type: drawType,
            zone_name: zoneName,
            schedule_type: scheduleType,
            start_time: scheduleType === 'ALWAYS' ? null : startTime,
            duration: scheduleType === 'ALWAYS' ? null : Number(duration),
            days_of_week: scheduleType === 'WEEKLY' ? selectedDays : null,
            days_of_month: scheduleType === 'MONTHLY' ? selectedMonthDays : null,
            specific_date: scheduleType === 'ONCE' ? specificDate : null,
            points: drawType === 'POLYGON' ? polygonPoints.map(p => ({ latitude: p[0], longitude: p[1] })) : null,
            radius: null,
            center_lat: null,
            center_lon: null
        };

        onSave(boundaryData);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 h-full">
            {mode === 'edit' && (
                <div className="w-full lg:w-80 bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-4 overflow-y-auto max-h-[500px]">
                    <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">Boundary Configuration</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Zone Name</label>
                        <input 
                            type="text" value={zoneName} onChange={(e) => setZoneName(e.target.value)}
                            placeholder="e.g. School, Home" className="w-full p-2 border rounded-md text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Schedule Type</label>
                        <select 
                            value={scheduleType} onChange={(e) => setScheduleType(e.target.value)}
                            className="w-full p-2 border rounded-md text-sm"
                        >
                            <option value="ALWAYS">Always</option>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="ONCE">Once</option>
                        </select>
                    </div>

                    {scheduleType !== 'ALWAYS' && (
                        <div className="flex flex-col gap-3 p-2 bg-white rounded border border-gray-100">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-400 font-bold">Start</label>
                                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-1 border-b text-sm focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-400 font-bold">Duration (min)</label>
                                    <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-1 border-b text-sm focus:outline-none" />
                                </div>
                            </div>

                            {scheduleType === 'WEEKLY' && (
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Days</label>
                                    <div className="flex justify-between">
                                        {daysOfWeek.map(day => (
                                            <button key={day.value} onClick={() => toggleDay(day.value)} className={`w-7 h-7 flex items-center justify-center rounded-full border text-[10px] ${selectedDays.includes(day.value) ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-400'}`}>
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {scheduleType === 'MONTHLY' && (
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Days of Month</label>
                                    <div className="grid grid-cols-7 gap-1">
                                        {[...Array(31)].map((_, i) => (
                                            <button key={i+1} onClick={() => toggleMonthDay(i+1)} className={`w-full aspect-square flex items-center justify-center rounded border text-[9px] ${selectedMonthDays.includes(i+1) ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>
                                                {i+1}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {scheduleType === 'ONCE' && (
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-400 font-bold">Specific Date</label>
                                    <input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} className="w-full p-1 border-b text-sm focus:outline-none" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-2 flex flex-col gap-2">
                        <button onClick={handleInternalSave} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition-colors">
                            Save Boundary
                        </button>
                        <button onClick={() => setPolygonPoints([])} className="w-full bg-white text-gray-500 py-2 rounded-lg text-sm border hover:bg-gray-50 transition-colors">
                            Clear Points
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 relative min-h-[400px] rounded-xl overflow-hidden border shadow-lg">
                <div className="absolute top-2 right-2 z-[1000] bg-white/90 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {isOnline ? 'CONNECTED' : 'OFFLINE'}
                </div>

                <MapContainer center={position} zoom={16} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={position}><Popup>Device: {deviceId}</Popup></Marker>
                    {polygonPoints.length > 0 && <Polygon positions={polygonPoints} pathOptions={{ color: '#3b82f6', fillOpacity: 0.3 }} />}
                    {mode === 'edit' && polygonPoints.map((p, idx) => (
                        <Marker 
                            key={`pt-${idx}-${p[0]}`} position={p} draggable={true}
                            eventHandlers={{ 
                                click: () => setPolygonPoints(prev => prev.filter((_, i) => i !== idx)),
                                dragend: (e) => {
                                    const newPoints = [...polygonPoints];
                                    newPoints[idx] = [e.target.getLatLng().lat, e.target.getLatLng().lng];
                                    setPolygonPoints(newPoints);
                                }
                            }}
                            icon={L.divIcon({ className: 'bg-blue-500 w-3 h-3 rounded-full border-2 border-white shadow-md cursor-move' })} 
                        />
                    ))}
                    <MapResizer />
                    <ChangeView center={position} />
                    <MapClickHandler mode={mode} drawType={drawType} setPoints={setPolygonPoints} />
                </MapContainer>
            </div>
        </div>
    );
}