/**
 * Optional shared secret for POST /log/traccar (Traccar webhook).
 * Set TRACCAR_WEBHOOK_SECRET in .env and configure Traccar Custom Header:
 *   X-Traccar-Secret: <same value>
 */
function validateTraccarSecret(req, res, next) {
  const secret = process.env.TRACCAR_WEBHOOK_SECRET;
  if (!secret) {
    return next();
  }
  const header = req.headers['x-traccar-secret'] || req.headers['x-webhook-secret'];
  if (header !== secret) {
    return res.status(401).json({ error: 'Unauthorized webhook' });
  }
  return next();
}

module.exports = validateTraccarSecret;
