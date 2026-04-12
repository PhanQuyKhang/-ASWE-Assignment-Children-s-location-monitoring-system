const DeviceModel = require('../models/DeviceModel');
const BoundaryModel = require('../models/BoundaryModel');
const { DateTime } = require('luxon');
const turf = require('@turf/turf');
const LocalMegaphone = require('../services/LocalMegaphone');

// --------------------
// HELPERS
// --------------------
//
const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

const hasArrayOverlap = (a, b) => {
    if (!a || !b) return false;

    const setB = new Set(b.map(Number));
    return a.map(Number).some(x => setB.has(x));
};

const hasTimeOverlap = (aStart, aDur, bStart, bDur) => {
    const aS = toMinutes(aStart);
    const bS = toMinutes(bStart);

    const aD = Number(aDur);
    const bD = Number(bDur);

    if (aS < bS){
        const distance = 1440 - bS + aS;
        if (bD <= distance && aD + aS <= bS) return false;
    }
    if (aS > bS){
        const distance = 1440 - aS + bS;
        if (aD <= distance && bD + bS <= aS) return false;
    }

    return true;
};

// --------------------
// DATETIME
// --------------------

function buildDateTime(date, zone, timezone) {
    const [h, m] = zone.start_time.split(':').map(Number);

    const start = date.set({ 
        hour: h, 
        minute: m,
        second: 0,
        millisecond: 0
    });

    const startMs = start.toUTC().toMillis();
    const durationMs = (zone.duration || 0) * 60000;

    return {
        startMs,
        endMs: startMs + durationMs
    };
}

function generateOccurrences(zone, rangeDays = 30, timezone, baseDate = new Date()) {   
    const results = [];
    const now = DateTime.fromJSDate(baseDate).setZone(timezone);

    if (zone.schedule_type === "ONCE") {
        const specificDate = DateTime.fromISO(zone.specific_date, { zone: timezone });
        return [buildDateTime(specificDate, zone, timezone)];
    }


    for (let i = 0; i < rangeDays; i++) {
        const date = now.plus({ days: i });
        switch (zone.schedule_type) {
            case "ALWAYS":
            case "DAILY":
                results.push(buildDateTime(date, zone, timezone));
                break;

            case "WEEKLY":
                if (zone.days_of_week.includes(date.weekday % 7)) {
                    results.push(buildDateTime(date, zone, timezone));
                }
                break;

            case "MONTHLY":
                if (zone.days_of_month.includes(date.day)) {
                    results.push(buildDateTime(date, zone, timezone));
                }
                break;
        }
    }

    return results;
}

// --------------------
// SCHEDULE OVERLAP
// --------------------

function hasScheduleOverlap(newZone, activeZones, timezone) {
    // FAST PATH
    if (newZone.schedule_type === "ALWAYS" && activeZones.length) return true;

    for (const zone of activeZones) {
        if (zone.schedule_type === "ALWAYS") return true;

        if (!hasTimeOverlap(newZone.start_time, newZone.duration, zone.start_time, zone.duration)) {
            continue;
        }

        // SAME TYPE QUICK CHECK
        if (zone.schedule_type === newZone.schedule_type) {
            if (zone.schedule_type === "DAILY") {
                return true;
            }
            if (zone.schedule_type === "WEEKLY") {
                if (hasArrayOverlap(zone.days_of_week, newZone.days_of_week)) {
                return true;
            }
            }

            if (zone.schedule_type === "MONTHLY") {
                if (hasArrayOverlap(zone.days_of_month, newZone.days_of_month)) {
                return true;
            }
            }
        }
    }


    // FALLBACK (accurate)
    const newOcc = generateOccurrences(newZone, 30, timezone);
    for (const zone of activeZones) {
        const existingOcc = generateOccurrences(zone, 30, timezone);
        for (const a of newOcc) {
            for (const b of existingOcc) {
                if (a.startMs < b.endMs && b.startMs < a.endMs) {
                    console.log(zone);
                    return true;
                }
            }
        }
    }

    return false;
}

// --------------------
// POLYGON VALIDATION
// --------------------

function validatePolygon(points) {
    const coords = points.map(p => [
        p.longitude,
        p.latitude
    ]);

    if (coords[0][0] !== coords.at(-1)[0] || coords[0][1] !== coords.at(-1)[1]) {
        coords.push(coords[0]);
    }

    const polygon = turf.polygon([coords]);

    const kinks = turf.kinks(polygon);
    if (kinks.features.length) {
        throw new Error("Polygon has self-intersections");
    }

    const area = turf.area(polygon);
    if (area < 4) {
        throw new Error("Polygon too small");
    }

    return polygon;
}


function checkCircleZonebyTurf(center_point, location){
    const center = [center_point.center_lon, center_point.center_lat];
    const options = {steps: Math.min(center_point.radius*100, 128), units: "meters", properties: { foo: "bar" } };
    const polygon = turf.circle(center, center_point.radius, options);
    return turf.booleanPointInPolygon(location, polygon);
}
function checkCircleZonebyMath(center_point, latitude, longitude ) {
  const toRad = (deg) => deg * Math.PI / 180;

  const R = 6371000; 

  const dLat = toRad(latitude - center_point.center_lat);
  const dLon = toRad(longitude - center_point.center_lon);

  const lat1 = toRad(center_point.center_lat);
  const lat2 = toRad(latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 *
    Math.cos(lat1) *
    Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  return distance <= center_point.radius;
}
function checkPolygonZonebyTurf(points, location){
    const sorted = [...points].sort((a, b) => a.sequence_order - b.sequence_order);

    const coords = sorted.map(p => [
        p.longitude,
        p.latitude
    ]);

    if (coords[0][0] !== coords.at(-1)[0] || coords[0][1] !== coords.at(-1)[1]) {
        coords.push(coords[0]);
    }

    const polygon = turf.polygon([coords]);
    return turf.booleanPointInPolygon(location, polygon);
}

function checkPolygonZonebyMath(points, latitude, longitude) {
    const sorted = [...points].sort((a, b) => a.sequence_order - b.sequence_order);
    const x = longitude;
    const y = latitude;

    let inside = false;

    for (let i = 0, j = sorted.length - 1; i < sorted.length; j = i++) {
        const xi = sorted[i].longitude;
        const yi = sorted[i].latitude;
        const xj = sorted[j].longitude;
        const yj = sorted[j].latitude;

        // --- Boundary check: point on vertex ---
        if ((x === xi && y === yi) || (x === xj && y === yj)) {
            return true;
        }

        // --- Boundary check: point on edge ---
        const cross = (y - yi) * (xj - xi) - (x - xi) * (yj - yi);
        if (Math.abs(cross) < 1e-9) { // nearly collinear
            const minX = Math.min(xi, xj), maxX = Math.max(xi, xj);
            const minY = Math.min(yi, yj), maxY = Math.max(yi, yj);
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                return true;
            }
        }

        const intersect =
        ((yi > y) !== (yj > y)) &&
        (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
}
function isNowInSchedule(zone, timestamp, timezone) {
    if (zone.schedule_type == "ALWAYS") return true;
    
    const logDate = new Date(timestamp);
    const logMs = logDate.getTime(); 
    const baseDate = new Date(logMs - 86400000); //lastday for midnight
    const existingOcc = generateOccurrences(zone, 3, timezone, baseDate); //create for 3 days

    for (const Occ of existingOcc){
        if (Occ.startMs <= logMs && Occ.endMs >= logMs) return true;
    }
    return false;
}

// --------------------
// SERVICE
// --------------------

const BoundaryService = {
    
    async createZone(data, user_id, device_id ) {
        const {
            type,
            radius,
            points,
            specific_date
        } = data;
        console.log(device_id);
        // ===== DEVICE =====
        const device = await DeviceModel.findbyID(device_id);
        if (!device) throw new Error("Device not found");
        if (device.status === "INACTIVE") throw new Error("Device inactive");
        if (device.user_id !== user_id) throw new Error("Unauthorized Action");

        // ===== DATE =====
        if (specific_date) {
            const now = DateTime.now().setZone(device.timezone).startOf('day');
            const dt = DateTime.fromISO(specific_date, { zone: device.timezone }).startOf('day');

            if (!dt.isValid) {
                throw new Error("Invalid specific_date");
            }

            if (dt < now) {
                throw new Error("Date cannot be in the past");
            }
        }

        // ===== EXISTING =====
        const activeZones = await BoundaryModel.getActiveZones(device_id);
        if (activeZones.length > 0){
            // ===== SCHEDULE =====
            if (hasScheduleOverlap(data, activeZones, device.timezone)) {
                throw new Error("Schedule overlap detected");
            }
        }

        // ===== GEOMETRY =====
        if (type === "CIRCLE") {
            if (radius < 3) {
                throw new Error("Radius must be >= 3 meters");
            }
        } else {
            validatePolygon(points);
        }

        // ===== SAVE =====
        return await BoundaryModel.create(data, device_id);
    },

    async check(log) {
        const { device_id, timestamp, latitude, longitude, accuracy, speed, heading, altitude, odometer, battery_level, activity_type } = log;

        // ===== DEVICE =====
        const device = await DeviceModel.findbyID(device_id);
        if (!device) throw new Error("Device not found");
        if (device.status === "INACTIVE") throw new Error("Device inactive");

        const activeZones = await BoundaryModel.getActiveZones(device_id);
        if (!activeZones || activeZones.length === 0) return;
        
        const location = turf.point([longitude, latitude])
        for (const zone of activeZones){
            //Check if in boundary
            let test_1 = false;
            let test_2 = false;
            const {zone_id, schedule_type, start_time, duration, days_of_month, days_of_week} = zone;
            if (zone.type == "CIRCLE"){
                const info = await BoundaryModel.getCircleZone(zone_id);
                if (!info){
                    throw new Error ("Can not find information about zone: ");
                }
                test_1 = checkCircleZonebyMath(info, latitude, longitude);
                if (test_1 == false){
                    test_2 = checkCircleZonebyTurf(info, location);
                }
            } else if (zone.type == "POLYGON"){
                const info = await BoundaryModel.getPolygonZone(zone_id);
                if (!info){
                    throw new Error ("Can not find information about zone: ");
                }
                test_1 = checkPolygonZonebyMath(info, latitude, longitude);
                if (test_1 == false){
                    test_2 = checkPolygonZonebyTurf(info, location);
                }
            }
            if (test_1 || test_2) continue; 

            //Check if in scheduled
            if (isNowInSchedule(zone, timestamp, device.timezone)) { 
                LocalMegaphone.emit('DEVICE_OUT_ZONE', {
                    device_id: device_id,
                    child_name: device.child_name,
                    zone_id: zone.zone_id,
                    zone_name: zone.zone_name,
                    lat: latitude,
                    lon: longitude,
                    battery: battery_level,
                    timestamp: timestamp,
                    activity_type: activity_type
                });
            }
        }
        return;
    },

    async getZonebyDevice(user_id, device_id) {
        const device = await DeviceModel.findbyID(device_id);
        if (!device) throw new Error("Device not found");
        if (device.status === "INACTIVE") throw new Error("Device inactive");
        if (device.user_id !== user_id){
            throw new Error("No authorize to see this device");
        }
        const activeZones = await BoundaryModel.getZonesbyDevice(device_id);
        return activeZones;
    },
    async getZonebyUser(user_id) {
        const activeDevices = await DeviceModel.getActiveDevices(user_id);
        let result = [];

        for (const device in activeDevices){
            const zones = await BoundaryModel.getZonesbyDevice(device.device_id);
            result.push(...zones);
        }
        return result;
    }
};
LocalMegaphone.on('DEVICE_UPDATES', async (event) => {
    try {
        await BoundaryService.check(event);
    } catch (error) {
        console.error("Failed to check boundary of log:", error);
    }
});
module.exports = BoundaryService;
