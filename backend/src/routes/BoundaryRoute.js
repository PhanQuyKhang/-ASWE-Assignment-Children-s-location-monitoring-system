const express = require('express');
const router = express.Router();
const BoundaryController = require('../controllers/BoundaryController');
const validateDeviceId = require("../middleware/validateDeviceId");
const authMiddleware = require('../middleware/authMiddleware');

function validateZoneId(req, res, next) {
    const id = parseInt(req.params.zone_id, 10);
    if (!Number.isFinite(id) || id < 1) {
        return res.status(400).json({ error: 'Invalid zone_id' });
    }
    next();
}

router.post('/create/:device_id', validateDeviceId, authMiddleware, BoundaryController.createZone);
router.put('/zone/:zone_id', validateZoneId, authMiddleware, BoundaryController.updateZone);
router.delete('/zone/:zone_id', validateZoneId, authMiddleware, BoundaryController.deleteZone);
router.get('/', authMiddleware, BoundaryController.getZonebyUser);
router.get('/:device_id', validateDeviceId, authMiddleware, BoundaryController.getZonebyDevice);

module.exports = router;