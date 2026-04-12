const express = require('express');
const router = express.Router();
const BoundaryController = require('../controllers/BoundaryController');
const validateDeviceId = require("../middleware/validateDeviceId");
const authMiddleware = require('../middleware/authMiddleware');
router.post('/create/:device_id', validateDeviceId, authMiddleware, BoundaryController.createZone);
router.get('/get/device/:device_id', validateDeviceId, authMiddleware, BoundaryController.getZonebyDevice);
router.get('/get/user', authMiddleware, BoundaryController.getZonebyUser);


module.exports = router;