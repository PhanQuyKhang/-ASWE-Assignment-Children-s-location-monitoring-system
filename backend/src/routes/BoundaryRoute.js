const express = require('express');
const router = express.Router();
const BoundaryController = require('../controllers/BoundaryController');

router.post('/create', BoundaryController.createZone);



module.exports = router;