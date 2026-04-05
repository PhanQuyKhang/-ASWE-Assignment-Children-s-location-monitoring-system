import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import GoogleSignInButton from '../components/GoogleSignInButton';
import useAuth from '../hooks/useAuth';

function getErrorMessage(error) {
  return error?.response?.data?.error || 'Login failed. Please try again.';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="screen auth-shell">
      <section className="auth-hero">
        <div className="brand-chip">
          <span className="brand-dot" />
          CLMS
        </div>
        <h1>Welcome back.</h1>
        <p>
          Sign in to manage your child&apos;s safety, live location, and safe boundaries.
        </p>
        <div className="auth-points">
          <span>Secure account access</span>
          <span>Quick password recovery</span>
          <span>Google account sign-in</span>
        </div>
      </section>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Log in</h2>
        <p className="auth-sub">Use your email and password, or continue with Google.</p>

        <div className="form-grid">
          <div className="field">
            <label>Email address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="btn btn-brand btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Log in'}
          </button>

          <div className="divider-text">or</div>
          <GoogleSignInButton />
        </div>

        <p className="switch-text">
          Forgot your password? <Link to="/forgot-password">Reset it here</Link>
        </p>
        <p className="switch-text">
          No account yet? <Link to="/signup">Create account</Link>
        </p>
      </form>
    </main>
  );
}
