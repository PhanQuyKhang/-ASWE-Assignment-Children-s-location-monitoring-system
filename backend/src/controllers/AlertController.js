const AlertService = require('../services/AlertService');
const AlertModel = require('../models/AlertModel');

const AlertController = {
    getLatestAlertbyDevice: async (req, res) => { 
        try {
            const userId = req.user.user_id;

            const device_id = req.params.device_id; 
            
            if (!device_id) {
                return res.status(400).json({ message: "Device ID is required" });
            }

            const latestAlert = await AlertService.getLatestAlertbyDevice(device_id, userId);

            return res.status(200).json({ 
                success: true,
                data: latestAlert
            });
            
        } catch (err) {
            console.error("Error fetching latest alert:", err);
            return res.status(500).json({error: err.message }); 
        } 
    },
    getAlertsbyDevice: async (req, res) => { 
        try {
            const userId = req.user.user_id;
            const device_id = req.params.device_id;

            if (!device_id) {
                return res.status(400).json({ message: "Device ID is required" });
            }

            const { limit, cursor } = req.query;

            const result = await AlertService.getAlertsbyDevice(
                device_id,
                userId,
                {
                    limit: parseInt(limit) || 20,
                    cursor
                }
            );

            return res.status(200).json({ 
                success: true,
                data: result.alerts,
                nextCursor: result.nextCursor
            });
            
        } catch (err) {
            console.error("Error fetching alerts:", err);
            return res.status(500).json({ error: err.message }); 
        } 
    },
    getAlertsbyUser: async (req, res) => { 
        try {
            const userId = req.user.user_id;

            const { limit, cursor } = req.query;

            const result = await AlertService.getAlertsbyUser(
                userId,
                {
                    limit: parseInt(limit) || 20,
                    cursor
                }
            );

            return res.status(200).json({ 
                success: true,
                data: result.alerts,
                nextCursor: result.nextCursor
            });
            
        } catch (err) {
            console.error("Error fetching alerts:", err);
            return res.status(500).json({ error: err.message }); 
        } 
    },

    markAlertRead: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const alertId = parseInt(req.params.alert_id, 10);
            if (!Number.isFinite(alertId) || alertId < 1) {
                return res.status(400).json({ error: 'Invalid alert_id' });
            }
            const row = await AlertModel.findAlertForUser(alertId, userId);
            if (!row) {
                return res.status(404).json({ error: 'Alert not found' });
            }
            const updated = await AlertModel.markAsRead(alertId);
            return res.status(200).json({ success: true, data: updated });
        } catch (err) {
            console.error('Error marking alert read:', err);
            return res.status(500).json({ error: err.message });
        }
    },
};

module.exports = AlertController;