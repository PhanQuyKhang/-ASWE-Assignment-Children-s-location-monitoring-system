import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <main className="screen">
      <header className="topbar">
        <div>
          <div className="brand-chip">
            <span className="brand-dot" />
            LIVE MONITORING HUB
          </div>
          <h1>Hello, {user?.fname}</h1>
          <p>Your family safety controls are active and ready.</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={logout}
          type="button"
        >
          Log out
        </button>
      </header>

      <section className="dashboard-grid">
        <article className="card">
          <h2>Today overview</h2>
          <p>
            This is your command center. Next sprint will connect map stream, geofence events, and
            battery health data into this panel.
          </p>
          <div className="metric-row">
            <div className="metric">
              <h3>Child status</h3>
              <p>Online</p>
            </div>
            <div className="metric">
              <h3>Last sync</h3>
              <p>Just now</p>
            </div>
            <div className="metric">
              <h3>Alerts today</h3>
              <p>0 alert</p>
            </div>
            <div className="metric">
              <h3>Safe zone</h3>
              <p>Configured</p>
            </div>
          </div>
        </article>

        <aside className="card">
          <h2>Quick actions</h2>
          <p>Manage account details and prepare monitoring modules.</p>
          <div className="action-row">
            <Link className="action-link primary" to="/profile">
              Edit profile
            </Link>
            <span className="action-link secondary">Map view coming next</span>
          </div>
        </aside>
      </section>
    </main>
  );
}
