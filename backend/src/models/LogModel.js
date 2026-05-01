const { sql } = require('../database/connection');

class Log {
    static async create(logData, zone_id = null, zone_name = null, boundary_status=null) {
        const { device_id, timestamp, latitude, longitude, accuracy, speed, heading, altitude, odometer, battery_level, activity_type } = logData;
        
        const [result] = await sql`
            INSERT INTO device_logs (
                device_id, timestamp, latitude, longitude, accuracy, 
                speed, heading, altitude, odometer, battery_level, activity_type, zone_id, zone_name, boundary_status
            ) VALUES (
                ${device_id}, ${timestamp}, ${latitude}, ${longitude}, ${accuracy}, 
                ${speed}, ${heading}, ${altitude}, ${odometer}, ${battery_level}, ${activity_type}, ${zone_id}, ${zone_name}, ${boundary_status}
            )
            RETURNING log_id;
        `;

        return result.log_id;
    }
    static async getLatestbyID(device_id) {        
        const [result] = await sql`
            SELECT *
            FROM device_logs
            WHERE device_id = ${device_id}
            ORDER BY timestamp DESC
            LIMIT 1
        `;

        return result;
    }

    static async getLatestbyTimeStamp(device_id, timestamp) {        
        const [result] = await sql`
            SELECT *
            FROM device_logs
            WHERE device_id = ${device_id} and timestamp < ${timestamp}
            ORDER BY timestamp DESC
            LIMIT 1
        `;

        return result;
    }
    static async getLogsByDevice(device_id, limit = 20, cursor = null) {
        let query;

        if (cursor) {
            query = sql`
                SELECT *
                FROM device_logs
                WHERE device_id = ${device_id}
                AND timestamp < ${cursor}
                ORDER BY timestamp DESC
                LIMIT ${limit}
            `;
        } else {
            query = sql`
                SELECT *
                FROM device_logs
                WHERE device_id = ${device_id}
                ORDER BY timestamp DESC
                LIMIT ${limit}
            `;
        }

        const results = await query;
        return results;
    }


}

module.exports = Log;
