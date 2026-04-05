import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function getErrorMessage(error) {
  return error?.response?.data?.error || 'Unable to send reset link.';
}

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await requestPasswordReset(email);
      setMessage('If the email exists, a reset link has been sent.');
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
          PASSWORD RESET
        </div>
        <h1>Need a new password?</h1>
        <p>
          Enter your email address and we will send a secure reset link. The link will open a page
          where you can create a new password.
        </p>
      </section>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Send reset link</h2>
        <p className="auth-sub">We will email you a link if the account exists.</p>

        <div className="form-grid">
          <div className="field">
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="ok-text">{message}</p> : null}

          <button className="btn btn-brand btn-block" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </div>

        <p className="switch-text">
          Back to <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}
