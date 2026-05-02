export default function GoogleSignInButton({ children = 'Continue with Google' }) {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  function handleClick() {
    window.location.href = `${apiBaseUrl}/auth/google/start`;
  }

  return (
    <button className="btn btn-ghost btn-block google-redirect-btn" type="button" onClick={handleClick}>
      {children}
    </button>
  );
}
