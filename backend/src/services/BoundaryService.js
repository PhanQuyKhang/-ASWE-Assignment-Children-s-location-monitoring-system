const DeviceModel = require('../models/DeviceModel');
const BoundaryModel = require('../models/BoundaryModel');
const { DateTime } = require('luxon');
const turf = require('@turf/turf');

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
function checkCircleZonebyMath(center_point, longitude, latitude ) {
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

function checkPolygonZonebyMath(points, longitude, latitude) {
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

        // Multiple safe zones per child (circle and/or polygon) are allowed, including several
        // "ALWAYS" zones — overlap checks were blocking a second zone; scheduling is per-zone at check time.

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
        const { device_id, timestamp, latitude, longitude, battery_level, activity_type, isOlder, timezone, device} = log;
        // ===== DEVICE =====
        const zones = await BoundaryModel.getZonesbyDevice(device_id);
        if (!zones || zones.length === 0) return;
        
        const location = turf.point([longitude, latitude]);
        let fallbackZone = null;
        for (const zone of zones) {
            if (!zone.is_active) continue;
            if (!isNowInSchedule(zone, timestamp, device.timezone)) {
                continue;
            }
            if (!fallbackZone) fallbackZone = zone;
            let test_1 = false;
            let test_2 = false;
            if (zone.type == "CIRCLE") {
                const { center_lat, center_lon } = zone;
                if (!center_lat || !center_lon) {
                    throw new Error("Can not find information about zone");
                }
                test_1 = checkCircleZonebyMath(zone, longitude, latitude);
                if (test_1 == false) {
                    test_2 = checkCircleZonebyTurf(zone, location);
                }
            } else if (zone.type == "POLYGON") {
                const { points } = zone;
                if (!points || points.length === 0) {
                    throw new Error("Can not find information about zone");
                }
                test_1 = checkPolygonZonebyMath(points, longitude, latitude);
                if (test_1 == false) {
                    test_2 = checkPolygonZonebyTurf(points, location);
                }
            }
            if (test_1 || test_2) {
                return { zone_id: zone.zone_id, zone_name: zone.zone_name, boundary_status: "INSIDE" };
            }
        }
        if (fallbackZone) {
            return {
                zone_id: fallbackZone.zone_id,
                zone_name: fallbackZone.zone_name,
                boundary_status: "OUTSIDE",
            };
        }
        return null; 
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
        const devices = await DeviceModel.getActiveDevices(user_id);
        let result = [];
        for (const device of devices){
            const zones = await BoundaryModel.getZonesbyDevice(device.device_id);
            result.push(...zones);
        }
        return result;
    },
    async deleteZone(user_id, zone_id) {
        if (!zone_id) {
            throw new Error("zone_id is required");
        }

        const zone = await BoundaryModel.getZonebyID(zone_id);

        if (!zone) {
            throw new Error("Zone not found");
        }

        const device = await DeviceModel.findbyID(zone.device_id);

        if (!device || device.user_id !== user_id) {
            throw new Error("Unauthorized: cannot delete this zone");
        }

        return await BoundaryModel.deleteZonebyID(zone_id);
    },

    async updateZone(user_id, zone_id, data) {
        if (!zone_id) {
            throw new Error("zone_id is required");
        }

        const existing = await BoundaryModel.getZonebyID(zone_id);
        if (!existing) {
            throw new Error("Zone not found");
        }

        const device = await DeviceModel.findbyID(existing.device_id);
        if (!device) {
            throw new Error("Device not found");
        }
        if (device.user_id !== user_id) {
            throw new Error("Unauthorized: cannot update this zone");
        }
        if (device.status === "INACTIVE") {
            throw new Error("Device inactive");
        }

        if (existing.type !== data.type) {
            throw new Error("Cannot change zone type; delete and create a new zone");
        }

        const { specific_date } = data;
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

        if (data.type === "CIRCLE") {
            if (data.radius < 3) {
                throw new Error("Radius must be >= 3 meters");
            }
        } else {
            validatePolygon(data.points);
        }

        return await BoundaryModel.updateZone(zone_id, data);
    }
};

module.exports = BoundaryService;
