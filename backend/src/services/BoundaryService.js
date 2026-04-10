const DeviceModel = require('../models/DeviceModel');
const BoundaryModel = require('../models/BoundaryModel');
const { DateTime } = require('luxon');
const turf = require('@turf/turf');

// --------------------
// HELPERS
// --------------------

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
    const aE = aS + aDur;

    const bS = toMinutes(bStart);
    const bE = bS + bDur;

    return Math.max(aS, bS) < Math.min(aE, bE);
};

// --------------------
// DATETIME
// --------------------

function buildDateTime(date, zone, timezone) {
    const [h, m] = zone.start_time.split(':').map(Number);

    const start = DateTime.fromObject(
        {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: h,
            minute: m
        },
        { zone: timezone } 
    );

    const startMs = start.toUTC().toMillis();
    const durationMs = (zone.duration || 0) * 60000;

    return {
        startMs,
        endMs: startMs + durationMs
    };
}

function generateOccurrences(zone, rangeDays = 30, timezone) {
    const results = [];
    const now = DateTime.now().setZone(timezone);

    if (zone.schedule_type === "ONCE") {
        return [buildDateTime(new Date(zone.specific_date), zone, timezone)];
    }


    for (let i = 0; i < rangeDays; i++) {
        const date = now.plus({ days: i });
        switch (zone.schedule_type) {
            case "ALWAYS":
            case "DAILY":
                results.push(buildDateTime(date.toJSDate(), zone, timezone));
                break;

            case "WEEKLY":
                if (zone.days_of_week.includes(date.weekday % 7)) {
                    results.push(buildDateTime(date.toJSDate(), zone, timezone));
                }
                break;

            case "MONTHLY":
                if (zone.days_of_month.includes(date.day)) {
                    results.push(buildDateTime(date.toJSDate(), zone, timezone));
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
                console.log(zone);
                return true;
            }
            if (zone.schedule_type === "WEEKLY") {
                if (hasArrayOverlap(zone.days_of_week, newZone.days_of_week)) {
                console.log(zone);
                return true;
            }
            }

            if (zone.schedule_type === "MONTHLY") {
                if (hasArrayOverlap(zone.days_of_month, newZone.days_of_month)) {
                console.log(zone);
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

// --------------------
// SERVICE
// --------------------

const BoundaryService = {

    async createZone(data) {
        const {
            device_id,
            type,
            radius,
            points,
            specific_date
        } = data;

        // ===== DEVICE =====
        const device = await DeviceModel.findbyID(device_id);
        if (!device) throw new Error("Device not found");
        if (device.status === "INACTIVE") throw new Error("Device inactive");

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
        return await BoundaryModel.create(data);
    }

};

module.exports = BoundaryService;
