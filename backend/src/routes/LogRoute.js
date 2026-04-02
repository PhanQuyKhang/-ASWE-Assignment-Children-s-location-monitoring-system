const express = require('express');
const router = express.Router();
const LogController = require('../controllers/LogController');

// 1. Nhận dữ liệu từ Traccar/Arduino và lưu vào DB
router.post('/traccar', LogController.saveLog);

// 2. Lấy vị trí mới nhất của 1 thiết bị
/*router.get('/latest/:deviceid', TelemetryController.getLatestLocation);

// 3. Lấy N lịch sử vị trí (Ví dụ: /history/123?limit=20)
router.get('/history/:deviceid', TelemetryController.getLocationLogs);*/

module.exports = router;