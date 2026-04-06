import { useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import Map from '../components/Map';

const TAB_KEYS = ['profile', 'map', 'boundary'];

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
          ) : (
            <article className="card dashboard-card">
              <div className="mini-card-label">{tabMeta[activeTab].title}</div>
              <Map 
                  mode={activeTab === 'boundary' ? 'edit' : 'view'} 
                  deviceId={user?.device_id} 
                  // Handle the save logic passed from the Map component
                  onSave={async (points) => {
                      const zoneName = prompt("Enter safe zone name (e.g., School):");
                      if (!zoneName) return;

                      try {
                          // Using the specific Device ID for testing (Tommy's device)
                          const deviceId = "a6289523-a7a4-4c42-889d-4a98ce850e22"; 

                          const response = await axios.post('http://localhost:3000/api/zones/polygon', {
                              deviceId: deviceId,
                              zoneName: zoneName,
                              points: points // Array of [{lat, lng}, ...] from LeafletMap
                          });

                          if (response.data) {
                              alert("Safe zone has been saved successfully!");
                          }
                      } catch (error) {
                          console.error("API Error:", error);
                          alert("Unable to save the safe zone. Please try again.");
                      }
                  }}
              />
            </article>
          )}
        </section>
      </section>
    </main>
  );
}
