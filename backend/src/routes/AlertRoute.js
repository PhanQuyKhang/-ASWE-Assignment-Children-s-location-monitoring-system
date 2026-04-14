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
router.get('/', authMiddleware, validateDeviceId, AlertController.getAlertsbyUser);

module.exports = router;