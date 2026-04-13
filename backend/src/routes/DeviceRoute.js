const express = require('express');
const router = express.Router();
const DeviceController = require('../controllers/DeviceController');
const validateDeviceId = require("../middleware/validateDeviceId");
const authMiddleware = require('../middleware/authMiddleware');


router.post('/add', authMiddleware, DeviceController.addDevice);
router.get('/', authMiddleware, DeviceController.getDevices);

//router.post('/:deviceId', validateDeviceId, authMiddleware, DeviceController.getDevicebyId);



module.exports = router;