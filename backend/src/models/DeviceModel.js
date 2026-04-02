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
}



module.exports = Device;
