const LogService = require('../services/LogService');
const { validateLogPayload } = require("../dto/logDTO");

const LogController = {
    saveLog: async (req, res) => { 
        try {
            const data = await validateLogPayload(req.body);
            
            LogService.processLog(data); 
            
            return res.status(201).json({ success: true }); 
        } catch (err) {
            console.error("Error saving log:", err);
            return res.status(400).json({ error: err.message });
        } 
    },

    getLatestLogbyDevice: async (req, res) => { 
        try {
            const userId = req.user.user_id;

            const device_id = req.params.device_id; 
            
            if (!device_id) {
                return res.status(400).json({ message: "Device ID is required" });
            }

            const latestLog = await LogService.getLatestbyID(device_id, userId);

            return res.status(200).json({ 
                success: true,
                data: latestLog
            });
            
        } catch (err) {
            console.error("Error fetching latest log:", err);
            return res.status(500).json({error: err.message }); 
        } 
    },
    getLogsbyDevice: async (req, res) => { 
        try {
            const userId = req.user.user_id;
            const device_id = req.params.device_id;

            if (!device_id) {
                return res.status(400).json({ message: "Device ID is required" });
            }

            const { limit, cursor } = req.query;

            const result = await LogService.getLogsbyDevice(
                device_id,
                userId,
                {
                    limit: parseInt(limit) || 20,
                    cursor
                }
            );

            return res.status(200).json({ 
                success: true,
                data: result.logs,
                nextCursor: result.nextCursor
            });
            
        } catch (err) {
            console.error("Error fetching logs:", err);
            return res.status(500).json({ error: err.message }); 
        } 
    },
};

module.exports = LogController;