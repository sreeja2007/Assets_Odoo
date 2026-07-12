import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Wrench, AlertTriangle, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { MAINTENANCE_STATUSES, ROLES } from '../data/mockData';
import Card from '../components/common/Card';
import StatusPill from '../components/common/StatusPill';
import Modal from '../components/common/Modal';
import { Select, Textarea } from '../components/common/Input';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';

// ── Request Modal ─────────────────────────────────────────────
function RequestModal({ open, onClose }) {
  const { assets, createMaintenanceRequest } = useAppData();
  const { currentUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ assetId: '', issue: '', priority: 'Medium' });
  const [errors, setErrors] = useState({});

  const set = f => e => { setForm(p => ({ ...p, [f]: e.target.value })); setErrors(p => ({ ...p, [f]: '' })); };

  const handleSubmit = () => {
    const e = {};
    if (!form.assetId) e.assetId = 'Select an asset';
    if (!form.issue.trim()) e.issue = 'Describe the issue';
    setErrors(e);
    if (Object.keys(e).length) return;
    createMaintenanceRequest(form, currentUser);
    toast('Maintenance request submitted', 'success');
    setForm({ assetId: '', issue: '', priority: 'Medium' });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Raise Maintenance Request">
      <div className="space-y-4">
        <Select label="Asset" value={form.assetId} onChange={set('assetId')} error={errors.assetId}>
          <option value="">Select asset</option>
          {assets.map(a => <option key={a.id} value={a.id}>{a.tag} — {a.name}</option>)}
        </Select>
        <Select label="Priority" value={form.priority} onChange={set('priority')}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </Select>
        <Textarea label="Issue Description" value={form.issue} onChange={set('issue')} error={errors.issue} placeholder="Describe the issue in detail..." rows={4} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Submit Request</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Update Status Modal ───────────────────────────────────────
function UpdateModal({ open, onClose, request }) {
  const { users, updateMaintenanceStatus } = useAppData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const canManage = [ROLES.ADMIN, ROLES.ASSET_MANAGER].includes(currentUser?.role);

  const nextStatuses = {
    [MAINTENANCE_STATUSES.PENDING]:             [MAINTENANCE_STATUSES.APPROVED, MAINTENANCE_STATUSES.REJECTED],
    [MAINTENANCE_STATUSES.APPROVED]:            [MAINTENANCE_STATUSES.TECHNICIAN_ASSIGNED, MAINTENANCE_STATUSES.REJECTED],
    [MAINTENANCE_STATUSES.TECHNICIAN_ASSIGNED]: [MAINTENANCE_STATUSES.IN_PROGRESS, MAINTENANCE_STATUSES.REJECTED],
    [MAINTENANCE_STATUSES.IN_PROGRESS]:         [MAINTENANCE_STATUSES.RESOLVED],
    [MAINTENANCE_STATUSES.RESOLVED]:            [],
    [MAINTENANCE_STATUSES.REJECTED]:            [MAINTENANCE_STATUSES.PENDING], // Allow reopening if rejected
  };

  const available = nextStatuses[request?.status] || [];
  const [newStatus, setNewStatus] = useState('');
  const [techId, setTechId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (available.length > 0) {
      setNewStatus(available[0]);
    } else {
      setNewStatus('');
    }
    setTechId(request?.assignedTechnician || '');
    setNotes('');
  }, [request, open]);

  if (!request) return null;

  const handleUpdate = () => {
    if (!newStatus) return;
    updateMaintenanceStatus(request.id, newStatus, techId || null, notes, currentUser);
    toast(`Status updated to ${newStatus}`, 'success');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Update Request — ${request.issue?.slice(0, 40)}`}>
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4 space-y-1">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Current Status</p>
          <StatusPill status={request.status} />
        </div>

        {!canManage && <p className="text-sm text-slate-500">You don't have permission to update this request.</p>}

        {canManage && (
          <>
            {available.length > 0 && (
              <Select label="Move To" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {available.map(s => <option key={s}>{s}</option>)}
              </Select>
            )}
            
            {(newStatus === MAINTENANCE_STATUSES.TECHNICIAN_ASSIGNED || request.status === MAINTENANCE_STATUSES.TECHNICIAN_ASSIGNED) && (
              <Select label="Assign Technician" value={techId} onChange={e => setTechId(e.target.value)}>
                <option value="">Select technician</option>
                {users.filter(u => [ROLES.ASSET_MANAGER, ROLES.ADMIN].includes(u.role)).map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Select>
            )}
            <Textarea label="Notes / Comments" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add comments regarding service..." rows={3} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleUpdate} disabled={available.length === 0 && !techId && !notes}>
                Save Changes
              </Button>
            </div>
          </>
        )}

        {canManage && available.length === 0 && !request.assignedTechnician && (
          <p className="text-sm text-slate-400 text-center py-4">This request is in a terminal state.</p>
        )}
      </div>
    </Modal>
  );
}

// ── Kanban Card ───────────────────────────────────────────────
function KanbanCard({ request, onClick }) {
  const { assets, users } = useAppData();
  const asset = assets.find(a => a.id === request.assetId);
  const requester = users.find(u => u.id === request.requestedBy);
  const technician = users.find(u => u.id === request.assignedTechnician);

  const priorityColor = { 
    High: 'bg-red-50 text-red-700 border-red-100', 
    Medium: 'bg-amber-50 text-amber-700 border-amber-100', 
    Low: 'bg-slate-100 text-slate-500 border-slate-200' 
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-sm hover:border-blue-300 transition-all group flex flex-col justify-between min-h-[140px]"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2 w-full">
          <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
            {asset?.tag || 'AF-XXXX'}
          </span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${priorityColor[request.priority] || priorityColor.Low}`}>
            {request.priority}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
          {request.issue}
        </p>
      </div>

      <div>
        <div className="text-xs text-slate-400 truncate mb-2">
          {asset?.name || 'Unknown Asset'}
        </div>
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 w-full">
          <span className="truncate">By {requester?.name?.split(' ')[0] || 'Staff'}</span>
          {technician ? (
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
              Tech: {technician.name.split(' ')[0]}
            </span>
          ) : (
            <span className="text-slate-300 italic">Unassigned</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Kanban Column ─────────────────────────────────────────────
function KanbanColumn({ title, requests, onCardClick, color }) {
  return (
    <div className="flex flex-col min-w-[250px] w-80 bg-slate-50/50 border border-slate-100 rounded-3xl p-4 flex-shrink-0">
      <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-4 ${color} border`}>
        <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
        <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200/50">
          {requests.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
        {requests.map(r => (
          <KanbanCard key={r.id} request={r} onClick={() => onCardClick(r)} />
        ))}
        {requests.length === 0 && (
          <div className="text-center py-12 text-slate-300 text-xs border border-dashed border-slate-200 rounded-2xl bg-white/50">
            No requests
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
const COLUMNS = [
  { id: MAINTENANCE_STATUSES.PENDING,             title: 'Pending',             color: 'bg-amber-50 text-amber-800 border-amber-100' },
  { id: MAINTENANCE_STATUSES.APPROVED,            title: 'Approved',            color: 'bg-blue-50 text-blue-800 border-blue-100' },
  { id: MAINTENANCE_STATUSES.TECHNICIAN_ASSIGNED, title: 'Tech Assigned',       color: 'bg-violet-50 text-violet-800 border-violet-100' },
  { id: MAINTENANCE_STATUSES.IN_PROGRESS,         title: 'In Progress',         color: 'bg-teal-50 text-teal-800 border-teal-100' },
  { id: MAINTENANCE_STATUSES.RESOLVED,            title: 'Resolved',            color: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
  { id: MAINTENANCE_STATUSES.REJECTED,            title: 'Rejected',            color: 'bg-red-50 text-red-800 border-red-100' },
];

export default function MaintenancePage() {
  const { maintenanceRequests, assets, users } = useAppData();
  const [params] = useSearchParams();
  const [requestModal, setRequestModal] = useState(false);
  const [updateModal, setUpdateModal] = useState({ open: false, request: null });

  // Filters state
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    if (params.get('action') === 'new') setRequestModal(true);
  }, [params]);

  // Compute overall statistics
  const stats = useMemo(() => {
    const total = maintenanceRequests.length;
    const pending = maintenanceRequests.filter(r => r.status === MAINTENANCE_STATUSES.PENDING).length;
    const inProgress = maintenanceRequests.filter(r => 
      r.status === MAINTENANCE_STATUSES.APPROVED || 
      r.status === MAINTENANCE_STATUSES.TECHNICIAN_ASSIGNED || 
      r.status === MAINTENANCE_STATUSES.IN_PROGRESS
    ).length;
    const resolved = maintenanceRequests.filter(r => r.status === MAINTENANCE_STATUSES.RESOLVED).length;
    const rejected = maintenanceRequests.filter(r => r.status === MAINTENANCE_STATUSES.REJECTED).length;
    return { total, pending, inProgress, resolved, rejected };
  }, [maintenanceRequests]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    const q = search.toLowerCase().trim();
    return maintenanceRequests.filter(r => {
      // Filter by Priority
      if (priorityFilter && r.priority !== priorityFilter) return false;

      // Search by issue description, asset name, tag, requester name, or technician name
      if (q) {
        const asset = assets.find(a => a.id === r.assetId);
        const requester = users.find(u => u.id === r.requestedBy);
        const technician = users.find(u => u.id === r.assignedTechnician);

        const matchIssue = r.issue.toLowerCase().includes(q);
        const matchAsset = asset ? (asset.name.toLowerCase().includes(q) || asset.tag.toLowerCase().includes(q)) : false;
        const matchReq = requester ? requester.name.toLowerCase().includes(q) : false;
        const matchTech = technician ? technician.name.toLowerCase().includes(q) : false;

        return matchIssue || matchAsset || matchReq || matchTech;
      }
      return true;
    });
  }, [maintenanceRequests, assets, users, search, priorityFilter]);

  const byStatus = useMemo(() => {
    const map = {};
    COLUMNS.forEach(c => { map[c.id] = []; });
    filteredRequests.forEach(r => {
      if (map[r.status]) map[r.status].push(r);
    });
    return map;
  }, [filteredRequests]);

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Maintenance</h1>
          <p className="text-slate-500 mt-1">Track and manage asset maintenance requests</p>
        </div>
        <Button variant="primary" onClick={() => setRequestModal(true)} className="w-full sm:w-auto justify-center">
          <Plus size={14} className="mr-1.5" />Raise Request
        </Button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Requests', count: stats.total, color: 'border-slate-200 text-slate-800' },
          { label: 'Pending Approval', count: stats.pending, color: 'border-amber-200 text-amber-700 bg-amber-50/20' },
          { label: 'In Progress', count: stats.inProgress, color: 'border-blue-200 text-blue-700 bg-blue-50/20' },
          { label: 'Resolved Tasks', count: stats.resolved, color: 'border-emerald-200 text-emerald-700 bg-emerald-50/20' },
          { label: 'Rejected Requests', count: stats.rejected, color: 'border-red-200 text-red-700 bg-red-50/20' },
        ].map((stat, i) => (
          <div key={i} className={`border rounded-2xl p-4 text-center ${stat.color} shadow-xs`}>
            <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold mt-1 tracking-tight">{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Search by issue, asset, requester, or tech..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="w-full sm:w-48 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500"
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>
        {(search || priorityFilter) && (
          <button 
            onClick={() => { setSearch(''); setPriorityFilter(''); }}
            className="text-xs text-blue-600 hover:underline w-full sm:w-auto text-left sm:text-center shrink-0"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            title={col.title}
            requests={byStatus[col.id] || []}
            onCardClick={r => setUpdateModal({ open: true, request: r })}
            color={col.color}
          />
        ))}
      </div>

      <RequestModal open={requestModal} onClose={() => setRequestModal(false)} />
      <UpdateModal
        open={updateModal.open}
        onClose={() => setUpdateModal({ open: false, request: null })}
        request={updateModal.request}
      />
    </div>
  );
}
