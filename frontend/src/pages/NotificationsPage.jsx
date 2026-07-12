import { useState, useMemo } from 'react';
import { Bell, CheckCheck, Wrench, CalendarDays, ArrowLeftRight, TrendingUp, Plus, Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const notifIcon = {
  Alert:       <Bell size={15} className="text-amber-500" />,
  Approval:    <TrendingUp size={15} className="text-emerald-500" />,
  Booking:     <CalendarDays size={15} className="text-blue-500" />,
  Maintenance: <Wrench size={15} className="text-amber-500" />,
};

const logIcon = {
  Allocation:   <Activity size={14} className="text-blue-500" />,
  Maintenance:  <Wrench size={14} className="text-amber-500" />,
  Transfer:     <ArrowLeftRight size={14} className="text-violet-500" />,
  Booking:      <CalendarDays size={14} className="text-teal-500" />,
  Approval:     <TrendingUp size={14} className="text-emerald-500" />,
  Registration: <Plus size={14} className="text-slate-500" />,
  Audit:        <ShieldCheck size={14} className="text-slate-500" />,
  Return:       <ArrowLeftRight size={14} className="text-slate-500" />,
  Admin:        <ShieldCheck size={14} className="text-violet-500" />,
};

const timeAgo = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const LOG_CATS = ['All', 'Allocation', 'Maintenance', 'Transfer', 'Booking', 'Approval', 'Registration', 'Audit', 'Admin'];

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const { notifications, activityLogs, markNotificationRead, markAllNotificationsRead } = useAppData();
  const [tab, setTab] = useState('all');
  const [logFilter, setLogFilter] = useState('All');
  const [view, setView] = useState('notifications');

  const myNotifs = useMemo(
    () => notifications.filter(n => n.userId === currentUser.id),
    [notifications, currentUser.id]
  );

  const filteredNotifs = useMemo(() => {
    if (tab === 'all') return myNotifs;
    return myNotifs.filter(n => n.type === tab);
  }, [myNotifs, tab]);

  const filteredLogs = useMemo(() => {
    if (logFilter === 'All') return activityLogs;
    return activityLogs.filter(l => l.type === logFilter);
  }, [activityLogs, logFilter]);

  const unread = myNotifs.filter(n => !n.read).length;

  const notifTabs = [
    { id: 'all',         label: 'All' },
    { id: 'Alert',       label: 'Alerts' },
    { id: 'Approval',    label: 'Approvals' },
    { id: 'Booking',     label: 'Bookings' },
    { id: 'Maintenance', label: 'Maintenance' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Notifications & Logs</h1>
          <p className="text-slate-500 mt-1">
            {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" onClick={() => markAllNotificationsRead(currentUser.id)}>
            <CheckCheck size={14} className="mr-1.5" />Mark all read
          </Button>
        )}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
        {[
          { id: 'notifications', label: 'Notifications' },
          { id: 'auditlog',      label: 'System Audit Log' },
        ].map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all
              ${view === v.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* ── Notifications ── */}
      {view === 'notifications' && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            {notifTabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Card>
            {filteredNotifs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p>No notifications in this category</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {filteredNotifs.map(n => (
                  <li
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`flex items-start gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
                  >
                    <div className="w-8 h-8 bg-white border border-slate-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                      {notifIcon[n.type] || <Bell size={15} className="text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{n.message}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.type}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!n.read && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                      <span className="text-xs text-slate-400">{timeAgo(n.timestamp)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {/* ── Audit Log ── */}
      {view === 'auditlog' && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            {LOG_CATS.map(cat => (
              <button
                key={cat}
                onClick={() => setLogFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${logFilter === cat ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Card>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Activity size={32} className="mx-auto mb-2 opacity-30" />
                <p>No log entries in this category</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {filteredLogs.map(log => (
                  <li key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      {logIcon[log.type] || <Activity size={14} className="text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{log.message}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{log.type}</p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(log.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
