//const LogModel = require('../models/LogModel')
const LogService = require('../services/LogService')
const { validateLogPayload } = require("../dto/logDTO");

const LogController = {
    saveLog: async (req, res) => { 
        try {
            console.log(req.body);
            const data = await validateLogPayload(req.body);
            console.log("true");
            LogService.processLog(data);
            return res.json({ success: true });
        } catch (err) {
            console.log(err);
            return res.status(400).json({ error: err.message });
        } 

    },
};

module.exports = LogController; 