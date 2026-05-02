const express = require('express');
const router = express.Router();
const AlertController = require('../controllers/AlertController');
const validateDeviceId = require("../middleware/validateDeviceId");
const authMiddleware = require('../middleware/authMiddleware');


router.get(
    "/latest/:device_id",
    authMiddleware,
    validateDeviceId,
    AlertController.getLatestAlertbyDevice
);
router.get('/history/:device_id', authMiddleware, validateDeviceId, AlertController.getAlertsbyDevice);
router.get('/', authMiddleware, AlertController.getAlertsbyUser);
router.put('/:alert_id/read', authMiddleware, AlertController.markAlertRead);

module.exports = router;