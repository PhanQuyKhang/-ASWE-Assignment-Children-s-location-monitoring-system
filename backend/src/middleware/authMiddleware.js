const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clms-dev-secret-change-me';
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'clms_access_token';

function authMiddleware(req, res, next) {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: missing token' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
}

module.exports = authMiddleware;
