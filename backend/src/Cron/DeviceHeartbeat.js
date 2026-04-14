const cron = require("node-cron");
const { sql } = require('../database/connection');
const LocalMegaphone = require('../services/LocalMegaphone');

function startHeartbeatMonitor() {
  // chạy mỗi phút
  cron.schedule("*/30 * * * * *", async () => {
    try {
      const updatedDevices = await sql`
        UPDATE devices
        SET status = 'NOSIGNAL'
        WHERE now() - last_updated > interval '90 seconds'
          AND status = 'ACTIVE'
        RETURNING *;
      `;

      if (updatedDevices.length > 0) {
        console.log(`[Heartbeat Monitor] ${updatedDevices.length} device(s) went offline.`);

        // tạo alert OUT_OF_SIGNAL cho từng device
        for (const device of updatedDevices) {
          LocalMegaphone.emit('DEVICE_LOST_SIGNAL', {
              device_id: device.device_id,
              user_id: device.user_id,
              child_name: device.child_name,
              latitude: device.last_lat,
              longitude: device.last_lon,
              boundary_status: device.boundary_status,
              last_update: device.boundary_status,
              timezone: device.timezone
          });
        }
      }

    } catch (error) {
      console.error("[Heartbeat Monitor] Database error:", error.message);
    }
  });

  console.log("Heartbeat monitor started");
}

module.exports = startHeartbeatMonitor;