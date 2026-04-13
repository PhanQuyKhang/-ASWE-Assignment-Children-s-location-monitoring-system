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
        
        if (device.last_updated) {
            const timeDiff = Math.abs(
                data.timestamp.getTime() - new Date(device.last_updated)
            );
            if (
                Number(device.last_lat) === data.latitude &&
                Number(device.last_lon) === data.longitude &&
                timeDiff < 5000)
            {
                return; 
            }
        }
        const isOlder = device.last_updated && data.timestamp <= new Date(device.last_updated);
        if (isOlder) {
            const createdLogId = await LogModel.create(data);
            if (!createdLogId) throw new Error("Log creation failed");
        } else {
            const [createdLogId, updateResult] = await Promise.all([
                LogModel.create(data),
                DeviceModel.updateDevice(data)
            ]);            
            if (!createdLogId || !updateResult) {
                throw new Error("Log create and update failed"); 
            }
        }
        
        LocalMegaphone.emit('DEVICE_UPDATES', {
            device_id: data.device_id,
            child_name: device.child_name,
            timezone: device.timezone,
            lat: data.latitude,
            lon: data.longitude,
            battery: data.battery,
            timestamp: data.timestamp,
            activity_type: data.activity_type,
            isOlder: isOlder
        });

        return true;
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
        latestLog.updated_at = DateTime.fromJSDate(latestLog.updated_at).setZone( device.timezone).toLocaleString(DateTime.DATETIME_MED);
        latestLog.timestamp = DateTime.fromJSDate(latestLog.timestamp).setZone( device.timezone).toLocaleString(DateTime.DATETIME_MED);
        return latestLog;
    }
      
};

module.exports = LogService; 