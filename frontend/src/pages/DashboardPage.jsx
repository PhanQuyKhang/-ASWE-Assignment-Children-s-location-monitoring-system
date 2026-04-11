import { useEffect, useMemo, useState } from 'react';

// Hooks
import useAuth from '../hooks/useAuth';
import useDevices from '../hooks/useDevice';
// Services
import { createBoundary } from '../services/boundaryService';

// Components
import Map from '../components/Map';
import axios from 'axios';

const TAB_KEYS = ['profile', 'map', 'boundary'];

function getInitials(user) {
  const first = user?.fname?.trim()?.[0] || 'P';
  const last = user?.lname?.trim()?.[0] || 'A';
  return `${first}${last}`.toUpperCase();
}

export default function DashboardPage() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const { devices, selectedDevice, setSelectedDevice, loading } = useDevices(user?.user_id);
  const [activeTab, setActiveTab] = useState('profile');
  const [configTarget, setConfigTarget] = useState(null);
  const [profileForm, setProfileForm] = useState({ fname: '', lname: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    setProfileForm({
      fname: user?.fname || '',
      lname: user?.lname || '',
      phone: user?.phone || '',
    });
  }, [user]);

  // Reset thiết bị đang chọn khi người dùng chuyển tab
  useEffect(() => {
    setConfigTarget(null);
  }, [activeTab]);

  const tabMeta = useMemo(
    () => ({
      profile: {
        title: 'Profile',
        subtitle: 'Manage your account and password reset.',
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

  const handleSaveBoundary = async (finalBoundaryData) => {
    try {
      // configTarget được set khi user chọn device ở Step 1
      const deviceId = configTarget?.device_id;
      
      // finalBoundaryData đã chứa mọi thứ từ Sidebar của Map.jsx
      const result = await createBoundary(deviceId, finalBoundaryData);
      
      if (result) {
        alert(`Success: Boundary "${finalBoundaryData.zone_name}" set for ${configTarget.child_name}`);
        setConfigTarget(null); // Reset về danh sách chọn device
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      alert("Failed to save boundary: " + errorMsg);
    }
  };

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
                Use the tabs above to manage your profile, inspect the live map, and configure the
                safe boundary.
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
          ) : activeTab === 'map' ? (
            <article className="card dashboard-card">
              <div className="mini-card-label">{tabMeta[activeTab].title}</div>
              {/* Tab Map hiển thị vị trí thực tế của thiết bị đầu tiên hoặc thiết bị đã chọn */}
              <Map 
                  mode="view" 
                  deviceId={selectedDevice.device_id} 
              />
            </article>
          ) : (
            <article className="card dashboard-card">
              {!configTarget ? (
                /* STEP 1: CHỌN THIẾT BỊ */
                <div className="p-4">
                  <div className="mini-card-label">Select Child</div>
                  <h2 className="text-xl font-bold mb-4 text-gray-800">Who do you want to set a boundary for?</h2>
                  {loading ? (
                    <p className="text-gray-500 italic">Loading children list...</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                      {devices.map((device) => (
                        <button
                          key={device.device_id}
                          onClick={() => setConfigTarget(device)}
                          className="flex items-center gap-4 p-4 border-2 border-gray-100 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left group"
                        >
                          <div className="avatar bg-green-100 text-green-700 font-bold group-hover:bg-green-600 group-hover:text-white transition-colors">
                            {device.child_name}
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
                /* STEP 2: VẼ BOUNDARY */
                <div>
                  <div className="flex justify-between items-center mb-4 px-2 py-2 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-semibold text-green-800">Configuring for: {configTarget.child_name}</span>
                    </div>
                    <button 
                      onClick={() => setConfigTarget(null)}
                      className="text-xs font-bold text-gray-500 hover:text-red-500 uppercase tracking-tight"
                    >
                      Change Child
                    </button>
                  </div>
                  <Map 
                      mode="edit" 
                      deviceId={configTarget.device_id} 
                      onSave={handleSaveBoundary}
                  />
                </div>
              )}
            </article>
          )}
        </section>
      </section>
    </main>
  );
}