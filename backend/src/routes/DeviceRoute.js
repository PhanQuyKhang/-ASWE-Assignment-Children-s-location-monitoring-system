const express = require('express');
const router = express.Router();
const Device = require('../models/DeviceModel');

// @route   POST /device
// @desc    Add a new tracking device and link it to the user
router.post('/', async (req, res) => {
  try {
    const { childName, deviceId } = req.body;

    // Mocking user_id = 1 for now
    const userId = req.user?.id || req.body.userId || 1;

    // Validate input
    if (!childName || !deviceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both Child Name and Device ID are required.' 
      });
    }

    // Call Model to insert data
    const newDevice = await Device.addDevice({ deviceId, userId, childName, timezone});

    res.status(201).json({
      success: true,
      message: 'Device added successfully!',
      data: newDevice
    });

  } catch (error) {
    console.error('Error inserting new device:', error);
    
    // Postgres error code 23505 = unique_violation
    if (error.code === '23505') {
      return res.status(409).json({ 
        success: false, 
        message: 'This Device ID is already registered in the system.' 
      });
    }
    
    // Postgres error code 22P02 = invalid UUID format
    if (error.code === '22P02') {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid Device ID format. It must be a valid UUID.' 
        });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server Error. Could not add device.' 
    });
  }
});

module.exports = router;