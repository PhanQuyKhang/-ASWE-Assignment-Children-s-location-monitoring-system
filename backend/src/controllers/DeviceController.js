const DeviceService = require('../services/DeviceService');

const DeviceController = {
    addDevice: async (req, res) => { 
        try {
            const userId = req.user.user_id;
            const { childName, timezone } = req.body;

            if (!childName) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Child Name required.' 
                });
            }

            if (!timezone) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Timezone required.' 
                });
            }

            const newDevice = await DeviceService.addDevice({
                userId,
                childName,
                timezone
            });

            return res.status(201).json({
                success: true,
                message: 'Device added successfully!',
                data: newDevice
            });

        } catch (error) {
            console.error('Error inserting new device:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Server Error. Could not add device.' 
            });
        }
    },
    getActiveDevices: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const result = await DeviceService.getActiveDevices(userId);
            return res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error getting device:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Server Error. Could not get device.' 
            });
        }
    },
    getDevices: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const result = await DeviceService.getDevices(userId);
            return res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error getting device:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Server Error. Could not get device.' 
            });
        }
    }
    
};

module.exports = DeviceController;