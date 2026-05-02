import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polygon, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getBoundaries, deleteBoundary } from '../services/boundaryService';
import { getLatestAlert } from '../services/alertService';
import { useSocket } from '../hooks/useSocket';

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

function RecenterButton({ position }) {
    const map = useMap();
    
    const handleRecenter = () => {
        if (position) {
            map.flyTo(position, map.getZoom(), {
                animate: true,
                duration: 1
            });
        }
    };

    return (
        <div className="leaflet-bottom leaflet-right" style={{ marginBottom: '30px', marginRight: '10px' }}>
            <div className="leaflet-control" style={{ border: 'none', background: 'none' }}>
                <button
                    onClick={handleRecenter}
                    title="Recenter to child"
                    className="bg-white hover:bg-gray-50 text-blue-600 p-0 rounded-full shadow-xl border border-gray-200 flex items-center justify-center transition-all active:scale-90"
                    style={{ 
                        width: '45px', 
                        height: '45px', 
                        cursor: 'pointer'
                    }}
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="w-6 h-6"
                    >
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M3 12h3m12 0h3M12 3v3m0 12v3"></path>
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default function Map({ deviceId, childName, mode, onSave, initialPosition, deviceStatus }) {
    const { socket, connected } = useSocket();
    const [position, setPosition] = useState(initialPosition || [10.7626, 106.6602]);
    
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
    const [existingZones, setExistingZones] = useState([]);
    const [childStatus, setChildStatus] = useState('SAFE');
    const activeOutToastIdRef = React.useRef(null);

    const daysOfWeek = [{ label: 'S', value: 0 }, { label: 'M', value: 1 }, { label: 'T', value: 2 }, { label: 'W', value: 3 }, { label: 'T', value: 4 }, { label: 'F', value: 5 }, { label: 'S', value: 6 }];

    const toggleDay = (v) => {
        setSelectedDays((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
    };
    const toggleMonthDay = (v) => {
        setSelectedMonthDays((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
    };

    const deviceOffline = deviceStatus === 'NOSIGNAL' || deviceStatus === 'INACTIVE';
    const showLive = connected && !deviceOffline;

    const connectionLabel = () => {
        if (!connected) return 'SOCKET OFFLINE';
        if (deviceOffline) return 'DEVICE OFFLINE';
        return 'LIVE';
    };

    const getScheduleInfo = (zone) => {
        if (zone.schedule_type === 'ALWAYS') return "Always active";
        const timePart = zone.start_time ? ` at ${zone.start_time.slice(0, 5)}` : "";
        const durPart = zone.duration ? ` for ${zone.duration} mins` : "";
        const combinedTime = timePart + durPart;

        switch (zone.schedule_type) {
            case 'DAILY': return `Daily${combinedTime}`;
            case 'WEEKLY': return `Weekly on ${zone.days_of_week?.join(', ')}${combinedTime}`;
            case 'MONTHLY': return `Monthly on days ${zone.days_of_month?.join(', ')}${combinedTime}`;
            case 'ONCE': {
                const date = zone.specific_date ? new Date(zone.specific_date).toLocaleDateString() : '';
                return `Once on ${date}${combinedTime}`;
            }
            default: return zone.schedule_type;
        }
    };

    const effectiveMarkerStatus =
        deviceOffline ? 'OFFLINE' : childStatus;

    const getStatusColor = () => {
        if (effectiveMarkerStatus === 'DANGER') return '#ef4444';
        if (effectiveMarkerStatus === 'OFFLINE') return '#9ca3af';
        return '#3b82f6';
    };

    useEffect(() => {
        if (initialPosition) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sync marker when parent passes last known location
            setPosition(initialPosition);
        }
    }, [initialPosition]);

    useEffect(() => {
        if (!deviceId) return;

        const fetchExisting = async () => {
            try {
                const res = await getBoundaries(deviceId);
                if (res.success) setExistingZones(res.data);
            } catch (err) {
                console.log("Error fetching zones: ", err);
            }
        };
        fetchExisting();

        const fetchStatus = async () => {
            try {
                const res = await getLatestAlert(deviceId);
                if (res.success && res.data) {
                    if (res.data.alert_type === 'EXIT') setChildStatus('DANGER');
                    else if (res.data.alert_type === 'ENTER') setChildStatus('SAFE');
                    else if (res.data.alert_type === 'OUT_OF_SIGNAL') setChildStatus('OFFLINE');
                }
            } catch {
                console.log('No status history found.');
            }
        };
        fetchStatus();
    }, [deviceId, childName]);

    useEffect(() => {
        if (!deviceId || !socket) return undefined;

        const onLocation = (data) => {
            if (data.device_id === deviceId && data.latitude && data.longitude) {
                setPosition([data.latitude, data.longitude]);
            }
        };

        const onEnter = (data) => {
            if (data.device_id === deviceId) {
                setChildStatus('SAFE');
                if (activeOutToastIdRef.current) {
                    toast.dismiss(activeOutToastIdRef.current);
                    activeOutToastIdRef.current = null;
                }
                toast.success(`${childName} is safe`, {
                    description: `${childName} entered ${data.zone_name || 'safe zone'}`,
                });
            }
        };

        const onOut = (data) => {
            if (data.device_id === deviceId) {
                setChildStatus('DANGER');
                const id = toast.error('Alert: left safe zone', {
                    description: `${childName} left ${data.zone_name || 'safe zone'}!`,
                    duration: Infinity,
                });
                activeOutToastIdRef.current = id;
            }
        };

        const onSignal = (data) => {
            if (data.device_id === deviceId) {
                setChildStatus('OFFLINE');
                toast.warning('Signal lost', {
                    description: `Lost connection to ${childName}'s device.`,
                });
            }
        };

        socket.on('location_update', onLocation);
        socket.on('alert_device_enter_of_zone', onEnter);
        socket.on('alert_device_out_of_zone', onOut);
        socket.on('alert_device_out_of_signal', onSignal);

        return () => {
            socket.off('location_update', onLocation);
            socket.off('alert_device_enter_of_zone', onEnter);
            socket.off('alert_device_out_of_zone', onOut);
            socket.off('alert_device_out_of_signal', onSignal);
        };
    }, [deviceId, childName, socket]);

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

    const handleDeleteZone = async (zoneId) => {
        if (!window.confirm('Delete this safe zone?')) return;
        try {
            await deleteBoundary(zoneId);
            const res = await getBoundaries(deviceId);
            if (res.success) setExistingZones(res.data);
            toast.success('Zone removed');
        } catch (e) {
            toast.error(e.response?.data?.error || e.message);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 h-full">
            {mode === 'edit' && (
                <div className="w-full lg:w-80 bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-4 overflow-y-auto max-h-125">
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

                    {existingZones.length > 0 ? (
                        <div className="mt-4 border-t border-gray-200 pt-3">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Existing zones</h4>
                            <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                                {existingZones.map((z) => (
                                    <li key={z.zone_id} className="flex justify-between items-center text-xs gap-2 bg-white p-2 rounded border">
                                        <span className="truncate font-medium">{z.zone_name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteZone(z.zone_id)}
                                            className="text-red-600 font-bold shrink-0"
                                        >
                                            Delete
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </div>
            )}

            <div className="flex-1 relative min-h-100 lg:h-125 rounded-xl overflow-hidden border shadow-lg">
                <div className="absolute top-2 right-2 z-1000 bg-white/90 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${showLive ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                    {connectionLabel()}
                </div>

                <MapContainer center={position} zoom={16} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <RecenterButton position={position} />
                    {existingZones.map((zone) => (
                        <React.Fragment key={zone.zone_id}>
                            {zone.type === 'CIRCLE' && zone.center_lat && (
                                <Circle 
                                    center={[parseFloat(zone.center_lat), parseFloat(zone.center_lon)]} 
                                    radius={zone.radius}
                                    pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2 }}
                                >
                                    <Popup>
                                        <div className="text-xs">
                                            <div className="font-bold text-green-700">{zone.zone_name}</div>
                                            <div><b>Type:</b> Circle</div>
                                            <div><b>Radius:</b> {zone.radius}m</div>
                                            <div><b>Validity:</b> {getScheduleInfo(zone)}</div>
                                        </div>
                                    </Popup>
                                </Circle>
                            )}
                            {zone.type === 'POLYGON' && zone.points && (
                                <Polygon 
                                    positions={zone.points.sort((a,b) => a.sequence_order - b.sequence_order).map(p => [parseFloat(p.latitude), parseFloat(p.longitude)])}
                                    pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2 }}
                                >
                                    <Popup>
                                        <div className="text-xs">
                                            <div className="font-bold text-green-700">{zone.zone_name}</div>
                                            <div><b>Type:</b> Polygon</div>
                                            <div><b>Validity:</b> {getScheduleInfo(zone)}</div>
                                        </div>
                                    </Popup>
                                </Polygon>
                            )}
                        </React.Fragment>
                    ))}

                    <Marker 
                        key={`${deviceId}-${effectiveMarkerStatus}`} 
                        position={position}
                        icon={L.divIcon({
                            className: 'custom-marker',
                            html: `<div style="background-color: ${getStatusColor()}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
                            iconSize: [14, 14],
                            iconAnchor: [7, 7]
                        })}
                    >
                        <Popup>
                            <div className="text-sm">
                                <b>Child:</b> {childName || "Unknown"} <br/>
                                <span className="text-[10px] text-gray-400">ID: {deviceId}</span> <br/>
                                <span className={`text-[10px] font-bold ${effectiveMarkerStatus === 'DANGER' ? 'text-red-500' : 'text-blue-500'}`}>Status: {effectiveMarkerStatus}</span>
                            </div>
                        </Popup>
                    </Marker>
                    
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