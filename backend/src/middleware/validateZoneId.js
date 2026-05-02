module.exports = function validateZoneId(req, res, next) {
  const id = Number(req.params.zone_id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid zone_id' });
  }
  req.zoneIdNumeric = id;
  next();
};
