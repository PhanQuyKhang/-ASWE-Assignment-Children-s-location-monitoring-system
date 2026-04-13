const { sql } = require('../database/connection');

class Log {
    static async create(logData) {
        const { device_id, timestamp, latitude, longitude, accuracy, speed, heading, altitude, odometer, battery_level, activity_type } = logData;
        
        const [result] = await sql`
            INSERT INTO device_logs (
                device_id, timestamp, latitude, longitude, accuracy, 
                speed, heading, altitude, odometer, battery_level, activity_type
            ) VALUES (
                ${device_id}, ${timestamp}, ${latitude}, ${longitude}, ${accuracy}, 
                ${speed}, ${heading}, ${altitude}, ${odometer}, ${battery_level}, ${activity_type}
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

}

module.exports = Log;
