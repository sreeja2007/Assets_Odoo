import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Wrench, AlertTriangle, ChevronRight } from 'lucide-react';
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
    [MAINTENANCE_STATUSES.APPROVED]:            [MAINTENANCE_STATUSES.TECHNICIAN_ASSIGNED],
    [MAINTENANCE_STATUSES.TECHNICIAN_ASSIGNED]: [MAINTENANCE_STATUSES.IN_PROGRESS],
    [MAINTENANCE_STATUSES.IN_PROGRESS]:         [MAINTENANCE_STATUSES.RESOLVED],
    [MAINTENANCE_STATUSES.RESOLVED]:            [],
    [MAINTENANCE_STATUSES.REJECTED]:            [],
  };

  const available = nextStatuses[request?.status] || [];
  const [newStatus, setNewStatus] = useState(available[0] || '');
  const [techId, setTechId] = useState('');
  const [notes, setNotes] = useState('');

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

        {canManage && available.length > 0 && (
          <>
            <Select label="Move To" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {available.map(s => <option key={s}>{s}</option>)}
            </Select>
            {newStatus === MAINTENANCE_STATUSES.TECHNICIAN_ASSIGNED && (
              <Select label="Assign Technician" value={techId} onChange={e => setTechId(e.target.value)}>
                <option value="">Select technician</option>
                {users.filter(u => [ROLES.ASSET_MANAGER, ROLES.ADMIN].includes(u.role)).map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Select>
            )}
            <Textarea label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any notes..." rows={3} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleUpdate}>Update Status</Button>
            </div>
          </>
        )}

        {canManage && available.length === 0 && (
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

  const priorityColor = { High: 'bg-red-100 text-red-700', Medium: 'bg-amber-100 text-amber-700', Low: 'bg-slate-100 text-slate-500' };

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md hover:border-blue-200 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{asset?.tag}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColor[request.priority]}`}>{request.priority}</span>
      </div>
      <p className="text-sm font-medium text-slate-900 leading-snug mb-2">{request.issue}</p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{asset?.name}</p>
        <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
      </div>
      <p className="text-xs text-slate-400 mt-1">By {requester?.name} · {new Date(request.createdAt).toLocaleDateString()}</p>
    </button>
  );
}

// ── Kanban Column ─────────────────────────────────────────────
function KanbanColumn({ title, status, requests, onCardClick, color }) {
  return (
    <div className="flex flex-col min-w-[220px] flex-1">
      <div className={`flex items-center justify-between px-4 py-3 rounded-2xl mb-3 ${color}`}>
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs font-semibold bg-white/60 rounded-full px-2 py-0.5">{requests.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {requests.map(r => (
          <KanbanCard key={r.id} request={r} onClick={() => onCardClick(r)} />
        ))}
        {requests.length === 0 && (
          <div className="text-center py-8 text-slate-300 text-xs">Empty</div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
const COLUMNS = [
  { id: MAINTENANCE_STATUSES.PENDING,             title: 'Pending',             color: 'bg-amber-50 text-amber-700' },
  { id: MAINTENANCE_STATUSES.APPROVED,            title: 'Approved',            color: 'bg-blue-50 text-blue-700' },
  { id: MAINTENANCE_STATUSES.TECHNICIAN_ASSIGNED, title: 'Technician Assigned', color: 'bg-violet-50 text-violet-700' },
  { id: MAINTENANCE_STATUSES.IN_PROGRESS,         title: 'In Progress',         color: 'bg-teal-50 text-teal-700' },
  { id: MAINTENANCE_STATUSES.RESOLVED,            title: 'Resolved',            color: 'bg-emerald-50 text-emerald-700' },
];

export default function MaintenancePage() {
  const { maintenanceRequests } = useAppData();
  const [params] = useSearchParams();
  const [requestModal, setRequestModal] = useState(false);
  const [updateModal, setUpdateModal] = useState({ open: false, request: null });

  useEffect(() => {
    if (params.get('action') === 'new') setRequestModal(true);
  }, [params]);

  const byStatus = useMemo(() => {
    const map = {};
    COLUMNS.forEach(c => { map[c.id] = []; });
    maintenanceRequests.forEach(r => {
      if (map[r.status]) map[r.status].push(r);
    });
    return map;
  }, [maintenanceRequests]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Maintenance</h1>
          <p className="text-slate-500 mt-1">Track and manage asset maintenance requests</p>
        </div>
        <Button variant="primary" onClick={() => setRequestModal(true)}>
          <Plus size={14} className="mr-1.5" />Raise Request
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            title={col.title}
            status={col.id}
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
