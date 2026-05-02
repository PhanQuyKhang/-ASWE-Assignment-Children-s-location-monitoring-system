/**
 * OneSignal REST API: send web push to a parent by External User ID
 * (set in the web app via OneSignal.login(String(user_id))).
 * Docs: https://documentation.onesignal.com/reference/create-notification
 */

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

async function sendParentAlertPush(userId, { title, message, url } = {}) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    return { skipped: true, reason: 'OneSignal not configured' };
  }
  if (userId == null || !title) {
    return { skipped: true, reason: 'missing userId or title' };
  }

  const externalId = String(userId);

  /** OneSignal REST API (current docs): target by External ID via include_aliases + target_channel. */
  const body = {
    app_id: ONESIGNAL_APP_ID,
    target_channel: 'push',
    include_aliases: {
      external_id: [externalId],
    },
    headings: { en: title },
    contents: { en: message || '' },
    url: url || `${FRONTEND_URL.replace(/\/$/, '')}/dashboard`,
  };

  const res = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    console.error('[OneSignal] Push failed:', res.status, json);
    return { ok: false, status: res.status, body: json };
  }

  if (!json?.id) {
    console.warn(
      '[OneSignal] Request accepted but no message id — often means no web push subscription for this external_id. Check dashboard subscribers and browser permission.'
    );
  }

  return { ok: true, body: json };
}

module.exports = { sendParentAlertPush };
