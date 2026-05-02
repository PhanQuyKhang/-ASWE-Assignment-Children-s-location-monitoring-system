import { useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { bootstrapOneSignal, syncOneSignalExternalId } from '../lib/oneSignalUser';

export default function OneSignalUserSync() {
  const { user, loading } = useAuth();

  useEffect(() => {
    bootstrapOneSignal();
  }, []);

  useEffect(() => {
    if (loading) return;
    syncOneSignalExternalId(user?.user_id ?? null);
  }, [loading, user?.user_id]);

  return null;
}
