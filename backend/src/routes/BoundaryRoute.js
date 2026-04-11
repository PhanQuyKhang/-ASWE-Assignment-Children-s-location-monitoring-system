const express = require('express');
const router = express.Router();
const BoundaryController = require('../controllers/BoundaryController');
const validateDeviceId = require("../middleware/validateDeviceId");
const authMiddleware = require('../middleware/authMiddleware');
router.post('/create/:device_id', validateDeviceId, authMiddleware, BoundaryController.createZone);



module.exports = router;