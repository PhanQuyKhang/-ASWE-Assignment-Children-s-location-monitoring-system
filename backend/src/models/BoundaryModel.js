const { sql } = require('../database/connection');

class Boundary {

    // =============================
    // CREATE ZONE (CIRCLE / POLYGON)
    // =============================
    static async create(data) {
        const {
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

        await sql`BEGIN`;

        try {
            const [zone] = await sql`
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

            if (type === "CIRCLE") {
                await sql`
                    INSERT INTO circles (
                        zone_id,
                        center_lat,
                        center_lon,
                        radius
                    ) VALUES (
                        ${zone.zone_id},
                        ${center_lat},
                        ${center_lon},
                        ${radius}
                    );
                `;
            }
            else {
                const values = points.map(p => [
                    zone.zone_id,
                    p.sequence_order,
                    p.latitude,
                    p.longitude
                ]);

                await sql`
                    INSERT INTO poly_points (
                        zone_id,
                        sequence_order,
                        latitude,
                        longitude
                    ) VALUES ${sql(values)};
                `;
            }

            await sql`COMMIT`;
            return zone;

        } catch (error) {
            await sql`ROLLBACK`;
            console.error("Transaction failed:", error.message);
            throw error;
        }
    }

    // =============================
    // GET ACTIVE ZONES
    // =============================
    static async getActiveZones(deviceID) {
        try {
            if (!deviceID) {
                throw new Error("deviceID is required");
            }

            const rows = await sql`
                SELECT * 
                FROM zones 
                WHERE device_id = ${deviceID}
                AND is_active = true
            `;

            if (!rows || rows.length === 0) {
                console.log(`No active zones found for device: ${deviceID}`);
                return [];
            }

            return rows;

        } catch (error) {
            console.error("❌ DB Error in getActiveZones:", error.message);
            throw error;
        }
    }
}

module.exports = Boundary;