function buildAuthCallbackRedirect(token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  return `${frontendUrl}/oauth/callback?token=${encodeURIComponent(token)}`;
}

module.exports = { buildAuthCallbackRedirect };
