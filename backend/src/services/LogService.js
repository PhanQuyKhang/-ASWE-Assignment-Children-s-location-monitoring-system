const LogModel = require('../models/LogModel')
const DeviceModel = require('../models/DeviceModel')
// const WebSocketService = require('../services/WebSocketService');
// const BoundaryService = require('../services/BoundaryService');

const LogService = {
    processLog: async (data) => { 
        const device = await DeviceModel.findbyID(data.device_id);
        if (!device){
            throw new Error("Invalid Device ID"); 
        }

        const lastLog = await LogModel.getLatestbyID(data.device_id);
        console.log("HIII------------------------------------------------");
        console.log(lastLog);
        console.log("HIII------------------------------------------------");
        
        if (lastLog) {
            const timeDiff = Math.abs(
                data.timestamp.getTime() - new Date(lastLog.timestamp)
            );
            if (
                Number(lastLog.latitude) === data.latitude &&
                Number(lastLog.longitude) === data.longitude &&
                timeDiff < 5000)
            {
                return lastLog.id; 
            }
        }

        //furthure more logic?
        const log_id = await LogModel.create(data);
        console.log(log_id);
        //Later on, the Websocket event
        //Later on, the Boundary logic

        return log_id;
    },
      
};

module.exports = LogService; 