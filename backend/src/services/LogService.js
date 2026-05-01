const LogModel = require('../models/LogModel')
const DeviceModel = require('../models/DeviceModel')
const LocalMegaphone = require('../services/LocalMegaphone');
const { validate: validateUUID } = require('uuid');
const { DateTime } = require('luxon');
const BoundaryService = require('./BoundaryService');
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
                timeDiff < 10000)
            {
                console.log(timeDiff);
                return; 
            }
        }         
        
        const isOlder = device.last_updated && data.timestamp <= new Date(device.last_updated);

        //Emit event before create log
        console.log("GOO");
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

        const zonecheck = await BoundaryService.check(
            {
            device_id: data.device_id,
            child_name: device.child_name,
            timezone: device.timezone,
            latitude: data.latitude,
            longitude: data.longitude,
            battery: data.battery_level,
            timestamp: data.timestamp,
            activity_type: data.activity_type,
            isOlder: isOlder,
            device: device
            }
        );

        //Create log and update device
        //Device dc update lat_lon, update_at, device_status, boundary_status
        const logTime = new Date(data.timestamp).getTime(); // số mili-giây của log
        if (!isOlder){
            //check xem cái mới tạo có timestamp < now + 90s và đang noSIGNAL thì đổi thành ACTIVE
            const now = Date.now(); // số mili-giây hiện tại
            let device_status;
            if (device.status === "NOSIGNAL" && (now - logTime) <= 90 * 1000) {
                device_status = "ACTIVE";
            }
            const zone_id = zonecheck?.zone_id ?? null;
            const zone_name = zonecheck?.zone_name ?? null;
            const boundary_status = zonecheck?.boundary_status ?? null;
            const [createdLogId, updateResult] = await Promise.all([
                LogModel.create(data, zone_id, zone_name, boundary_status),
                
                DeviceModel.updateDevice(data, boundary_status ?? null, device_status ?? null)
            ]);            
            if (!createdLogId || !updateResult) {
                throw new Error("Log create and update failed"); 
            }
        } else {
        //Log cũ thì ko update device gì cả!!!
            const createdLogId = await LogModel.create(data);
            if (!createdLogId) {
                throw new Error("Log create failed"); 
            }
        }
            
        //Alert or not
        if (zonecheck){
            const latestLogbyTime = await LogModel.getLatestbyTimeStamp(data.device_id, data.timestamp); 
            if (latestLogbyTime){
                const latestlogTime = new Date(latestLogbyTime.timestamp).getTime();

                //Với newLog, latestLogTime chỉ có giá trị nếu ko cách nhau quá 30s
                if (!isOlder && (logTime - latestlogTime) <= 30 * 1000){
                    //Nếu cùng zone và cùng type thì ignore
                    if (latestLogbyTime.zone_id == zonecheck.zone_id && latestLogbyTime.boundary_status == zonecheck.boundary_status)
                        return;
                }
                //Với newLog, nếu cùng zone, cùng type là INSIDE, bất kể tgian thì ignore
                if (latestLogbyTime.zone_id == zonecheck.zone_id && latestLogbyTime.boundary_status == zonecheck.boundary_status && zonecheck.boundary_status == "INSIDE")
                    return;
                //Với oldLog, latestLogTime chỉ có giá trị nếu ko cách nhau quá 30min
                if (isOlder && (logTime - latestlogTime) <= 30*60 * 1000){
                    //Nếu cùng zone và cùng type thì ignore
                    if (latestLogbyTime.zone_id == zonecheck.zone_id && latestLogbyTime.boundary_status == zonecheck.boundary_status)
                        return;
                }
            }
            

            //Tất cả các trường hợp còn lại thì đều emit sang ALERT
            LocalMegaphone.emit('DEVICE_ALERT', {
                device_id: data.device_id,
                child_name: device.child_name,
                timezone: device.timezone,
                zone_id: zonecheck.zone_id,
                zone_name: zonecheck.zone_name,
                latitude: data.latitude,
                longitude: data.longitude,
                battery: data.battery_level,
                timestamp: data.timestamp,
                activity_type: data.activity_type,
                isOlder: isOlder,
                boundary_status: zonecheck.boundary_status,
            });
        }
        

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