const DeviceModel = require('../models/DeviceModel');
const isValidTimezone = (tz) => {
    return Intl.supportedValuesOf("timeZone").includes(tz);
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

            return newDevice;
        } catch (error) {
            console.error('Error inserting new device:', error);
            throw error; // let controller handle response
        }
    },

    getActiveDevices: async (userId) => {
        try {
            const result = await DeviceModel.getActiveDevices(userId);
            return result;
        } catch (error) {
            console.error('Error getting device:', error);
            throw error;
        }
    }
};

module.exports = DeviceService;