const { sql } = require('../database/connection');

class Device {
    static async findbyID(device_id) {
        const [result] = await sql`
            SELECT *
            FROM devices
            WHERE device_id = ${device_id}
        `;

        return result || null;
    }
    static async updateDevice(data) {
        const {timestamp, latitude, longitude, device_id} = data;
        console.log(data);
        const [result] = await sql`
            UPDATE devices
            SET 
                last_lat = ${latitude}, 
                last_lon = ${longitude}
            WHERE device_id = ${device_id} 
            AND status != 'INACTIVE'
            RETURNING *;
        `;

        return result || null;
    }
    static async statusbyID(device_id) {
        const [result] = await sql`
            SELECT status
            FROM devices 
            WHERE device_id = ${device_id}
        `;

        return result || null;
    }

    static async addDevice(data) {
        const { deviceId, userId, childName } = data;
        
        // Execute the insert query using Neon serverless sql template
        const [result] = await sql`
            INSERT INTO devices (device_id, user_id, child_name)
            VALUES (${deviceId}, ${userId}, ${childName})
            RETURNING *;
        `;
        return result || null;
    }
}



module.exports = Device;
