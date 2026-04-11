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
    updateZone: async (req, res) => { 
        try {
            const userId = req.user.user_id;
            const data = await validateZone(req.body);
            //await BoundaryService.updateZone(data, userId);
            return res.json({ success: true });
        } catch (err) {
            console.log(err);
            return res.status(400).json({ error: err.message });
        } 

    },
    deleteZone: async (req, res) => { 
        try {
            const userId = req.user.user_id;
            const zone_id = req.body;
            //await BoundaryService.deleteZone(zone_id, userId);
            return res.json({ success: true });
        } catch (err) {
            console.log(err);
            return res.status(400).json({ error: err.message });
        } 

    },
};

module.exports = BoundaryController; 