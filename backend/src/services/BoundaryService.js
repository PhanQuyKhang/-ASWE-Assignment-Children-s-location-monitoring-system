// backend/src/services/BoundaryService.js
const { sql } = require('../database/connection');

const createPolygonZone = async (deviceId, zoneName, points) => {
    try {
        // Sử dụng Transaction (ngầm định trong Neon serverless nếu chạy các lệnh liên tiếp)
        // 1. Chèn thông tin Zone vào bảng 'zones'
        const [zone] = await sql`
            INSERT INTO zones (device_id, zone_name, type, is_active)
            VALUES (${deviceId}, ${zoneName}, 'POLYGON', true)
            RETURNING zone_id
        `;

        const zoneId = zone.zone_id;

        // 2. Chèn các đỉnh vào bảng 'poly_points' theo đúng thứ tự
        for (let i = 0; i < points.length; i++) {
            await sql`
                INSERT INTO poly_points (zone_id, sequence_order, latitude, longitude)
                VALUES (${zoneId}, ${i}, ${points[i].lat}, ${points[i].lng})
            `;
        }

        return { success: true, zoneId };
    } catch (error) {
        console.error("Lỗi trong BoundaryService:", error);
        throw error;
    }
};

module.exports = { createPolygonZone };