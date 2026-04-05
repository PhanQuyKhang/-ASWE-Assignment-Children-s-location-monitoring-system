import { useEffect } from 'react';

export default function OAuthCallbackPage() {
  useEffect(() => {
    window.location.replace('/dashboard');
  }, []);

  return <div className="loading-screen"><div className="loader" /></div>;
}
