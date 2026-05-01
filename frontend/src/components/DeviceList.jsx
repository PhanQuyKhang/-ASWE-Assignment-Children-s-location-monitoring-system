const STATUS_LABEL = {
  ACTIVE: 'Online',
  NOSIGNAL: 'No signal',
  INACTIVE: 'Inactive',
};

function statusDotClass(status) {
  if (status === 'ACTIVE') return 'device-dot device-dot--online';
  if (status === 'NOSIGNAL') return 'device-dot device-dot--offline';
  return 'device-dot device-dot--inactive';
}

export default function DeviceList({ devices, selectedId, onSelect, loading, error, onRefresh }) {
  return (
    <article className="card dashboard-card">
      <div className="dashboard-brand-row" style={{ marginBottom: '0.75rem' }}>
        <div className="mini-card-label" style={{ margin: 0 }}>
          Your devices
        </div>
        {typeof onRefresh === 'function' ? (
          <button type="button" className="btn btn-ghost" onClick={onRefresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        ) : null}
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {loading && devices.length === 0 ? <p className="card-note">Loading devices…</p> : null}

      {!loading && !error && devices.length === 0 ? (
        <p className="card-note">No devices yet. Add one using the form on the right.</p>
      ) : null}

      <ul className="device-list">
        {devices.map((d) => {
          const id = d.device_id;
          const active = id === selectedId;
          return (
            <li key={id}>
              <button
                type="button"
                className={`device-list-item ${active ? 'device-list-item--active' : ''}`}
                onClick={() => onSelect(id)}
              >
                <span className={statusDotClass(d.status)} aria-hidden />
                <span className="device-list-item-body">
                  <span className="device-list-item-name">{d.child_name}</span>
                  <span className="device-list-item-meta">
                    {STATUS_LABEL[d.status] || d.status}
                    {d.last_updated ? ` · ${d.last_updated}` : ''}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
