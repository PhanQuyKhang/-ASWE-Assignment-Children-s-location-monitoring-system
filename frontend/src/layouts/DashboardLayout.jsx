import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from '../components/Sidebar';
import useAuth from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const {
    reconnecting,
    connected,
    stickyAlert,
    setStickyAlert,
    needsAttention,
    clearNeedsAttention,
  } = useSocket();

  return (
    <div className="dashboard-with-sidebar dashboard-page">
      <Toaster richColors position="top-right" closeButton />
      <header className="dashboard-header" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div
          className="dashboard-brand-row"
          style={{ width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}
        >
          <div className="brand-chip brand-chip-hero">
            <span className="brand-dot" />
            Parent dashboard
          </div>
          <span className="text-sm text-gray-600" style={{ flex: 1, minWidth: 0 }}>
            {user?.email}
          </span>
          <span className="text-xs text-gray-500">
            Live socket:{' '}
            <strong style={{ color: connected ? '#059669' : '#dc2626' }}>
              {connected ? 'connected' : 'disconnected'}
            </strong>
          </span>
          <button className="btn btn-ghost dashboard-signout" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </header>
      {reconnecting ? (
        <div className="clms-reconnect-banner" role="status">
          Reconnecting to live updates…
        </div>
      ) : null}
      {stickyAlert?.kind === 'danger' ? (
        <div className="clms-sticky-alert">
          <span>
            {stickyAlert.childName || 'Child'} left {stickyAlert.zoneName || 'safe zone'} — check
            the live map.
          </span>
          <button type="button" onClick={() => setStickyAlert(null)}>
            Dismiss
          </button>
        </div>
      ) : null}
      <div className="dashboard-with-sidebar-inner">
        <Sidebar needsAttention={needsAttention} />
        <div className="clms-dashboard-main">
          <div className="dashboard-body" style={{ flex: 1 }}>
            <Outlet context={{ clearNeedsAttention }} />
          </div>
        </div>
      </div>
    </div>
  );
}
