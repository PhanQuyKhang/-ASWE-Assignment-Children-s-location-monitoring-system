import { useEffect } from 'react';
import useAuth from '../hooks/useAuth';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

function isLocalhost() {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

/**
 * Web push: init OneSignal (v16) and set External User ID to the CLMS user_id
 * so the backend can target parents with include_external_user_ids.
 * @see https://documentation.onesignal.com/docs/en/web-sdk-setup
 */
export default function OneSignalBridge() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!ONESIGNAL_APP_ID) return;
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal) {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: isLocalhost(),
      });
    });
  }, []);

  useEffect(() => {
    if (!ONESIGNAL_APP_ID || loading) return;
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal) {
      if (user?.user_id) {
        try {
          await OneSignal.Notifications.requestPermission();
        } catch {
          /* user dismissed or unsupported */
        }
        await OneSignal.login(String(user.user_id));
      } else {
        await OneSignal.logout();
      }
    });
  }, [user?.user_id, loading]);

  return null;
}
