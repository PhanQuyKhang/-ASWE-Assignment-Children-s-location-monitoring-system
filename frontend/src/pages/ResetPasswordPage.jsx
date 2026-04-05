import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function getErrorMessage(error) {
  return error?.response?.data?.error || 'Unable to reset password.';
}

export default function ResetPasswordPage() {
  const { confirmPasswordReset } = useAuth();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Missing reset token. Please open the link from your email again.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(token, password);
      setMessage('Password updated successfully. You can now log in with the new password.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="screen auth-shell">
      <section className="auth-hero">
        <div className="brand-chip">
          <span className="brand-dot" />
          SET NEW PASSWORD
        </div>
        <h1>Create a secure new password.</h1>
        <p>
          Your reset link is protected by a one-time token. Choose a password that is easy for you
          to remember and hard for others to guess.
        </p>
      </section>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Reset password</h2>
        <p className="auth-sub">This link will only work once and will expire after a short time.</p>

        <div className="form-grid">
          <div className="field">
            <label>New password</label>
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Confirm new password</label>
            <input
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="ok-text">{message}</p> : null}

          <button className="btn btn-brand btn-block" type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </div>

        <p className="switch-text">
          Back to <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}
