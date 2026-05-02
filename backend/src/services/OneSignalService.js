/**
 * OneSignal REST API — push to web subscribers identified by External ID (matches SDK OneSignal.login).
 * @see https://documentation.onesignal.com/reference/push-notification
 */

const ONESIGNAL_API = 'https://api.onesignal.com/notifications';

function isConfigured() {
  return Boolean(process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_REST_API_KEY);
}

/**
 * @param {object} opts
 * @param {string|number} opts.externalUserId - Same as CLMS users.user_id (stringified for OneSignal)
 * @param {string} opts.title
 * @param {string} opts.body
 * @param {string} [opts.webUrl]
 * @param {Record<string, string>} [opts.data]
 */
async function sendPushToExternalUser({
  externalUserId,
  title,
  body,
  webUrl,
  data,
}) {
  if (!isConfigured()) {
    return { skipped: true, reason: 'OneSignal not configured' };
  }

  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  const payload = {
    app_id: appId,
    target_channel: 'push',
    include_aliases: {
      external_id: [String(externalUserId)],
    },
    headings: { en: title },
    contents: { en: body },
  };

  if (webUrl) {
    payload.web_url = webUrl;
  }
  if (data && typeof data === 'object') {
    payload.data = data;
  }

  const res = await fetch(ONESIGNAL_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.errors?.[0] || json?.error || res.statusText;
    console.error('[OneSignal] Push failed:', msg, json);
    return { ok: false, error: msg, body: json };
  }

  return { ok: true, body: json };
}

module.exports = { sendPushToExternalUser, isConfigured };
