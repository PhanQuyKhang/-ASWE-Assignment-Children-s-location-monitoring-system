import { useState } from 'react';
import { toast } from 'sonner';
import useAuth from '../hooks/useAuth';
import useDevices from '../hooks/useDevice';
import Map from '../components/Map';
import { createBoundary } from '../services/boundaryService';

export default function BoundaryPage() {
  const { user } = useAuth();
  const { devices, loading } = useDevices(user?.user_id);
  const [configTarget, setConfigTarget] = useState(null);

  const handleSaveBoundary = async (finalBoundaryData) => {
    const toastId = toast.loading('Saving boundary...');
    try {
      const deviceId = configTarget.device_id;
      const result = await createBoundary(deviceId, finalBoundaryData);
      if (result) {
        toast.success('Success!', {
          id: toastId,
          description: `Boundary "${finalBoundaryData.zone_name}" set for ${configTarget.child_name}`,
          duration: 4000,
        });
        setConfigTarget(null);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      toast.error('Failed to save', {
        id: toastId,
        description: errorMsg,
      });
    }
  };

  return (
    <article className="card dashboard-card">
      {!configTarget ? (
        <div className="p-4">
          <div className="mini-card-label">Select child</div>
          <h2 className="text-xl font-bold mb-4 text-gray-800">Who do you want to set a boundary for?</h2>
          {loading ? (
            <p className="text-gray-500 italic">Loading children list...</p>
          ) : devices.length === 0 ? (
            <p className="text-gray-600">No devices yet. Register a device first.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {devices.map((device) => (
                <button
                  key={device.device_id}
                  type="button"
                  onClick={() => setConfigTarget(device)}
                  className="flex items-center gap-4 p-4 border-2 border-gray-100 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left group"
                >
                  <div className="avatar bg-green-100 text-green-700 font-bold group-hover:bg-green-600 group-hover:text-white transition-colors">
                    {device.child_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{device.child_name}</div>
                    <div className="text-xs text-gray-400 font-mono">ID: {device.device_id}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4 px-2 py-2 bg-green-50 rounded-lg border border-green-100">
            <span className="text-sm font-semibold text-green-800">
              Configuring for: {configTarget.child_name}
            </span>
            <button
              type="button"
              onClick={() => setConfigTarget(null)}
              className="text-xs font-bold text-gray-500 hover:text-red-500 uppercase tracking-tight"
            >
              Change child
            </button>
          </div>
          <Map
            mode="edit"
            deviceId={configTarget.device_id}
            onSave={handleSaveBoundary}
            childName={configTarget.child_name}
            deviceStatus={configTarget.status}
            initialPosition={
              configTarget.last_lat && configTarget.last_lon
                ? [parseFloat(configTarget.last_lat), parseFloat(configTarget.last_lon)]
                : null
            }
          />
        </div>
      )}
    </article>
  );
}
