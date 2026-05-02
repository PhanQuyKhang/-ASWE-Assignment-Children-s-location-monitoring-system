/**
 * Bridges CLMS LocalMegaphone alert events to OneSignal web push.
 * Loaded from app.js so listeners attach at startup.
 */
const LocalMegaphone = require('./LocalMegaphone');
const { sendPushToExternalUser, isConfigured } = require('./OneSignalService');

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

function dashboardMapUrl() {
  return `${FRONTEND.replace(/\/$/, '')}/dashboard/map`;
}

function mapsLink(lat, lon) {
  if (lat == null || lon == null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

if (isConfigured()) {
  LocalMegaphone.on('DEVICE_OUT_ZONE', async (event) => {
    try {
      const { user_id, child_name, zone_name, latitude, longitude } = event;
      if (user_id == null) return;
      await sendPushToExternalUser({
        externalUserId: user_id,
        title: 'CLMS: Child left safe zone',
        body: `${child_name || 'Child'} left ${zone_name || 'a safe zone'}.`,
        webUrl: dashboardMapUrl(),
        data: {
          type: 'EXIT',
          device_id: String(event.device_id || ''),
          zone_id: event.zone_id != null ? String(event.zone_id) : '',
        },
      });
    } catch (err) {
      console.error('[OneSignal] DEVICE_OUT_ZONE:', err.message);
    }
  });

  LocalMegaphone.on('DEVICE_ENTER_ZONE', async (event) => {
    try {
      const { user_id, child_name, zone_name } = event;
      if (user_id == null) return;
      await sendPushToExternalUser({
        externalUserId: user_id,
        title: 'CLMS: Back in safe zone',
        body: `${child_name || 'Child'} entered ${zone_name || 'a safe zone'}.`,
        webUrl: dashboardMapUrl(),
        data: {
          type: 'ENTER',
          device_id: String(event.device_id || ''),
        },
      });
    } catch (err) {
      console.error('[OneSignal] DEVICE_ENTER_ZONE:', err.message);
    }
  });

  LocalMegaphone.on('DEVICE_LOST_SIGNAL', async (event) => {
    try {
      const { user_id, child_name, latitude, longitude } = event;
      if (user_id == null) return;
      const url = mapsLink(latitude, longitude) || dashboardMapUrl();
      await sendPushToExternalUser({
        externalUserId: user_id,
        title: 'CLMS: Device offline',
        body: `Lost signal from ${child_name || "child's device"}. Last known location may be stale.`,
        webUrl: url,
        data: {
          type: 'OUT_OF_SIGNAL',
          device_id: String(event.device_id || ''),
        },
      });
    } catch (err) {
      console.error('[OneSignal] DEVICE_LOST_SIGNAL:', err.message);
    }
  });
}

module.exports = {};
