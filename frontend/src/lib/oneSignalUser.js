/**
 * OneSignal Web SDK v16 — identify parent user for server-side push (include_aliases.external_id).
 * @see https://documentation.onesignal.com/docs/en/web-sdk-setup
 */

let initQueued = false;

function loadSdkScript() {
  if (document.querySelector('script[data-clms-onesignal]')) return;
  const s = document.createElement('script');
  s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
  s.defer = true;
  s.dataset.clmsOnesignal = '1';
  document.head.appendChild(s);
}

export function bootstrapOneSignal() {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
  if (!appId || initQueued) return;
  initQueued = true;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init({
      appId,
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerPath: 'OneSignalSDKWorker.js',
    });
  });
  loadSdkScript();
}

/**
 * @param {number|string|null} userId - CLMS users.user_id; null on logout
 */
export async function syncOneSignalExternalId(userId) {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
  if (!appId) return;

  const run = async (OneSignal) => {
    if (userId != null) {
      await OneSignal.login(String(userId));
    } else {
      await OneSignal.logout();
    }
  };

  if (typeof window.OneSignal !== 'undefined' && window.OneSignal.login) {
    await run(window.OneSignal);
    return;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(run);
  loadSdkScript();
}
