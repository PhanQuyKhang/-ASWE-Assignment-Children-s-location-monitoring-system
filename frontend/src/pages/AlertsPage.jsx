import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import useAuth from '../hooks/useAuth';
import { getAllUserAlertsPaged, markAlertRead } from '../services/alertService';

function mapsLink(lat, lon) {
  if (lat == null || lon == null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

export default function AlertsPage() {
  const { user } = useAuth();
  const ctx = useOutletContext();
  const clearNeedsAttention = ctx?.clearNeedsAttention;

  const [rows, setRows] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    clearNeedsAttention?.();
  }, [clearNeedsAttention]);

  async function loadInitial() {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const res = await getAllUserAlertsPaged({ limit: 30 });
      if (res.success) {
        setRows(res.data || []);
        setNextCursor(res.nextCursor || null);
      }
    } catch {
      toast.error('Could not load alerts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load on user id only
  }, [user?.user_id]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getAllUserAlertsPaged({ limit: 30, cursor: nextCursor });
      if (res.success) {
        setRows((prev) => [...prev, ...(res.data || [])]);
        setNextCursor(res.nextCursor || null);
      }
    } catch {
      toast.error('Could not load more');
    } finally {
      setLoadingMore(false);
    }
  }

  async function onMarkRead(alertId, isRead) {
    if (isRead) return;
    try {
      await markAlertRead(alertId);
      setRows((prev) =>
        prev.map((r) => (r.alert_id === alertId ? { ...r, is_read: true } : r))
      );
    } catch {
      toast.error('Could not update alert');
    }
  }

  return (
    <article className="card dashboard-card">
      <div className="mini-card-label">Alert history</div>
      <p className="text-sm text-gray-600 mb-4">
        Newest first. Mark rows as read when you have reviewed them. Push notifications are also sent
        via OneSignal when you allow browser notifications.
      </p>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-600">No alerts yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                <th className="py-2 pr-2">Time</th>
                <th className="py-2 pr-2">Child</th>
                <th className="py-2 pr-2">Type</th>
                <th className="py-2 pr-2">Message</th>
                <th className="py-2 pr-2">Location</th>
                <th className="py-2 pr-2">Read</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const link = mapsLink(r.trigger_lat, r.trigger_lon);
                return (
                  <tr key={r.alert_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td className="py-2 pr-2 whitespace-nowrap">{r.created_at}</td>
                    <td className="py-2 pr-2">{r.child_name || '—'}</td>
                    <td className="py-2 pr-2">{r.alert_type}</td>
                    <td className="py-2 pr-2 max-w-xs">{r.message}</td>
                    <td className="py-2 pr-2">
                      {link ? (
                        <a href={link} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                          Map
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {r.is_read ? (
                        'Yes'
                      ) : (
                        <button
                          type="button"
                          className="text-blue-600 underline font-semibold"
                          onClick={() => onMarkRead(r.alert_id, r.is_read)}
                        >
                          Mark read
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {nextCursor ? (
        <button
          type="button"
          className="btn btn-ghost mt-4"
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      ) : null}
    </article>
  );
}
