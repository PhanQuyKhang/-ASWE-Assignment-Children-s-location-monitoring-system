const cron = require("node-cron");
const { sql } = require('../database/connection');

function startHeartbeatMonitor() {
  cron.schedule("* * * * *", async () => {
    try {
      const updatedDevices = await sql`
        UPDATE device
        SET status = "NOSIGNAL"
        WHERE now() - last_updated > interval '2 minutes'
        AND status = "ACTIVE"
        RETURNING id;
      `;

      if (updatedDevices.length > 0) {
        console.log(`[Heartbeat Monitor] ${updatedDevices.length} device(s) went offline.`);

        //later on: call AlertService here 
      }

    } catch (error) {
      console.error("[Heartbeat Monitor] Database error:", error.message);
    }
  });

  console.log("Heartbeat monitor started");
}

module.exports = startHeartbeatMonitor;