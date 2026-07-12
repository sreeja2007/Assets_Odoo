import { useState, useMemo } from 'react';
import { Plus, Lock, AlertTriangle, CheckCircle, XCircle, Minus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { ROLES, AUDIT_ITEM_STATUSES } from '../data/mockData';
import Card from '../components/common/Card';
import StatusPill from '../components/common/StatusPill';
import Modal from '../components/common/Modal';
import { Input, Select, Textarea } from '../components/common/Input';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';

// ── Create Cycle Modal ────────────────────────────────────────
function CreateCycleModal({ open, onClose }) {
  const { departments, users, assets, createAuditCycle } = useAppData();
  const { currentUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', departmentId: '', location: '', startDate: '', endDate: '', auditorIds: [] });

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const toggleAuditor = (id) => setForm(p => ({
    ...p,
    auditorIds: p.auditorIds.includes(id)
      ? p.auditorIds.filter(a => a !== id)
      : [...p.auditorIds, id],
  }));

  const handleCreate = () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      toast('Name and dates are required', 'error'); return;
    }
    createAuditCycle(form, currentUser);
    toast('Audit cycle created', 'success');
    setForm({ name: '', departmentId: '', location: '', startDate: '', endDate: '', auditorIds: [] });
    onClose();
  };

  const eligible = users.filter(u => [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPT_HEAD].includes(u.role));

  return (
    <Modal open={open} onClose={onClose} title="Create Audit Cycle">
      <div className="space-y-4">
        <Input label="Cycle Name" value={form.name} onChange={set('name')} placeholder="e.g. Q3 Engineering Audit" />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Department (optional)" value={form.departmentId} onChange={set('departmentId')}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Input label="Location" value={form.location} onChange={set('location')} placeholder="e.g. Engineering Lab" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Date" type="date" value={form.startDate} onChange={set('startDate')} />
          <Input label="End Date" type="date" value={form.endDate} onChange={set('endDate')} />
        </div>
        <div>
          <p className="block text-sm font-medium text-slate-700 mb-2">Assign Auditors</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {eligible.map(u => (
              <label key={u.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors
                ${form.auditorIds.includes(u.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="checkbox" checked={form.auditorIds.includes(u.id)} onChange={() => toggleAuditor(u.id)} className="accent-blue-600" />
                <span className="text-sm font-medium text-slate-900">{u.name}</span>
                <StatusPill status={u.role} />
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate}>Create Cycle</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Audit Cycle Detail View ───────────────────────────────────
function CycleDetail({ cycle, onClose }) {
  const { assets, users, departments, updateAuditItem, closeAuditCycle } = useAppData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const canAudit = cycle.auditorIds?.includes(currentUser.id) ||
    [ROLES.ADMIN, ROLES.ASSET_MANAGER].includes(currentUser.role);

  const deptName = departments.find(d => d.id === cycle.departmentId)?.name || 'All';

  // Build item list – include assets in the scope or already added
  const scopeAssets = useMemo(() => {
    const itemAssetIds = new Set(cycle.items.map(i => i.assetId));
    return assets.filter(a =>
      itemAssetIds.has(a.id) ||
      (!cycle.departmentId || a.departmentId === cycle.departmentId)
    );
  }, [assets, cycle]);

  const getItem = (assetId) => cycle.items.find(i => i.assetId === assetId) || { status: AUDIT_ITEM_STATUSES.PENDING, notes: '' };

  const discrepancies = cycle.items.filter(i => i.status !== AUDIT_ITEM_STATUSES.VERIFIED && i.status !== AUDIT_ITEM_STATUSES.PENDING);

  const handleMark = (assetId, status) => {
    updateAuditItem(cycle.id, assetId, status, '');
    toast(`Marked as ${status}`, 'success');
  };

  const handleClose = () => {
    if (!window.confirm('Close this audit cycle? This action is irreversible and will update asset statuses (missing → Lost).')) return;
    closeAuditCycle(cycle.id, currentUser);
    toast('Audit cycle closed', 'success');
    onClose();
  };

  const itemColor = {
    [AUDIT_ITEM_STATUSES.VERIFIED]: 'bg-emerald-50 border-emerald-200',
    [AUDIT_ITEM_STATUSES.MISSING]:  'bg-red-50 border-red-200',
    [AUDIT_ITEM_STATUSES.DAMAGED]:  'bg-amber-50 border-amber-200',
    [AUDIT_ITEM_STATUSES.PENDING]:  'bg-white border-slate-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="text-sm text-blue-600 hover:underline">← All Cycles</button>
            <StatusPill status={cycle.status} />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">{cycle.name}</h2>
          <p className="text-slate-500 mt-1">{deptName} · {cycle.startDate} to {cycle.endDate} · {cycle.location}</p>
        </div>
        {cycle.status === 'Open' && [ROLES.ADMIN, ROLES.ASSET_MANAGER].includes(currentUser?.role) && (
          <Button variant="danger" onClick={handleClose}>
            <Lock size={14} className="mr-1.5" />Close Cycle
          </Button>
        )}
      </div>

      {/* Discrepancy summary */}
      {discrepancies.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">Discrepancies Found ({discrepancies.length})</h3>
          </div>
          <div className="space-y-1">
            {discrepancies.map(d => {
              const asset = assets.find(a => a.id === d.assetId);
              return (
                <div key={d.assetId} className="flex items-center justify-between bg-white/70 rounded-xl px-3 py-2">
                  <span className="text-sm text-slate-700">{asset?.name} <span className="text-slate-400 font-mono text-xs">({asset?.tag})</span></span>
                  <StatusPill status={d.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Asset checklist */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-medium text-slate-900">Assets in Scope ({scopeAssets.length})</h3>
        </div>
        <ul className="divide-y divide-slate-50">
          {scopeAssets.map(asset => {
            const item = getItem(asset.id);
            const colors = itemColor[item.status] || itemColor[AUDIT_ITEM_STATUSES.PENDING];
            return (
              <li key={asset.id} className={`flex items-center justify-between px-6 py-4 border-l-4 transition-colors ${colors}`}>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{asset.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{asset.tag} · {asset.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={item.status} />
                  {cycle.status === 'Open' && canAudit && (
                    <div className="flex items-center gap-1 ml-3">
                      <button
                        onClick={() => handleMark(asset.id, AUDIT_ITEM_STATUSES.VERIFIED)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1
                          ${item.status === AUDIT_ITEM_STATUSES.VERIFIED ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                      >
                        <CheckCircle size={12} /> Verified
                      </button>
                      <button
                        onClick={() => handleMark(asset.id, AUDIT_ITEM_STATUSES.MISSING)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1
                          ${item.status === AUDIT_ITEM_STATUSES.MISSING ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                      >
                        <XCircle size={12} /> Missing
                      </button>
                      <button
                        onClick={() => handleMark(asset.id, AUDIT_ITEM_STATUSES.DAMAGED)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1
                          ${item.status === AUDIT_ITEM_STATUSES.DAMAGED ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                      >
                        <AlertTriangle size={12} /> Damaged
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AuditPage() {
  const { currentUser } = useAuth();
  const { auditCycles, departments, users } = useAppData();
  const [createModal, setCreateModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState(null);

  const canCreate = [ROLES.ADMIN, ROLES.ASSET_MANAGER].includes(currentUser?.role);
  const getDeptName = id => departments.find(d => d.id === id)?.name || 'All Departments';
  const getAuditors = ids => ids?.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ') || 'None';

  if (selectedCycle) {
    const live = auditCycles.find(c => c.id === selectedCycle.id) || selectedCycle;
    return (
      <CycleDetail
        cycle={live}
        onClose={() => setSelectedCycle(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Asset Audit</h1>
          <p className="text-slate-500 mt-1">Create and manage audit cycles across departments</p>
        </div>
        {canCreate && (
          <Button variant="primary" onClick={() => setCreateModal(true)}>
            <Plus size={14} className="mr-1.5" />New Audit Cycle
          </Button>
        )}
      </div>

      {auditCycles.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-400">No audit cycles yet. Create one to begin.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {auditCycles.map(cycle => {
            const total = cycle.items.length;
            const verified = cycle.items.filter(i => i.status === AUDIT_ITEM_STATUSES.VERIFIED).length;
            const missing = cycle.items.filter(i => i.status === AUDIT_ITEM_STATUSES.MISSING).length;
            const damaged = cycle.items.filter(i => i.status === AUDIT_ITEM_STATUSES.DAMAGED).length;

            return (
              <Card
                key={cycle.id}
                className="p-6 flex items-center justify-between hover:shadow-md cursor-pointer transition-all"
                onClick={() => setSelectedCycle(cycle)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0
                    ${cycle.status === 'Open' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    {cycle.status === 'Closed' ? <Lock size={18} /> : <CheckCircle size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-slate-900">{cycle.name}</h3>
                      <StatusPill status={cycle.status} />
                    </div>
                    <p className="text-sm text-slate-500">{getDeptName(cycle.departmentId)} · {cycle.startDate} to {cycle.endDate}</p>
                    <p className="text-xs text-slate-400 mt-1">Auditors: {getAuditors(cycle.auditorIds)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-center mr-4">
                  <div>
                    <p className="text-lg font-semibold text-emerald-600">{verified}</p>
                    <p className="text-xs text-slate-400">Verified</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-red-500">{missing}</p>
                    <p className="text-xs text-slate-400">Missing</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-amber-500">{damaged}</p>
                    <p className="text-xs text-slate-400">Damaged</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-700">{total}</p>
                    <p className="text-xs text-slate-400">Total Items</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCycleModal open={createModal} onClose={() => setCreateModal(false)} />
    </div>
  );
}
