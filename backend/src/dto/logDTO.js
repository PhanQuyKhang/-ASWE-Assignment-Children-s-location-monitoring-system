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
    let activity_type = "UNKNOWN";

    if (coords.speed !== undefined && coords.speed !== null) {
        const rawSpeed = Number(coords.speed);

        if (isNaN(rawSpeed)) {
            throw new Error("Invalid Log: Invalid speed");
        }

        if (rawSpeed < 0) {
            speed = 0; 
            activity_type = "UNKNOWN";
        } else {
            speed = rawSpeed;
            if (speed <= 0.5) {
                activity_type = "STILL";
            } else if (speed < 1.8) {
                activity_type = "ON_FOOT"; 
            } else {
                activity_type = "IN_VEHICLE"; 
            }
        }
    }

    const accuracy = Number(coords.accuracy);
    if (accuracy < 0 || accuracy > 150) {
        throw new Error(`Invalid Log: Unreliable accuracy (${accuracy}m)`);
    }

    let heading = Number(coords.heading || 0);
    if (heading < 0) heading = 0;

    const timestamp = new Date(loc.timestamp);
    if (isNaN(timestamp.getTime())) {
        throw new Error("Invalid Log: Invalid timestamp");
    }

    let battery_level = null;

    if (loc.battery?.level !== undefined) {
        battery_level = Number(loc.battery.level);

        if ( battery_level < 0 ) battery_level = 0;
        if ( battery_level > 1 ) battery_level = 1;

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