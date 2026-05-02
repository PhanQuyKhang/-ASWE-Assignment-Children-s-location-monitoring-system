import { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';

function getInitials(user) {
  const first = user?.fname?.trim()?.[0] || 'P';
  const last = user?.lname?.trim()?.[0] || 'A';
  return `${first}${last}`.toUpperCase();
}

export default function DashboardProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [profileForm, setProfileForm] = useState({ fname: '', lname: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
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
      await changePassword({ newPassword: passwordForm.newPassword });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setNotice('Password changed successfully.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to change password.');
    } finally {
      setChangingPassword(false);
    }
  }

  return (
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
  );
}
