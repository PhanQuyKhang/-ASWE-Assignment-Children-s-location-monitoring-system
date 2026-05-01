const LogModel = require('../models/LogModel')
const DeviceModel = require('../models/DeviceModel')
const LocalMegaphone = require('../services/LocalMegaphone');
const { validate: validateUUID } = require('uuid');
const { DateTime } = require('luxon');
const formatLogDates = (log, timezone) => {
    if (!log) return log;

    const tz = timezone || 'UTC';

    if (log.timestamp) {
        log.timestamp = DateTime.fromJSDate(log.timestamp)
            .setZone(tz)
            .toLocaleString(DateTime.DATETIME_MED);
    }

    if (log.updated_at) {
        log.updated_at = DateTime.fromJSDate(log.updated_at)
            .setZone(tz)
            .toLocaleString(DateTime.DATETIME_MED);
    }

    return log;
};


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

        //check xem cái mới tạo có timestamp < now + 90s và đang noSIGNAL thì đổi thành ACTIVE
        const now = Date.now(); // số mili-giây hiện tại
        const logTime = new Date(data.timestamp).getTime(); // số mili-giây của log

        // Nếu thiết bị NOSIGNAL và log mới không quá 90 giây so với hiện tại
        if (device.status === "NOSIGNAL" && (now - logTime) <= 90 * 1000) {
            await DeviceModel.activeDevice(device.device_id);
            // Có thể tạo alert "SIGNAL_RESTORED" ở đây
        }

        
        LocalMegaphone.emit('DEVICE_UPDATES', {
            device_id: data.device_id,
            child_name: device.child_name,
            timezone: device.timezone,
            latitude: data.latitude,
            longitude: data.longitude,
            battery: data.battery_level,
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
    },

    getLogsbyDevice: async (device_id, user_id, options = {}) => {
        const { limit = 20, cursor } = options;

        if (!validateUUID(device_id)) {
            throw new Error("Invalid UUID");
        }

        const safeLimit = Math.min(limit, 50);

        const device = await DeviceModel.findbyID(device_id);
        if (!device) {
            throw new Error("Device not found");
        }
        if (device.user_id !== user_id) {
            throw new Error("Not authorized to view this device");
        }

        const logs = await LogModel.getLogsByDevice(
            device_id,
            safeLimit,
            cursor ? new Date(cursor) : null
        );

        const nextCursor =
            logs.length > 0
                ? logs[logs.length - 1].timestamp.toISOString()
                : null;

        const formattedLogs = logs.map(log =>
            formatLogDates(log, device.timezone)
        );

        

        return {
            logs: formattedLogs,
            nextCursor,
        };
    }
      
};

module.exports = LogService; 