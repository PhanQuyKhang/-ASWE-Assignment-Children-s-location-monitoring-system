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
    addDevice: async ({ userId, childName, timezone }) => { 
        try {
            if (!isValidTimezone(timezone)){
                throw new Error("Invalid timezone");
            }
            const newDevice = await DeviceModel.addDevice({
                userId,
                childName,
                timezone
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
    }
};

module.exports = DeviceService;