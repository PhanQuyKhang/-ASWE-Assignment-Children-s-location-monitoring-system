const LogModel = require('../models/LogModel')
const DeviceModel = require('../models/DeviceModel')
// const WebSocketService = require('../services/WebSocketService');
const BoundaryService = require('../services/BoundaryService');
const LocalMegaphone = require('../services/LocalMegaphone');
const LogService = {
    processLog: async (data) => { 
        const device = await DeviceModel.findbyID(data.device_id);
        if (!device){
            throw new Error("Invalid Device ID"); 
        }
        if (device.status == "INACTIVE"){
            throw new Error("Device inactive"); 
        }

        const lastLog = await LogModel.getLatestbyID(data.device_id);
        
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

        const [log_id, updateResult] = await Promise.all([
            LogModel.create(data),
            DeviceModel.updateDevice(data)
        ]);
        if (log_id && updateResult){
            LocalMegaphone.emit('DEVICE_UPDATES', {
                device_id: data.device_id,
                data: {
                    lat: data.latitude,
                    lon: data.longitude,
                    battery: data.battery,
                    timestamp: data.timestamp
                }
            });
            //Later on, the Boundary logic
        } else {
            throw new Error("Log create and update failed"); 
        }

        return log_id;
    },
      
};

module.exports = LogService; 