import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import GoogleSignInButton from '../components/GoogleSignInButton';
import useAuth from '../hooks/useAuth';

function getErrorMessage(error) {
  return error?.response?.data?.error || 'Signup failed. Please try again.';
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, isAuthenticated, loading } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
    fname: '',
    lname: '',
    phone: '',
  });
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
      await signup(form);
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
        <h1>Create your family safety workspace.</h1>
        <p>
          Set up your parent account in under one minute and unlock live location monitoring,
          safe zones, and emergency alerts.
        </p>
        <div className="auth-points">
          <span>Single account per parent</span>
          <span>Secure password and private data</span>
          <span>Built for fast mobile usage</span>
        </div>
      </section>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Create Parent Account</h2>
        <p className="auth-sub">Fill in your details or continue with Google.</p>

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
            <label>Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>

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
            <label>Password (min 8 characters)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              minLength={8}
              required
            />
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="btn btn-brand btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Sign up'}
          </button>

          <div className="divider-text">or</div>
          <GoogleSignInButton />
        </div>

        <p className="switch-text">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}
