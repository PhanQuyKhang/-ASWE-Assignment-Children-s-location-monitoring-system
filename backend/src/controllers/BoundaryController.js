const BoundaryService = require('../services/BoundaryService')
const { validateZone } = require("../dto/zoneDTO");

const BoundaryController = {
    createZone: async (req, res) => { 
        try {
            const userId = req.user.user_id;
            const {device_id} = req.params;
            const data = await validateZone(req.body);
            await BoundaryService.createZone(data, userId, device_id);
            return res.json({ success: true });
        } catch (err) {
            console.log(err);
            return res.status(400).json({ error: err.message });
        } 

    },
    getZonebyDevice: async (req, res) => { 
        try {
            const userId = req.user.user_id;
            const {device_id} = req.params;
            const result = await BoundaryService.getZonebyDevice(userId, device_id);

            return res.status(200).json({ 
                success: true,
                data: result
            });
            
        } catch (err) {
            console.log(err);
            return res.status(400).json({ error: err.message });
        } 

    },
    getZonebyUser: async (req, res) => { 
        try {
            const userId = req.user.user_id;
            const result = await BoundaryService.getZonebyUser(userId);
            return res.status(200).json({ 
                success: true,
                data: result
            });
        } catch (err) {
            console.log(err);
            return res.status(400).json({ error: err.message });
        } 

    },
    updateZone: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const zone_id = parseInt(req.params.zone_id, 10);
            if (!Number.isFinite(zone_id) || zone_id < 1) {
                return res.status(400).json({ error: 'Invalid zone_id' });
            }
            const data = await validateZone(req.body);
            await BoundaryService.updateZone(zone_id, userId, data);
            return res.json({ success: true });
        } catch (err) {
            console.log(err);
            return res.status(400).json({ error: err.message });
        }
    },
    deleteZone: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const zone_id = parseInt(req.params.zone_id, 10);
            if (!Number.isFinite(zone_id) || zone_id < 1) {
                return res.status(400).json({ error: 'Invalid zone_id' });
            }
            await BoundaryService.deleteZone(zone_id, userId);
            return res.json({ success: true });
        } catch (err) {
            console.log(err);
            return res.status(400).json({ error: err.message });
        }
    },
    
};

module.exports = BoundaryController; 