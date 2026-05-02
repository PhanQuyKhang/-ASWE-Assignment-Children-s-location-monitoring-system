import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center p-6"
          style={{ background: 'var(--bg, #f7faf8)', color: 'var(--text, #1a1a1a)' }}
        >
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm opacity-80 mb-4 text-center max-w-md">
            The app hit an unexpected error. You can try reloading the page.
          </p>
          <button
            type="button"
            className="px-4 py-2 rounded-lg font-medium"
            style={{ background: 'var(--accent, #00b14f)', color: '#fff' }}
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
