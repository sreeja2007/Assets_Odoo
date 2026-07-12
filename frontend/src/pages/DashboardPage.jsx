import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Users, Wrench, CalendarDays, ArrowLeftRight,
  Clock, AlertTriangle, Plus, BookOpen, TrendingUp, Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { ASSET_STATUSES, BOOKING_STATUSES, TRANSFER_STATUSES } from '../data/mockData';
import Card from '../components/common/Card';
import StatusPill from '../components/common/StatusPill';

function KpiCard({ icon: Icon, label, value, color, sub }) {
  return (
    <Card className="p-6 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-3xl font-semibold text-slate-900 tracking-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { assets, allocations, maintenanceRequests, bookings, transferRequests, activityLogs, users, categories } = useAppData();
  const navigate = useNavigate();

  const today = new Date();

  const kpis = useMemo(() => {
    const available = assets.filter(a => a.status === ASSET_STATUSES.AVAILABLE).length;
    const allocated = assets.filter(a => a.status === ASSET_STATUSES.ALLOCATED).length;
    const maintenanceToday = maintenanceRequests.filter(m => {
      const d = new Date(m.createdAt);
      return d.toDateString() === today.toDateString();
    }).length;
    const activeBookings = bookings.filter(b => b.status === BOOKING_STATUSES.UPCOMING || b.status === BOOKING_STATUSES.ONGOING).length;
    const pendingTransfers = transferRequests.filter(t => t.status === TRANSFER_STATUSES.REQUESTED).length;
    const upcoming = allocations.filter(a => {
      if (!a.expectedReturnDate || a.returnDate) return false;
      const diff = (new Date(a.expectedReturnDate) - today) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length;
    return { available, allocated, maintenanceToday, activeBookings, pendingTransfers, upcoming };
  }, [assets, allocations, maintenanceRequests, bookings, transferRequests]);

  const overdueAllocations = useMemo(() => {
    return allocations
      .filter(a => !a.returnDate && a.expectedReturnDate && new Date(a.expectedReturnDate) < today)
      .map(a => {
        const asset = assets.find(x => x.id === a.assetId);
        const user = users.find(u => u.id === a.assignedTo);
        return { ...a, assetName: asset?.name, assetTag: asset?.tag, userName: user?.name };
      });
  }, [allocations, assets, users]);

  const recentActivity = useMemo(() => activityLogs.slice(0, 8), [activityLogs]);

  const typeIcon = {
    Allocation:   <Package size={14} className="text-blue-500" />,
    Maintenance:  <Wrench size={14} className="text-amber-500" />,
    Transfer:     <ArrowLeftRight size={14} className="text-violet-500" />,
    Booking:      <CalendarDays size={14} className="text-teal-500" />,
    Approval:     <TrendingUp size={14} className="text-emerald-500" />,
    Registration: <Plus size={14} className="text-slate-500" />,
    Audit:        <BookOpen size={14} className="text-slate-500" />,
    Return:       <Clock size={14} className="text-slate-500" />,
    Admin:        <Users size={14} className="text-violet-500" />,
  };

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">Good morning, {currentUser?.name?.split(' ')[0]}. Here's what's happening.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard icon={Package}       label="Available"          value={kpis.available}       color="bg-emerald-500" />
        <KpiCard icon={Users}         label="Allocated"          value={kpis.allocated}        color="bg-blue-500" />
        <KpiCard icon={Wrench}        label="Maintenance Today"  value={kpis.maintenanceToday} color="bg-amber-500" />
        <KpiCard icon={CalendarDays}  label="Active Bookings"    value={kpis.activeBookings}   color="bg-teal-500" />
        <KpiCard icon={ArrowLeftRight}label="Pending Transfers"  value={kpis.pendingTransfers} color="bg-violet-500" />
        <KpiCard icon={Clock}         label="Upcoming Returns"   value={kpis.upcoming}         color="bg-slate-500" sub="within 7 days" />
      </div>



      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-medium text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/assets?action=register')}
            className="flex items-center gap-2 bg-blue-600 text-white rounded-full px-5 py-2.5 font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Register Asset
          </button>
          <button
            onClick={() => navigate('/bookings?action=book')}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 rounded-full px-5 py-2.5 font-medium hover:bg-slate-50 transition-colors"
          >
            <CalendarDays size={16} />
            Book Resource
          </button>
          <button
            onClick={() => navigate('/maintenance?action=new')}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 rounded-full px-5 py-2.5 font-medium hover:bg-slate-50 transition-colors"
          >
            <Wrench size={16} />
            Raise Request
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-medium text-slate-900 mb-4">Recent Activity</h2>
        <Card>
          <ul className="divide-y divide-slate-50">
            {recentActivity.map((log, i) => (
              <li key={log.id} className="flex items-start gap-3 px-6 py-4">
                <div className="w-7 h-7 bg-slate-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  {typeIcon[log.type] || <Activity size={14} className="text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{log.message}</p>
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0 mt-0.5">{timeAgo(log.timestamp)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
