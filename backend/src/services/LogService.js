const LogModel = require('../models/LogModel')
const DeviceModel = require('../models/DeviceModel')
const BoundaryService = require('../services/BoundaryService');
const LocalMegaphone = require('../services/LocalMegaphone');
const { validate: validateUUID } = require('uuid');

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
                child_name: device.child_name,
                
                lat: data.latitude,
                lon: data.longitude,
                battery: data.battery,
                timestamp: data.timestamp

            });
            //BoundaryService.check(data);
        } else {
            throw new Error("Log create and update failed"); 
        }

        return log_id;
    },

    getLatestbyID: async (device_id, user_id) => {
        if (!validateUUID(device_id)) {
            throw new Error("Invalid UUID");
        }
        
        const device = await DeviceModel.findbyID(device_id);
        if (!device) {
            throw new Error("Device not found");
        }
        if (device.user_id !== user_id) {
            throw new Error("Not authorized to view this device");
        }
        const latestLog = await LogModel.getLatestbyID(device_id);
        if (!latestLog) {
            throw new Error("No logs found for this device");
        }
        console.log(latestLog.user_id);

        return latestLog;
    }
      
};

module.exports = LogService; 