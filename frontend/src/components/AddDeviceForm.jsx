import { useMemo, useState } from 'react';
import api from '../services/api';

function defaultTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export default function AddDeviceForm({ onDeviceAdded }) {
  const [childName, setChildName] = useState('');
  const [timezone, setTimezone] = useState(() => defaultTimezone());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastCreated, setLastCreated] = useState(null);

  const hint = useMemo(
    () =>
      'After saving, copy the Device ID into Traccar Client (or your tracking app) so pings match this child.',
    []
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLastCreated(null);

    try {
      const { data } = await api.post('/device/add', { childName: childName.trim(), timezone: timezone.trim() });
      const row = data?.data;
      setLastCreated(row);
      setChildName('');
      if (typeof onDeviceAdded === 'function') {
        onDeviceAdded(row);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Could not add device.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="card dashboard-card">
      <div className="mini-card-label">Add child device</div>
      <p className="card-note" style={{ marginTop: 0 }}>
        {hint}
      </p>

      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="clms-child-name">Child name</label>
          <input
            id="clms-child-name"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            maxLength={20}
            required
            disabled={loading}
            placeholder="e.g. Tom"
          />
        </div>

        <div className="field">
          <label htmlFor="clms-timezone">Timezone (IANA)</label>
          <input
            id="clms-timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            required
            disabled={loading}
            placeholder="Asia/Ho_Chi_Minh"
          />
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        {lastCreated ? (
          <div className="ok-text" style={{ fontSize: '0.9rem' }}>
            <strong>Device added.</strong> Use this ID in the tracker app:
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.6rem 0.75rem',
                borderRadius: '0.5rem',
                background: 'var(--brand-50)',
                wordBreak: 'break-all',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              {lastCreated.device_id}
            </div>
          </div>
        ) : null}

        <button className="btn btn-brand btn-block" type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Register device'}
        </button>
      </form>
    </article>
  );
}
