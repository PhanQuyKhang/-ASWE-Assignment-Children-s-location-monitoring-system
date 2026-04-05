const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clms-dev-secret-change-me';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing token' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
}

module.exports = authMiddleware;
