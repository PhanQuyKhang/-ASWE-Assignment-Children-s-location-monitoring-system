const DeviceService = require('../services/DeviceService');

const DeviceController = {
    addDevice: async (req, res) => { 
        try {
            const userId = req.user.user_id;
            const { childName, timezone, deviceId } = req.body;

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
                timezone,
                deviceId,
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
            return res.status(200).json({
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
            return res.status(200).json({
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
    getDeviceById: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const device = await DeviceService.getDeviceById(userId, req.params.device_id);
            if (!device) {
                return res.status(404).json({ success: false, message: 'Device not found' });
            }
            return res.status(200).json({ success: true, data: device });
        } catch (error) {
            console.error('Error getting device:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    updateDevice: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const { childName, timezone } = req.body;
            const updated = await DeviceService.updateDevice(userId, req.params.device_id, {
                childName,
                timezone,
            });
            if (!updated) {
                return res.status(404).json({ success: false, message: 'Device not found' });
            }
            return res.status(200).json({ success: true, data: updated });
        } catch (error) {
            console.error('Error updating device:', error);
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    deleteDevice: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const removed = await DeviceService.removeDevice(userId, req.params.device_id);
            if (!removed) {
                return res.status(404).json({ success: false, message: 'Device not found' });
            }
            return res.status(200).json({ success: true, data: removed });
        } catch (error) {
            console.error('Error deleting device:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },
};

module.exports = DeviceController;