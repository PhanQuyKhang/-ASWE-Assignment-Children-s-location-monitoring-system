const DeviceModel = require('../models/DeviceModel');
const { DateTime } = require('luxon');

const isValidTimezone = (tz) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};
const formatDeviceDates = (device) => {
    if (!device) return device;
    
    const tz = device.timezone || 'UTC'; 
    
    if (device.create_at) {
        device.create_at = DateTime.fromJSDate(device.create_at)
                                   .setZone(tz)
                                   .toLocaleString(DateTime.DATETIME_MED);
    }
    if (device.created_at) {
        device.created_at = DateTime.fromJSDate(device.created_at)
                                    .setZone(tz)
                                    .toLocaleString(DateTime.DATETIME_MED);
    }
    if (device.last_updated) {
        device.last_updated = DateTime.fromJSDate(device.last_updated)
                                      .setZone(tz)
                                      .toLocaleString(DateTime.DATETIME_MED);
    }
    
    return device;
};
const DeviceService = {
    addDevice: async ({ userId, childName, timezone, deviceId }) => { 
        try {
            if (!isValidTimezone(timezone)){
                throw new Error("Invalid timezone");
            }
            const newDevice = await DeviceModel.addDevice({
                userId,
                childName,
                timezone,
                deviceId: deviceId || null,
            });

            return formatDeviceDates(newDevice);
        } catch (error) {
            console.error('Error inserting new device:', error);
            throw error; // let controller handle response
        }
    },
    getDevices: async (userId) => {
        try {
            const result = await DeviceModel.getDevices(userId);
            return result.map(formatDeviceDates);
        } catch (error) {
            console.error('Error getting device:', error);
            throw error;
        }
    },
    getActiveDevices: async (userId) => {
        const result = await DeviceModel.getActiveDevices(userId);
        return result.map(formatDeviceDates);
    },
    getDeviceById: async (userId, deviceId) => {
        const d = await DeviceModel.findbyID(deviceId);
        if (!d || d.user_id !== userId) {
            return null;
        }
        return formatDeviceDates(d);
    },
    updateDevice: async (userId, deviceId, payload) => {
        if (payload.timezone && !isValidTimezone(payload.timezone)) {
            throw new Error('Invalid timezone');
        }
        const updated = await DeviceModel.updateForUser(userId, deviceId, {
            childName: payload.childName,
            timezone: payload.timezone,
        });
        return updated ? formatDeviceDates(updated) : null;
    },
    removeDevice: async (userId, deviceId) => {
        const row = await DeviceModel.softDeleteForUser(userId, deviceId);
        return row ? formatDeviceDates(row) : null;
    },
};

module.exports = DeviceService;