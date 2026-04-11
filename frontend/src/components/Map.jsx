import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polygon, Circle } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

function MapResizer() {
    const map = useMap();
    useEffect(() => { setTimeout(() => { map.invalidateSize(); }, 200); }, [map]);
    return null;
}

function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => { if (center) { map.flyTo(center, map.getZoom(), { animate: true }); } }, [center, map]);
    return null;
}

function MapClickHandler({ mode, drawType, setPoints, setCircleCenter }) {
    useMapEvents({
        click: (e) => {
            if (mode === 'edit') {
                if (drawType === 'POLYGON') {
                    setPoints(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
                } else if (drawType === 'CIRCLE') {
                    setCircleCenter([e.latlng.lat, e.latlng.lng]);
                }
            }
        },
    });
    return null;
}

export default function Map({ deviceId, mode, onSave, initialPosition }) {
    // Ưu tiên dùng vị trí ban đầu truyền từ Dashboard, nếu không có mới dùng Quận 10
    const [position, setPosition] = useState(initialPosition || [10.7626, 106.6602]);
    const [isOnline, setIsOnline] = useState(false);
    
    const [drawType, setDrawType] = useState('POLYGON');
    const [zoneName, setZoneName] = useState('');
    const [scheduleType, setScheduleType] = useState('ALWAYS');
    const [startTime, setStartTime] = useState('');
    const [duration, setDuration] = useState(60);
    const [selectedDays, setSelectedDays] = useState([]);
    const [selectedMonthDays, setSelectedMonthDays] = useState([]);
    const [specificDate, setSpecificDate] = useState('');

    const [polygonPoints, setPolygonPoints] = useState([]);
    const [circleCenter, setCircleCenter] = useState(null);
    const [radius, setRadius] = useState(100);

    const daysOfWeek = [{ label: 'S', value: 0 }, { label: 'M', value: 1 }, { label: 'T', value: 2 }, { label: 'W', value: 3 }, { label: 'T', value: 4 }, { label: 'F', value: 5 }, { label: 'S', value: 6 }];

    // Cập nhật position khi initialPosition thay đổi (khi user switch device)
    useEffect(() => {
        if (initialPosition) {
            setPosition(initialPosition);
        }
    }, [initialPosition]);

    useEffect(() => {
        if (!deviceId) return;

        const socket = io('http://localhost:3000', { withCredentials: true, transports: ['polling', 'websocket'] });
        socket.on('connect', () => setIsOnline(true));
        socket.on('location_update', (data) => {
            console.log("📍 Nhận tin socket:", data);

            // CHỈ CẬP NHẬT NẾU ID TRONG TIN NHẮN KHỚP VỚI ID COMPONENT ĐANG GIỮ
            if (data.device_id === deviceId) {
                console.log("✅ Khớp ID, cập nhật Map cho:", deviceId);
                if (data.lat && data.lon) {
                    setPosition([data.lat, data.lon]);
                }
            } else {
                console.log("⏭️ Bỏ qua tin của thiết bị khác:", data.device_id);
            }
        });
        socket.on('connect_error', () => setIsOnline(false));

        return () => socket.disconnect();
    }, [deviceId]);

    const handleInternalSave = () => {
        if (!zoneName) return toast.warning("Missing Name", { description: "Please enter a Zone Name" });
        
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
            radius: drawType === 'CIRCLE' ? Number(radius) : null,
            center_lat: drawType === 'CIRCLE' ? circleCenter?.[0] : null,
            center_lon: drawType === 'CIRCLE' ? circleCenter?.[1] : null
        };

        if (drawType === 'POLYGON' && (!boundaryData.points || boundaryData.points.length < 3)) return toast.error("Invalid Polygon", { description: "Select at least 3 points" });
        if (drawType === 'CIRCLE' && !circleCenter) return toast.error("Invalid Circle", { description: "Click on map to set center" });

        onSave(boundaryData);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 h-full">
            {mode === 'edit' && (
                <div className="w-full lg:w-80 bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-4 overflow-y-auto max-h-[500px]">
                    <h3 className="font-bold text-gray-700 uppercase text-xs">Boundary Settings</h3>
                    <div className="flex p-1 bg-gray-200 rounded-lg">
                        <button onClick={() => setDrawType('POLYGON')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md ${drawType === 'POLYGON' ? 'bg-white shadow' : 'text-gray-500'}`}>POLYGON</button>
                        <button onClick={() => setDrawType('CIRCLE')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md ${drawType === 'CIRCLE' ? 'bg-white shadow' : 'text-gray-500'}`}>CIRCLE</button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Zone Name</label>
                        <input type="text" value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="e.g. School" className="w-full p-2 border rounded-md text-sm" />
                    </div>

                    {drawType === 'CIRCLE' && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Radius (meters)</label>
                            <input type="number" value={radius} onChange={(e) => setRadius(e.target.value)} className="w-full p-2 border rounded-md text-sm" />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Schedule</label>
                        <select value={scheduleType} onChange={(e) => setScheduleType(e.target.value)} className="w-full p-2 border rounded-md text-sm">
                            <option value="ALWAYS">Always</option>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="ONCE">Once</option>
                        </select>
                    </div>

                    {scheduleType !== 'ALWAYS' && (
                        <div className="p-2 bg-white rounded border border-gray-100 flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="text-xs border-b focus:outline-none" />
                                <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Min" className="text-xs border-b focus:outline-none" />
                            </div>
                            {scheduleType === 'WEEKLY' && (
                                <div className="flex justify-between">
                                    {daysOfWeek.map(day => (
                                        <button key={day.value} onClick={() => toggleDay(day.value)} className={`w-6 h-6 rounded-full text-[9px] border ${selectedDays.includes(day.value) ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>{day.label}</button>
                                    ))}
                                </div>
                            )}
                            {scheduleType === 'MONTHLY' && (
                                <div className="grid grid-cols-7 gap-1">
                                    {[...Array(31)].map((_, i) => (
                                        <button key={i+1} onClick={() => toggleMonthDay(i+1)} className={`text-[8px] border rounded ${selectedMonthDays.includes(i+1) ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>{i+1}</button>
                                    ))}
                                </div>
                            )}
                            {scheduleType === 'ONCE' && <input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} className="text-xs border-b focus:outline-none" />}
                        </div>
                    )}

                    <div className="mt-4 flex flex-col gap-2">
                        <button onClick={handleInternalSave} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm shadow hover:bg-blue-700">Save Boundary</button>
                        <button onClick={() => { setPolygonPoints([]); setCircleCenter(null); }} className="text-xs text-gray-400 hover:text-gray-600 underline">Clear Drawing</button>
                    </div>
                </div>
            )}

            <div className="flex-1 relative min-h-[400px] lg:h-[500px] rounded-xl overflow-hidden border shadow-lg">
                <div className="absolute top-2 right-2 z-[1000] bg-white/90 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {isOnline ? 'CONNECTED' : 'OFFLINE'}
                </div>

                <MapContainer center={position} zoom={16} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={position}><Popup>Current position</Popup></Marker>
                    {drawType === 'POLYGON' && polygonPoints.length > 0 && <Polygon positions={polygonPoints} pathOptions={{ color: '#3b82f6', fillOpacity: 0.3 }} />}
                    {drawType === 'POLYGON' && mode === 'edit' && polygonPoints.map((p, idx) => (
                        <Marker key={`p-${idx}`} position={p} draggable={true} 
                            eventHandlers={{ dragend: (e) => {
                                const newPts = [...polygonPoints];
                                newPts[idx] = [e.target.getLatLng().lat, e.target.getLatLng().lng];
                                setPolygonPoints(newPts);
                            }, click: () => setPolygonPoints(prev => prev.filter((_, i) => i !== idx)) }}
                            icon={L.divIcon({ className: 'bg-blue-500 w-3 h-3 rounded-full border border-white' })} 
                        />
                    ))}
                    {drawType === 'CIRCLE' && circleCenter && (
                        <>
                            <Circle center={circleCenter} radius={radius} pathOptions={{ color: '#ef4444', fillOpacity: 0.2 }} />
                            <Marker position={circleCenter} draggable={true} eventHandlers={{ dragend: (e) => setCircleCenter([e.target.getLatLng().lat, e.target.getLatLng().lng]) }} />
                        </>
                    )}
                    <MapResizer />
                    <ChangeView center={position} />
                    <MapClickHandler mode={mode} drawType={drawType} setPoints={setPolygonPoints} setCircleCenter={setCircleCenter} />
                </MapContainer>
            </div>
        </div>
    );
}