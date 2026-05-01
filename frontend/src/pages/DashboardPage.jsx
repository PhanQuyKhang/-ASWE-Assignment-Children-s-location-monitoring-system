import { useCallback, useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import Map from '../components/Map';
import AddDeviceForm from '../components/AddDeviceForm';
import DeviceList from '../components/DeviceList';

const TAB_KEYS = ['profile', 'devices', 'map', 'boundary'];
const SELECTED_DEVICE_KEY = 'clms_selected_device_id';

function getInitials(user) {
  const first = user?.fname?.trim()?.[0] || 'P';
  const last = user?.lname?.trim()?.[0] || 'A';
  return `${first}${last}`.toUpperCase();
}

export default function DashboardPage() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ fname: '', lname: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState('');
  const [selectedDeviceId, setSelectedDeviceIdState] = useState(
    () => localStorage.getItem(SELECTED_DEVICE_KEY) || ''
  );

  function setSelectedDeviceId(id) {
    setSelectedDeviceIdState(id);
    if (id) localStorage.setItem(SELECTED_DEVICE_KEY, id);
    else localStorage.removeItem(SELECTED_DEVICE_KEY);
  }

  const refreshDevices = useCallback(async () => {
    setDevicesLoading(true);
    setDevicesError('');
    try {
      const { data } = await api.get('/device');
      setDevices(data?.data || []);
    } catch (err) {
      setDevicesError(
        err?.response?.data?.message || err?.response?.data?.error || 'Could not load devices.'
      );
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  useEffect(() => {
    if (!devices.length) {
      if (selectedDeviceId) setSelectedDeviceId('');
      return;
    }
    const exists = devices.some((d) => d.device_id === selectedDeviceId);
    if (!selectedDeviceId || !exists) {
      setSelectedDeviceId(devices[0].device_id);
    }
  }, [devices, selectedDeviceId]);

  const selectedDevice = useMemo(
    () => devices.find((d) => d.device_id === selectedDeviceId) || null,
    [devices, selectedDeviceId]
  );

  useEffect(() => {
    setProfileForm({
      fname: user?.fname || '',
      lname: user?.lname || '',
      phone: user?.phone || '',
    });
  }, [user]);

  const tabMeta = useMemo(
    () => ({
      profile: {
        title: 'Profile',
        subtitle: 'Manage your account and password reset.',
      },
      devices: {
        title: 'Devices',
        subtitle: 'Register a child device and pick which one to track.',
      },
      map: {
        title: 'Map',
        subtitle: 'View your child live on the map.',
      },
      boundary: {
        title: 'Boundary',
        subtitle: 'Set the safe zone for your child.',
      },
    }),
    []
  );

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    setError('');

    try {
      await updateProfile(profileForm);
      setNotice('Account information updated successfully.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to update account.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    setChangingPassword(true);
    setNotice('');
    setError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirm password do not match.');
      setChangingPassword(false);
      return;
    }

    try {
      await changePassword({
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setNotice('Password changed successfully.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to change password.');
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-shell">
        <header className="dashboard-header">
          <div className="dashboard-brand-row">
            <div className="brand-chip brand-chip-hero">
              <span className="brand-dot" />
              CLMS
            </div>
            <button className="btn btn-ghost dashboard-signout" onClick={logout} type="button">
              Sign out
            </button>
          </div>

          <div className="dashboard-hero">
            <div>
              <p className="dashboard-greeting">Hello, {user?.fname}</p>
              <h1>Family safety, organized by tab.</h1>
              <p>
                Register devices, watch the live map, and configure safe boundaries from one place.
              </p>
            </div>
            <div className="dashboard-hero-card">
              <div className="avatar large">{getInitials(user)}</div>
              <div>
                <strong>
                  {user?.fname} {user?.lname}
                </strong>
                <p>{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        <nav className="dashboard-tabs" aria-label="Dashboard tabs">
          {TAB_KEYS.map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              className={`dashboard-tab ${activeTab === tabKey ? 'active' : ''}`}
              onClick={() => setActiveTab(tabKey)}
            >
              {tabMeta[tabKey].title}
            </button>
          ))}
        </nav>

        <section className="dashboard-body">
          {activeTab === 'devices' ? (
            <div className="dashboard-devices-grid">
              <DeviceList
                devices={devices}
                selectedId={selectedDeviceId}
                onSelect={setSelectedDeviceId}
                loading={devicesLoading}
                error={devicesError}
                onRefresh={refreshDevices}
              />
              <AddDeviceForm
                onDeviceAdded={async (row) => {
                  await refreshDevices();
                  if (row?.device_id) {
                    setSelectedDeviceId(row.device_id);
                  }
                }}
              />
            </div>
          ) : null}

          {activeTab === 'profile' ? (
            <div className="dashboard-grid-layout">
              <article className="card dashboard-card profile-summary-card">
                <div className="mini-card-label">Profile</div>
                <div className="account-summary account-summary-wide">
                  <div className="avatar large">{getInitials(user)}</div>
                  <div>
                    <h2>
                      {user?.fname} {user?.lname}
                    </h2>
                    <p>{user?.email}</p>
                    <p>{user?.phone ? `Phone: ${user.phone}` : 'Phone number not set'}</p>
                  </div>
                </div>
              </article>

              <article className="card dashboard-card">
                <div className="mini-card-label">Edit profile</div>
                <form className="form-grid account-form" onSubmit={handleProfileSubmit}>
                  <div className="inline-two">
                    <div className="field">
                      <label>First name</label>
                      <input
                        value={profileForm.fname}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, fname: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="field">
                      <label>Last name</label>
                      <input
                        value={profileForm.lname}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, lname: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Phone number</label>
                    <input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  {error ? <p className="error-text">{error}</p> : null}
                  {notice ? <p className="ok-text">{notice}</p> : null}

                  <button className="btn btn-brand btn-block" type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </form>
              </article>

              <article className="card dashboard-card">
                <div className="mini-card-label">Change password</div>
                <form className="form-grid" onSubmit={handleChangePassword}>
                  <div className="field">
                    <label>New password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      minLength={8}
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Confirm new password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      minLength={8}
                      required
                    />
                  </div>

                  <p className="card-note">Your password is updated immediately in this session.</p>

                  <button className="btn btn-brand btn-block" type="submit" disabled={changingPassword}>
                    {changingPassword ? 'Updating...' : 'Change password'}
                  </button>
                </form>
              </article>
            </div>
          ) : null}

          {activeTab === 'map' || activeTab === 'boundary' ? (
            <article className="card dashboard-card">
              <div className="mini-card-label">{tabMeta[activeTab].title}</div>
              <p className="card-note" style={{ marginTop: '0.35rem' }}>
                {tabMeta[activeTab].subtitle}
                {activeTab === 'boundary'
                  ? ' Polygon and circle editing will be available in the next iteration.'
                  : null}
              </p>
              <Map deviceId={selectedDeviceId} device={selectedDevice} />
            </article>
          ) : null}
        </section>
      </section>
    </main>
  );
}
