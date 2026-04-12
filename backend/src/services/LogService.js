const LogModel = require('../models/LogModel')
const DeviceModel = require('../models/DeviceModel')
const LocalMegaphone = require('../services/LocalMegaphone');
const { validate: validateUUID } = require('uuid');
const { DateTime } = require('luxon');

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
                timestamp: data.timestamp,
                activity_type: data.activity_type
            });
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
        let latestLog = await LogModel.getLatestbyID(device_id);
        if (!latestLog) {
            throw new Error("No logs found for this device");
        }
        latestLog.update_at = DateTime.fromJSDate(latestLog.update_at).setZone(device.timezone).toISO();
        latestLog.timestamp = DateTime.fromJSDate(latestLog.timestamp).setZone(device.timezone).toISO();
        return latestLog;
    }
      
};

module.exports = LogService; 