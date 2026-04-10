const express = require('express');
const router = express.Router();
const DeviceController = require('../controllers/DeviceController');
const validateDeviceId = require("../middleware/validateDeviceId");
const authMiddleware = require('../middleware/authMiddleware');
// @route   POST /device
// @desc    Add a new tracking device and link it to the user
router.post('/', authMiddleware, DeviceController.addDevice);
router.get('/:userId', authMiddleware, DeviceController.getActiveDevices);
//router.post('/:deviceId', validateDeviceId, authMiddleware, DeviceController.getDevicebyId);



module.exports = router;