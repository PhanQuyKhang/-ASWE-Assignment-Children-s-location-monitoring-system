import { useState } from 'react';
import { toast } from 'sonner';
import useAuth from '../hooks/useAuth';
import useDevices from '../hooks/useDevice';
import { addDevice } from '../services/deviceService';

function defaultTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
  } catch {
    return 'Asia/Ho_Chi_Minh';
  }
}

export default function DevicesPage() {
  const { user } = useAuth();
  const { devices, loading } = useDevices(user?.user_id);
  const [childName, setChildName] = useState('');
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [submitting, setSubmitting] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!childName.trim()) {
      toast.error('Child name is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await addDevice({ childName: childName.trim(), timezone: timezone.trim() });
      if (res.success && res.data?.device_id) {
        setNewDeviceId(res.data.device_id);
        setChildName('');
        toast.success('Device registered', {
          description: 'Copy the ID below into the Traccar app on your child’s phone.',
        });
        window.dispatchEvent(new Event('clms-devices-changed'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Could not add device');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyId(id) {
    try {
      await navigator.clipboard.writeText(id);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy');
    }
  }

  return (
    <div className="dashboard-grid-layout" style={{ gridTemplateColumns: '1fr' }}>
      <article className="card dashboard-card">
        <div className="mini-card-label">Add child device</div>
        <p className="text-sm text-gray-600 mb-4">
          We generate a unique device ID. Paste it into the Traccar Client app on your child’s phone as
          the device identifier, then GPS updates will appear on your map.
        </p>
        <form className="form-grid" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
          <div className="field">
            <label>Child&apos;s name</label>
            <input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="e.g. Alex"
              required
            />
          </div>
          <div className="field">
            <label>Timezone</label>
            <input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="Asia/Ho_Chi_Minh"
            />
          </div>
          <button className="btn btn-brand" type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Generate device & save'}
          </button>
        </form>

        {newDeviceId ? (
          <div
            className="mt-4 p-4 rounded-xl border border-green-200 bg-green-50"
            style={{ maxWidth: 560 }}
          >
            <p className="text-sm font-bold text-green-900 mb-2">New device ID (for Traccar)</p>
            <code
              className="block text-xs break-all p-2 bg-white rounded border mb-2"
              style={{ wordBreak: 'break-all' }}
            >
              {newDeviceId}
            </code>
            <button type="button" className="btn btn-ghost text-sm" onClick={() => copyId(newDeviceId)}>
              Copy ID
            </button>
          </div>
        ) : null}
      </article>

      <article className="card dashboard-card">
        <div className="mini-card-label">Your devices</div>
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : devices.length === 0 ? (
          <p className="text-gray-600">No devices yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {devices.map((d) => (
              <li
                key={d.device_id}
                className="p-3 rounded-lg border border-gray-100 flex flex-wrap justify-between gap-2"
              >
                <div>
                  <strong>{d.child_name}</strong>
                  <div className="text-xs text-gray-500 font-mono mt-1">{d.device_id}</div>
                  <div className="text-xs text-gray-500 mt-1">Status: {d.status}</div>
                </div>
                <button type="button" className="btn btn-ghost text-xs" onClick={() => copyId(d.device_id)}>
                  Copy ID
                </button>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}
