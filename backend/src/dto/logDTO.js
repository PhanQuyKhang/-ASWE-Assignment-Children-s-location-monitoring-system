const { validate: validateUUID } = require('uuid');

function validateLogPayload(data) {
    
    if (!data.device_id) {
        throw new Error("Invalid Log: Missing device_id");
    }
    if (!validateUUID(data.device_id)) {
        throw new Error("Invalid UUID");
    }
    

    const loc = data.location;
    if (!loc) {
        throw new Error("Invalid Log: Missing location");
    }

    const coords = loc.coords || {};
    
    const accuracy = Number(coords.accuracy);
   
    /*if (accuracy >=20) {
        throw new Error("Invalid Log: Low accuracy");
    }*/
   
    
    if (coords.latitude === undefined || coords.longitude === undefined) {
        throw new Error("Invalid Log: Missing latitude or longitude");
    }

    const latitude = Number(coords.latitude);
    const longitude = Number(coords.longitude);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        throw new Error("Invalid Log: Invalid latitude");
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        throw new Error("Invalid Log: Invalid lclecleongitude");
    }


    let speed = 0;
    let activity_type = null;

    if (coords.speed !== undefined) {
        speed = Number(coords.speed);

        if (isNaN(speed)) {
        throw new Error("Invalid Log: Invalid speed");
        }

        if (speed <= 0.5) activity_type = "still";
        else if (speed < 1.8) activity_type = "walking";
        else activity_type = "in_vehicle";
    }

    const timestamp = new Date(loc.timestamp);
    if (isNaN(timestamp.getTime())) {
        throw new Error("Invalid Log: Invalid timestamp");
    }

    let battery_level = null;

    if (loc.battery?.level !== undefined) {
        battery_level = Number(loc.battery.level);

        // if (isNaN(battery_level) || battery_level < 0 || battery_level > 1) {
        //     throw new Error("Invalid Log: Invalid battery level");
        // }
        battery_level *=100;
    }
    
    return {
        device_id: data.device_id,
        timestamp,
        latitude,
        longitude,
        accuracy,
        speed,
        heading: Number(coords.heading || 0),
        altitude: Number(coords.altitude || 0),
        odometer: Number(loc.odometer || 0),
        battery_level,
        activity_type
    };
}

module.exports = { validateLogPayload };