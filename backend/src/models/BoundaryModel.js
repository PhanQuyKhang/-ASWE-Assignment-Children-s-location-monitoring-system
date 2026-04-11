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

    // =============================
    // GET ACTIVE ZONES
    // =============================
    static async getActiveZones(device_id) {
        try {
            if (!device_id) {
                throw new Error("deviceID is required");
            }

            const rows = await sql`
                SELECT * 
                FROM zones 
                WHERE device_id = ${device_id}
                AND is_active = true
            `;

            if (!rows || rows.length === 0) {
                console.log(`No active zones found for device: ${device_id}`);
                return [];
            }

            return rows;

        } catch (error) {
            console.error("❌ DB Error in getActiveZones:", error.message);
            throw error;
        }
    }

    static async getCircleZone(zone_id) {
        try {
            if (!zone_id) {
                throw new Error("zone_id is required");
            }

            const rows = await sql`
                SELECT * 
                FROM circles 
                WHERE zone_id = ${zone_id}
            `;

            if (!rows || rows.length === 0) {
                console.log(`No circle zone found for zone: ${zone_id}`);
                return [];
            }

            return rows;

        } catch (error) {
            console.error("❌ DB Error in getCircleZone:", error.message);
            throw error;
        }
    }
    static async getPolygonZone(zone_id) {
        try {
            if (!zone_id) {
                throw new Error("zone_id is required");
            }

            const rows = await sql`
                SELECT * 
                FROM poly_points 
                WHERE zone_id = ${zone_id}
            `;

            if (!rows || rows.length === 0) {
                console.log(`No polygon zone found for zone: ${zone_id}`);
                return [];
            }

            return rows;

        } catch (error) {
            console.error("❌ DB Error in getPolygonZone:", error.message);
            throw error;
        }
    }
    

}

module.exports = Boundary;