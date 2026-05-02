import { NavLink } from 'react-router-dom';

export default function Sidebar({ needsAttention }) {
  return (
    <aside className="clms-sidebar">
      <div className="clms-sidebar-brand">CLMS</div>
      <nav className="clms-sidebar-nav" aria-label="Main navigation">
        <NavLink
          className={({ isActive }) => `clms-sidebar-link${isActive ? ' active' : ''}`}
          to="/dashboard/profile"
        >
          Profile
        </NavLink>
        <NavLink
          className={({ isActive }) => `clms-sidebar-link${isActive ? ' active' : ''}`}
          to="/dashboard/map"
        >
          Live map
        </NavLink>
        <NavLink
          className={({ isActive }) => `clms-sidebar-link${isActive ? ' active' : ''}`}
          to="/dashboard/boundary"
        >
          Safe zones
        </NavLink>
        <NavLink
          className={({ isActive }) => `clms-sidebar-link${isActive ? ' active' : ''}`}
          to="/dashboard/devices"
        >
          Devices
        </NavLink>
        <NavLink
          className={({ isActive }) => `clms-sidebar-link${isActive ? ' active' : ''}`}
          to="/dashboard/alerts"
        >
          <span style={{ flex: 1 }}>Alert history</span>
          {needsAttention ? <span className="clms-sidebar-badge" aria-label="New alerts" /> : null}
        </NavLink>
      </nav>
    </aside>
  );
}
