import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="screen" style={{ padding: '2rem', maxWidth: 560, margin: '0 auto' }}>
          <h1 style={{ color: '#b91c1c', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#444', marginBottom: '1rem' }}>
            The app hit an unexpected error. You can reload the page or go back to the dashboard.
          </p>
          <pre
            style={{
              fontSize: 12,
              overflow: 'auto',
              padding: '1rem',
              background: '#f4f4f5',
              borderRadius: 8,
            }}
          >
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button
            type="button"
            className="btn btn-brand"
            style={{ marginTop: '1rem' }}
            onClick={() => window.location.assign('/dashboard')}
          >
            Go to dashboard
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
