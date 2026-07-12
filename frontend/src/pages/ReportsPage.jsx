import { useMemo } from 'react';
import { BarChart3, TrendingUp, Package, Wrench, Clock, AlertTriangle } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { ASSET_STATUSES, MAINTENANCE_STATUSES } from '../data/mockData';
import Card from '../components/common/Card';
import StatusPill from '../components/common/StatusPill';

// ── Simple Bar Chart ──────────────────────────────────────────
function BarChart({ data, title, colorClass = 'bg-blue-500' }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <h3 className="text-base font-medium text-slate-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-32 flex-shrink-0 truncate">{d.label}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${colorClass}`}
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-700 w-6 text-right">{d.value}</span>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-slate-400">No data available</p>}
      </div>
    </div>
  );
}

// ── Simple Line Sparkline ─────────────────────────────────────
function Sparkline({ values, color = '#3b82f6' }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const w = 200, h = 60;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 8)}`).join(' ');
  return (
    <div className="max-w-[200px] w-full">
      <svg viewBox="0 0 200 60" className="overflow-visible w-full h-auto">
        <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {values.map((v, i) => (
          <circle key={i} cx={(i / (values.length - 1)) * w} cy={h - (v / max) * (h - 8)} r={3} fill={color} />
        ))}
      </svg>
    </div>
  );
}

// ── Simple Donut / Pie Chart ───────────────────────────────────
function DonutChart({ data, title }) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

  const r = 36;
  const cx = 50;
  const cy = 50;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * r;

  const segments = useMemo(() => {
    if (total === 0) return [];
    let accumulatedPercent = 0;
    return data.map((d, index) => {
      const percent = d.value / total;
      const strokeLength = percent * circumference;
      const strokeOffset = circumference - strokeLength;
      
      const angle = (accumulatedPercent * 360) - 90;
      accumulatedPercent += percent;

      return {
        ...d,
        color: COLORS[index % COLORS.length],
        strokeLength,
        strokeOffset,
        angle,
        percent: Math.round(percent * 100)
      };
    });
  }, [data, total, circumference]);

  return (
    <div>
      <h3 className="text-base font-medium text-slate-900 mb-4">{title}</h3>
      {total === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">No data available</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {segments.map((seg, i) => (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${seg.strokeLength} ${circumference}`}
                  strokeDashoffset={0}
                  transform={`rotate(${seg.angle + 90} ${cx} ${cy})`}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-slate-800">{total}</span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total</span>
            </div>
          </div>

          <div className="flex-grow space-y-2 w-full">
            {segments.map((seg, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-slate-600 font-medium truncate">{seg.label}</span>
                </div>
                <span className="text-slate-400 font-semibold ml-2">
                  {seg.value} ({seg.percent}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stat Box ──────────────────────────────────────────────────
function StatBox({ label, value, sub, icon: Icon, color }) {
  return (
    <div className={`rounded-2xl p-4 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
        </div>
        {Icon && <Icon size={20} className="opacity-50" />}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ReportsPage() {
  const { assets, allocations, maintenanceRequests, bookings, departments, categories, users } = useAppData();

  const today = new Date();

  const stats = useMemo(() => {
    const available = assets.filter(a => a.status === ASSET_STATUSES.AVAILABLE).length;
    const allocated = assets.filter(a => a.status === ASSET_STATUSES.ALLOCATED).length;
    const underMaint = assets.filter(a => a.status === ASSET_STATUSES.UNDER_MAINTENANCE).length;
    const retired = assets.filter(a => a.status === ASSET_STATUSES.RETIRED || a.status === ASSET_STATUSES.DISPOSED).length;
    const overdue = allocations.filter(a => !a.returnDate && a.expectedReturnDate && new Date(a.expectedReturnDate) < today).length;
    const totalCost = assets.reduce((sum, a) => sum + (parseFloat(a.acquisitionCost) || 0), 0);
    return { available, allocated, underMaint, retired, overdue, totalCost };
  }, [assets, allocations]);

  // Dept allocation breakdown
  const deptAllocation = useMemo(() => {
    const map = {};
    assets.filter(a => a.departmentId).forEach(a => {
      const dname = departments.find(d => d.id === a.departmentId)?.name || 'Unknown';
      map[dname] = (map[dname] || 0) + 1;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [assets, departments]);

  // Category utilization
  const catUtilization = useMemo(() => {
    const map = {};
    assets.filter(a => a.status === ASSET_STATUSES.ALLOCATED).forEach(a => {
      const cname = categories.find(c => c.id === a.categoryId)?.name || 'Unknown';
      map[cname] = (map[cname] || 0) + 1;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [assets, categories]);

  // Maintenance by category
  const maintByCat = useMemo(() => {
    const map = {};
    maintenanceRequests.forEach(m => {
      const asset = assets.find(a => a.id === m.assetId);
      const cname = categories.find(c => c.id === asset?.categoryId)?.name || 'Unknown';
      map[cname] = (map[cname] || 0) + 1;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [maintenanceRequests, assets, categories]);

  // Monthly maintenance trend (last 6 months mock)
  const maintTrend = [2, 3, 1, 4, 3, maintenanceRequests.length];

  // Most used assets (by allocations count)
  const mostUsed = useMemo(() => {
    const map = {};
    allocations.forEach(a => { map[a.assetId] = (map[a.assetId] || 0) + 1; });
    return Object.entries(map)
      .map(([id, count]) => ({ asset: assets.find(a => a.id === id), count }))
      .filter(x => x.asset)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allocations, assets]);

  // Idle assets
  const idleAssets = useMemo(() => assets.filter(a => a.status === ASSET_STATUSES.AVAILABLE).slice(0, 5), [assets]);

  // Due for review
  const dueSoon = useMemo(() => {
    return allocations.filter(a => {
      if (!a.expectedReturnDate || a.returnDate) return false;
      const diff = (new Date(a.expectedReturnDate) - today) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    }).map(a => ({ ...a, asset: assets.find(x => x.id === a.assetId), user: users.find(u => u.id === a.assignedTo) }));
  }, [allocations, assets, users]);

  const handleExport = () => {
    const rows = [
      ['Tag', 'Name', 'Status', 'Category', 'Location', 'Acquisition Cost'],
      ...assets.map(a => [
        a.tag, a.name, a.status,
        categories.find(c => c.id === a.categoryId)?.name || '',
        a.location,
        a.acquisitionCost,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'assetflow-report.csv'; link.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1">Organization-wide asset insights and summaries</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 rounded-full px-5 py-2.5 font-medium hover:bg-slate-50 transition-colors text-sm w-full sm:w-auto"
        >
          Export CSV
        </button>
      </div>

      {/* Stat Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatBox label="Available" value={stats.available} icon={Package} color="bg-emerald-50 text-emerald-900" />
        <StatBox label="Allocated" value={stats.allocated} icon={TrendingUp} color="bg-blue-50 text-blue-900" />
        <StatBox label="Maintenance" value={stats.underMaint} icon={Wrench} color="bg-amber-50 text-amber-900" />
        <StatBox label="Retired/Disposed" value={stats.retired} icon={Clock} color="bg-slate-100 text-slate-700" />
        <StatBox label="Overdue" value={stats.overdue} icon={AlertTriangle} color="bg-red-50 text-red-900" />
        <StatBox label="Total Asset Value" value={`$${stats.totalCost.toLocaleString()}`} icon={BarChart3} color="bg-violet-50 text-violet-900" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <BarChart data={deptAllocation} title="Assets by Department" colorClass="bg-blue-500" />
        </Card>
        <Card className="p-6">
          <DonutChart data={catUtilization} title="Allocated Assets by Category" />
        </Card>
        <Card className="p-6">
          <BarChart data={maintByCat} title="Maintenance Requests by Category" colorClass="bg-amber-500" />
        </Card>
        <Card className="p-6">
          <h3 className="text-base font-medium text-slate-900 mb-4">Maintenance Frequency Trend (6 months)</h3>
          <Sparkline values={maintTrend} color="#f59e0b" />
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            {['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map(m => <span key={m}>{m}</span>)}
          </div>
        </Card>
      </div>

      {/* Text Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Most used */}
        <Card className="p-6">
          <h3 className="text-base font-medium text-slate-900 mb-4">Most Used Assets</h3>
          <ul className="space-y-3">
            {mostUsed.map(({ asset, count }) => (
              <li key={asset.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{asset.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{asset.tag}</p>
                </div>
                <span className="text-sm font-semibold text-blue-600">{count}x</span>
              </li>
            ))}
            {mostUsed.length === 0 && <p className="text-sm text-slate-400">No data</p>}
          </ul>
        </Card>

        {/* Idle assets */}
        <Card className="p-6">
          <h3 className="text-base font-medium text-slate-900 mb-4">Currently Idle</h3>
          <ul className="space-y-3">
            {idleAssets.map(a => (
              <li key={a.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{a.name}</p>
                  <p className="text-xs text-slate-400">{a.location}</p>
                </div>
                <StatusPill status="Available" />
              </li>
            ))}
            {idleAssets.length === 0 && <p className="text-sm text-slate-400">No idle assets</p>}
          </ul>
        </Card>

        {/* Due soon */}
        <Card className="p-6">
          <h3 className="text-base font-medium text-slate-900 mb-4">Due for Return (30 days)</h3>
          <ul className="space-y-3">
            {dueSoon.map(item => (
              <li key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.asset?.name}</p>
                  <p className="text-xs text-slate-400">with {item.user?.name}</p>
                </div>
                <p className="text-xs font-semibold text-amber-600">{item.expectedReturnDate}</p>
              </li>
            ))}
            {dueSoon.length === 0 && <p className="text-sm text-slate-400">Nothing due soon</p>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
