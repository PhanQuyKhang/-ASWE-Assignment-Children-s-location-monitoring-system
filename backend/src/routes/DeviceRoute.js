const express = require('express');
const router = express.Router();
const DeviceController = require('../controllers/DeviceController');
const validateDeviceId = require("../middleware/validateDeviceId");
const authMiddleware = require('../middleware/authMiddleware');


router.post('/add', authMiddleware, DeviceController.addDevice);
router.get('/active', authMiddleware, DeviceController.getActiveDevices);
router.get('/', authMiddleware, DeviceController.getDevices);
router.get('/:device_id', authMiddleware, validateDeviceId, DeviceController.getDeviceById);
router.put('/:device_id', authMiddleware, validateDeviceId, DeviceController.updateDevice);
router.delete('/:device_id', authMiddleware, validateDeviceId, DeviceController.deleteDevice);

module.exports = router;