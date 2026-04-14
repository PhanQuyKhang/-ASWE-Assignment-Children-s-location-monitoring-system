const AlertModel = require('../models/AlertModel')
const DeviceModel = require('../models/DeviceModel')
const LocalMegaphone = require('../services/LocalMegaphone');
const { validate: validateUUID } = require('uuid');
const { DateTime } = require('luxon');
const formatAlertDates = (alert, timezone) => {
    if (!alert) return alert;

    const tz = timezone || 'UTC';

    if (alert.created_at) {
        alert.created_at = DateTime.fromJSDate(alert.created_at)
            .setZone(tz)
            .toLocaleString(DateTime.DATETIME_MED);
    }
    return alert;
};


const AlertService = {
    createAlert: async (data, type_alert) => { 
        const device = await DeviceModel.findbyID(data.device_id);
        if (!device){
            throw new Error("Invalid Device ID"); 
        }
        if (!type_alert){
            throw new Error("Invalid type for alert"); 
        }
 
        if (device.status == "INACTIVE"){
            throw new Error("Device inactive"); 
        }
        const lastAlert = await AlertModel.getLatestByDevice(data.device_id);
        /*
        Nếu type là ENTER thì cứ alert thui không thành vấn đề thì Boundary đã check toggle từ OUT - IN rồi
        Nếu type là EXIT:
        - Check xem device boundary_status đang là IN thì create và alert ngay (check toggle từ OUT - IN)
        - Nếu đang là OUT, tiếp tục check lastAlert của device, nếu khác zone_id thì create và alert ngay (vì đã vi phạm zone khác)
        - Nếu cùng zone, thì check đã xem chưa:
        + Nếu xem rồi thì bỏ qua
        + Nếu chưa xem thì check create_at nếu vượt qua log time 30s thì alert lại (ko create mới)
        */
        let canCreate = false;
        let canAlert = false;
        switch (type_alert) {
            case "ENTER":
                canAlert=true;
                canCreate=true;
                break;
            case "EXIT":
                if (device.boundary_status == "OUTSIDE"){
                    if (lastAlert && lastAlert.zone_id == data.zone_id){
                        if (lastAlert.is_read == true) return;
                        else {
                            const now = Date.now(); // số mili-giây hiện tại
                            const lastTime = new Date(lastAlert.created_at).getTime(); // số mili-giây của log
                            if ((now - lastTime) <= 30 * 1000) {
                                canAlert=true;
                                break;
                            } else return;
                        }
                    }
                }
                canAlert=true;
                canCreate=true;
                break;
            case "OUT_OF_SIGNAL":
                canAlert=true;
                canCreate=true;
                break;
            default:
                throw new Error("Invalid type for alert"); 
        }  
        if (canCreate){
            const newAlert = await AlertModel.createAlert(data, type_alert);
            if (!newAlert){
                throw new Error("Can not create new alert"); 
            }
        }
        LocalMegaphone.emit(type_alert, {
            device_id: data.device_id,
            child_name: data.child_name,
            timezone: data.timezone,
            latitude: data.latitude,
            longitude: data.longitude,
            battery: data.battery,
            timestamp: data.timestamp,
            activity_type: data.activity_type,
            isOlder: data.isOlder,
            boundary_status: data.boundary_status,
            last_update: data.boundary_status,
        });
        return true;
    },

    getLatestAlertbyDevice: async (device_id, user_id) => {
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
        let latestAlert = await AlertModel.getLatestByDevice(device_id);
        if (!latestAlert) {
            throw new Error("No logs found for this device");
        }
        latestAlert.created_at = DateTime.fromJSDate(latestAlert.created_at).setZone( device.timezone).toLocaleString(DateTime.DATETIME_MED);
        return latestAlert;
    },

    getAlertsbyDevice: async (device_id, user_id, options = {}) => {
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

        const alerts = await AlertModel.getAlertsByDevice(
            device_id,
            safeLimit,
            cursor ? new Date(cursor) : null
        );

        const nextCursor =
            alerts.length > 0
                ? alerts[alerts.length - 1].created_at.toISOString()
                : null;

        const formattedAlerts = alerts.map(alerts =>
            formatAlertDates(alerts, device.timezone)
        );

        

        return {
            alerts: formattedAlerts,
            nextCursor,
        };
    },
    getAlertsbyUser: async (user_id, options = {}) => {
        const { limit = 20, cursor } = options;


        const safeLimit = Math.min(limit, 50);


        const alerts = await AlertModel.getAlertsByUser(
            user_id,
            safeLimit,
            cursor ? new Date(cursor) : null
        );

        const nextCursor =
            alerts.length > 0
                ? alerts[alerts.length - 1].created_at.toISOString()
                : null;

        const formattedAlerts = alerts.map(alerts =>
            formatAlertDates(alerts, alerts.timezone)
        );

        

        return {
            alerts: formattedAlerts,
            nextCursor,
        };
    }
      
};
LocalMegaphone.on('DEVICE_OUT_ZONE', async (event) => {
    try {
        await AlertService.createAlert(event, "EXIT");
    } catch (error) {
        console.error("Failed to process local event:", error);
    }
});
LocalMegaphone.on('DEVICE_ENTER_ZONE', async (event) => {
    try {
        await AlertService.createAlert(event, "ENTER");  
    } catch (error) {
        console.error("Failed to process local event:", error);
    }
});
LocalMegaphone.on('DEVICE_LOST_SIGNAL', async (event) => {
    try {
        await AlertService.createAlert(event, "OUT_OF_SIGNAL");  
    } catch (error) {
        console.error("Failed to process local event:", error);
    }
});
module.exports = AlertService; 