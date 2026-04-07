const { validate: validateUUID } = require('uuid');

/**
 * Convert HH:mm → HH:mm:00 (PostgreSQL time)
 */
const toPgTime = (t) => {
    if (!t) return null;

    const [h, m] = t.split(':').map(Number);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
};

/**
 * Validate HH:mm format
 */
const isValidTime = (t) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);

/**
 * Validate lat/lon
 */
const isValidLat = (lat) => lat >= -90 && lat <= 90;
const isValidLon = (lon) => lon >= -180 && lon <= 180;

/**
 * Main validator
 */
function validateZone(data) {
    if (!data || typeof data !== 'object') {
        throw new Error("Invalid input");
    }

    let {
        device_id,
        zone_name,
        type,
        schedule_type,
        start_time,
        duration,
        days_of_week,
        days_of_month,
        specific_date,
        radius,
        center_lat,
        center_lon,
        points
    } = data;

    //-------------------------
    // BASIC VALIDATION
    //-------------------------
    if (!validateUUID(device_id)) {
        throw new Error("Invalid device_id UUID");
    }

    if (!zone_name || typeof zone_name !== 'string') {
        throw new Error("zone_name is required");
    }

    if (!["CIRCLE", "POLYGON"].includes(type)) {
        throw new Error("type must be CIRCLE or POLYGON");
    }

    //-------------------------
    // TIME VALIDATION
    //-------------------------
    if (start_time && !isValidTime(start_time)) {
        throw new Error("start_time must be HH:mm");
    }

    if (duration !== undefined) {
        const d = Number(duration);

        if (isNaN(d)) throw new Error("duration must be a number");
        if (d <= 0 || d >= 1440) throw new Error("duration must be 1–1439 minutes");

        duration = d;
    }

    //-------------------------
    // SCHEDULE VALIDATION
    //-------------------------
    const validSchedules = ["ALWAYS", "DAILY", "WEEKLY", "MONTHLY", "ONCE"];

    if (!validSchedules.includes(schedule_type)) {
        throw new Error("Invalid schedule_type");
    }

    switch (schedule_type) {
        case "ALWAYS":
            if (start_time || duration || days_of_week || days_of_month || specific_date) {
                throw new Error("ALWAYS must not include time or date fields");
            }
            break;

        case "DAILY":
            if (!start_time || !duration) {
                throw new Error("DAILY requires start_time and duration");
            }
            if (days_of_week || days_of_month || specific_date) {
                throw new Error("DAILY must not include date fields");
            }
            break;

        case "WEEKLY":
            if (!start_time || !duration || !Array.isArray(days_of_week) || days_of_week.length === 0) {
                throw new Error("WEEKLY requires start_time, duration, days_of_week");
            }
            break;

        case "MONTHLY":
            if (!start_time || !duration || !Array.isArray(days_of_month) || days_of_month.length === 0) {
                throw new Error("MONTHLY requires start_time, duration, days_of_month");
            }
            break;

        case "ONCE":
            if (!start_time || !duration || !specific_date) {
                throw new Error("ONCE requires start_time, duration, specific_date");
            }
            break;
    }

    //-------------------------
    // DATE ARRAYS VALIDATION
    //-------------------------
    if (days_of_week) {
        if (!days_of_week.every(d => Number.isInteger(d) && d >= 0 && d <= 6)) {
            throw new Error("days_of_week must be integers 0–6");
        }
    }

    if (days_of_month) {
        if (!days_of_month.every(d => Number.isInteger(d) && d >= 1 && d <= 31)) {
            throw new Error("days_of_month must be integers 1–31");
        }
    }

    //-------------------------
    // ZONE VALIDATION
    //-------------------------
    if (type === "CIRCLE") {
        if (points) {
            throw new Error("CIRCLE must not include points");
        }

        const lat = Number(center_lat);
        const lon = Number(center_lon);
        const r = Number(radius);

        if (isNaN(lat) || isNaN(lon) || isNaN(r)) {
            throw new Error("CIRCLE requires numeric center_lat, center_lon, radius");
        }

        if (!isValidLat(lat) || !isValidLon(lon)) {
            throw new Error("Invalid latitude/longitude");
        }

        if (r <= 0 || r > 100000) {
            throw new Error("radius must be > 0 and reasonable");
        }

        center_lat = lat;
        center_lon = lon;
        radius = r;
    }

    if (type === "POLYGON") {
        if (!Array.isArray(points) || points.length < 3) {
            throw new Error("POLYGON requires at least 3 points");
        }

        const orders = new Set();
        const coords = new Set();

        const formattedPoints = points.map((p) => {
            if (!p || p.latitude == null || p.longitude == null || p.sequence_order == null) {
                throw new Error("Each point must include latitude, longitude, sequence_order");
            }

            const lat = Number(String(p.latitude).trim());
            const lon = Number(String(p.longitude).trim());
            const order = Number(p.sequence_order);
            const coordKey  = `${lon},${lat}`;
            if (isNaN(lat) || isNaN(lon) || isNaN(order)) {
                throw new Error("Invalid point values");
            }

            if (!isValidLat(lat) || !isValidLon(lon)) {
                throw new Error("Invalid point coordinates");
            }
            if (order <= 0 || !Number.isInteger(order)) {
                throw new Error("Order must be positive integers");
            }

            if (orders.has(order)) {
                throw new Error("Duplicate sequence_order");
            }
            if (coords.has(coordKey )) {
                throw new Error("Duplicate points");
            }

            orders.add(order);
            coords.add(coordKey);

            return {
                latitude: lat,
                longitude: lon,
                sequence_order: order
            };
        });

        points = formattedPoints;
         
        const orderList = [...orders].sort((a, b) => a - b);

        if (orderList[0] !== 1) {
            throw new Error("sequence_order must start at 1");
        }

        for (let i = 1; i < orderList.length; i++) {
            if (orderList[i] !== orderList[i - 1] + 1) {
                throw new Error("sequence_order must be continuous (1,2,3...)");
            }
        }
        
        if (radius || center_lat || center_lon) {
            throw new Error("POLYGON must not include circle fields");
        }
    }

    //-------------------------
    // FINAL NORMALIZATION
    //-------------------------
    return {
        device_id,
        zone_name,
        type,
        schedule_type,
        start_time: toPgTime(start_time),
        duration: duration ?? null,
        days_of_week: days_of_week ? days_of_week.map(Number) : null,
        days_of_month: days_of_month ? days_of_month.map(Number) : null,
        specific_date: specific_date || null,
        radius: type === "CIRCLE" ? radius : null,
        center_lat: type === "CIRCLE" ? center_lat : null,
        center_lon: type === "CIRCLE" ? center_lon : null,
        points: type === "POLYGON" ? points : null
    };
}

module.exports = { validateZone };