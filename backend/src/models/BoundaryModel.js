const { sql } = require('../database/connection');

class Boundary {

    // =============================
    // CREATE ZONE (CIRCLE / POLYGON)
    // =============================
    static async create(data, device_id) {
        const {
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

        return sql.begin(async tx => {
            // Insert zone
            const [zone] = await tx`
            INSERT INTO zones (
                device_id, zone_name, type, schedule_type,
                start_time, duration,
                days_of_week,
                days_of_month,
                specific_date
            ) VALUES (
                ${device_id},
                ${zone_name},
                ${type},
                ${schedule_type},
                ${start_time},
                ${duration},
                ${days_of_week},
                ${days_of_month},
                ${specific_date}
            )
            RETURNING *;
            `;

            if (!zone) {
            throw new Error("Failed to create zone");
            }

            // Insert geometry depending on type
            if (type === "CIRCLE") {
            await tx`
                INSERT INTO circles (
                zone_id, center_lat, center_lon, radius
                ) VALUES (
                ${zone.zone_id},
                ${center_lat},
                ${center_lon},
                ${radius}
                );
            `;
            } else {
            for (const p of points) {
                await tx`
                INSERT INTO poly_points (
                    zone_id, sequence_order, latitude, longitude
                ) VALUES (
                    ${zone.zone_id},
                    ${p.sequence_order},
                    ${p.latitude},
                    ${p.longitude}
                );
                `;
            }
            }

            return zone;
        });
    }
    //ALL Zone
    static async getZonesbyDevice(device_id) {
        try {
            if (!device_id) {
                throw new Error("deviceID is required");
            }

            const rows = await sql`
                SELECT 
                    z.*,
                    c.center_lat,
                    c.center_lon,
                    c.radius,
                    p.sequence_order,
                    p.latitude,
                    p.longitude
                FROM zones z
                LEFT JOIN circles c ON z.zone_id = c.zone_id
                LEFT JOIN poly_points p ON z.zone_id = p.zone_id
                WHERE z.device_id = ${device_id}
                ORDER BY z.is_active DESC, z.zone_id, p.sequence_order
            `;

            if (!rows || rows.length === 0) {
                return [];
            }

            const zoneMap = {};

            for (const row of rows) {
                if (!zoneMap[row.zone_id]) {
                    zoneMap[row.zone_id] = {
                        zone_id: row.zone_id,
                        device_id: row.device_id,
                        zone_name: row.zone_name,
                        type: row.type,
                        is_active: row.is_active,
                        schedule_type: row.schedule_type,
                        start_time: row.start_time,
                        days_of_week: row.days_of_week,
                        days_of_month: row.days_of_month,
                        specific_date: row.specific_date,
                        duration: row.duration,

                        // circle
                        center_lat: row.center_lat,
                        center_lon: row.center_lon,
                        radius: row.radius,

                        // polygon
                        points: []
                    };
                }

                // collect polygon points
                if (row.type === "POLYGON" && row.latitude && row.longitude) {
                    zoneMap[row.zone_id].points.push({
                        latitude: row.latitude,
                        longitude: row.longitude,
                        sequence_order: row.sequence_order
                    });
                }
            }

            return Object.values(zoneMap);

        } catch (error) {
            console.error("❌ DB Error in getZones:", error.message);
            throw error;
        }
    }
    static async getZonebyID(zone_id) {
        try {
            if (!zone_id) {
                throw new Error("zoneID is required");
            }

            const  [zone]  = await sql`
                SELECT *
                FROM zones
                WHERE zone_id = ${zone_id}
            `;

            return zone || null;
        } catch (error) {
            console.error("❌ DB Error in getZones:", error.message);
            throw error;
        }
    }
    static async deleteZonebyID(zone_id) {
        try {
            if (!zone_id) {
                throw new Error("zoneID is required");
            }

            const res = await sql`
                DELETE
                FROM zones
                WHERE zone_id = ${zone_id}
                RETURNING zone_id;
            `;

            return res || null;
        } catch (error) {
            console.error("❌ DB Error in getZones:", error.message);
            throw error;
        }
    }
    
    

}

module.exports = Boundary;