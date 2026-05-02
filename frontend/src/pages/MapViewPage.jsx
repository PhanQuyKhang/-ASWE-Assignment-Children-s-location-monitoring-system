import { useState } from 'react';
import useAuth from '../hooks/useAuth';
import useDevices from '../hooks/useDevice';
import Map from '../components/Map';

export default function MapViewPage() {
  const { user } = useAuth();
  const { devices, loading } = useDevices(user?.user_id);
  const [viewTarget, setViewTarget] = useState(null);

  return (
    <article className="card dashboard-card">
      {!viewTarget ? (
        <div className="p-4">
          <div className="mini-card-label">Select child</div>
          <h2 className="text-xl font-bold mb-4 text-gray-800">Who do you want to track?</h2>
          {loading ? (
            <p className="text-gray-500 italic">Loading children list...</p>
          ) : devices.length === 0 ? (
            <p className="text-gray-600">No devices yet. Add one under Devices.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {devices.map((device) => (
                <button
                  key={device.device_id}
                  type="button"
                  onClick={() => setViewTarget(device)}
                  className="flex items-center gap-4 p-4 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="avatar bg-blue-100 text-blue-700 font-bold">
                    {device.child_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{device.child_name}</div>
                    <div className="text-xs text-gray-400">View live location</div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Device: {device.status === 'ACTIVE' ? 'online' : device.status === 'NOSIGNAL' ? 'no signal' : device.status?.toLowerCase()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4 px-2 py-2 bg-blue-50 rounded-lg border border-blue-100">
            <span className="text-sm font-semibold text-blue-800 ml-2">
              Tracking: {viewTarget.child_name}
            </span>
            <button
              type="button"
              onClick={() => setViewTarget(null)}
              className="text-xs font-bold text-gray-500 hover:text-red-500 uppercase tracking-tight"
            >
              Change child
            </button>
          </div>
          <Map
            mode="view"
            deviceId={viewTarget.device_id}
            childName={viewTarget.child_name}
            deviceStatus={viewTarget.status}
            initialPosition={
              viewTarget.last_lat && viewTarget.last_lon
                ? [parseFloat(viewTarget.last_lat), parseFloat(viewTarget.last_lon)]
                : null
            }
          />
        </div>
      )}
    </article>
  );
}
