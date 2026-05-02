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


/** ~1 m — duplicate ping detection only (GPS jitter); geofence checks use full precision elsewhere. */
const COORD_EPS_DUP = 1e-5;
/** Skip redundant pings: same coordinates & log time within 10s after device's last update (Traccar heartbeat / interval rules). */
const DUPLICATE_AFTER_LAST_MS = 10_000;

const LogService = {
    processLog: async (data) => { 
        const device = await DeviceModel.findbyID(data.device_id);
        if (!device){
            throw new Error("Invalid Device ID"); 
        }
        if (device.status == "INACTIVE"){
            throw new Error("Device inactive"); 
        }

        const logTs = data.timestamp.getTime();
        const lastUpMs = device.last_updated ? new Date(device.last_updated).getTime() : null;

        if (lastUpMs != null) {
            const sameLat =
                device.last_lat != null &&
                Math.abs(Number(device.last_lat) - data.latitude) < COORD_EPS_DUP;
            const sameLon =
                device.last_lon != null &&
                Math.abs(Number(device.last_lon) - data.longitude) < COORD_EPS_DUP;
            const dtAfterLast = logTs - lastUpMs;
            if (sameLat && sameLon && dtAfterLast >= 0 && dtAfterLast < DUPLICATE_AFTER_LAST_MS) {
                return;
            }
        }

        // Newer log updates device; strictly older log timestamp does not (replay / backlog).
        const isOlder = lastUpMs != null && logTs < lastUpMs;

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
        if (!isOlder){
            let device_status;
            // Recover from NOSIGNAL using log timeline only (any newer ping restores ACTIVE).
            if (device.status === "NOSIGNAL") {
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
            const createdLogId = await LogModel.create(data);
            if (!createdLogId) {
                throw new Error("Log create failed"); 
            }
        }

        // Geofence alerts: only on INSIDE ↔ OUTSIDE transition vs previous stored log (by log timestamp).
        if (zonecheck && !isOlder) {
            const prevLog = await LogModel.getLatestbyTimeStamp(data.device_id, data.timestamp);
            const prevInside = prevLog?.boundary_status === "INSIDE";
            const currInside = zonecheck.boundary_status === "INSIDE";
            if (prevInside !== currInside) {
                LocalMegaphone.emit("DEVICE_ALERT", {
                    user_id: device.user_id,
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
                    isOlder: false,
                    boundary_status: zonecheck.boundary_status,
                });
            }
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