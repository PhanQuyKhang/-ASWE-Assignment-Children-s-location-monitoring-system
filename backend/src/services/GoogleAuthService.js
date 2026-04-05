const { OAuth2Client } = require('google-auth-library');

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

function getClient() {
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth is not configured');
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

function buildGoogleAuthUrl() {
  const client = getClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['openid', 'email', 'profile'],
  });
}

async function exchangeGoogleCode(code) {
  const client = getClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  if (!tokens.id_token) {
    throw new Error('Google did not return an identity token');
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  return payload;
}

function buildFrontendRedirect(token) {
  return `${frontendUrl}/oauth/callback?token=${encodeURIComponent(token)}`;
}

module.exports = { buildGoogleAuthUrl, exchangeGoogleCode, buildFrontendRedirect };
