import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function getErrorMessage(error) {
  return error?.response?.data?.error || 'Profile update failed.';
}

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const [form, setForm] = useState({
    fname: user?.fname || '',
    lname: user?.lname || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await updateProfile(form);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="screen">
      <header className="topbar">
        <div>
          <div className="brand-chip">
            <span className="brand-dot" />
            ACCOUNT MANAGEMENT
          </div>
          <h1>Manage Account</h1>
          <p>Keep your parent details up to date.</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={logout}
          type="button"
        >
          Sign out
        </button>
      </header>

      <form className="card profile-card" onSubmit={handleSubmit}>
        <p className="auth-sub">Signed in email: {user?.email}</p>

        <div className="form-grid">
          <div className="inline-two">
            <div className="field">
              <label>First name</label>
              <input
                value={form.fname}
                onChange={(e) => setForm((prev) => ({ ...prev, fname: e.target.value }))}
                required
              />
            </div>

            <div className="field">
              <label>Last name</label>
              <input
                value={form.lname}
                onChange={(e) => setForm((prev) => ({ ...prev, lname: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Phone number</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="ok-text">{message}</p> : null}

          <div className="action-row">
            <button className="btn btn-brand" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <Link className="action-link secondary" to="/dashboard">
              Back to dashboard
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}
