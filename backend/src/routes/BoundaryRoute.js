const express = require('express');
const router = express.Router();
const BoundaryController = require('../controllers/BoundaryController');
const validateDeviceId = require("../middleware/validateDeviceId");
const validateZoneId = require('../middleware/validateZoneId');
const authMiddleware = require('../middleware/authMiddleware');
router.post('/create/:device_id', validateDeviceId, authMiddleware, BoundaryController.createZone);
router.put('/update/:zone_id', validateZoneId, authMiddleware, BoundaryController.updateZone);
router.post('/delete/:zone_id', validateZoneId, authMiddleware, BoundaryController.deleteZone);
router.get('/', authMiddleware, BoundaryController.getZonebyUser);
router.get('/:device_id', validateDeviceId, authMiddleware, BoundaryController.getZonebyDevice);


module.exports = router;