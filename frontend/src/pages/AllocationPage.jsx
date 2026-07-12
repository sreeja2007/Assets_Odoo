import { useState, useMemo } from 'react';
import { AlertTriangle, Plus, ArrowLeftRight, RotateCcw, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { ASSET_STATUSES, TRANSFER_STATUSES, ROLES } from '../data/mockData';
import Card from '../components/common/Card';
import StatusPill from '../components/common/StatusPill';
import Modal from '../components/common/Modal';
import { Input, Select, Textarea } from '../components/common/Input';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';

// ── Allocate Modal ────────────────────────────────────────────
function AllocateModal({ open, onClose }) {
  const { assets, users, departments, allocateAsset, requestTransfer } = useAppData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ assetId: '', toUserId: '', toDeptId: '', returnDate: '', notes: '' });
  const [conflict, setConflict] = useState(null);

  const set = f => e => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    if (f === 'assetId') setConflict(null);
  };

  const availableAssets = assets.filter(a => a.status === ASSET_STATUSES.AVAILABLE || a.status === ASSET_STATUSES.ALLOCATED);

  const checkConflict = () => {
    const asset = assets.find(a => a.id === form.assetId);
    if (!asset) return;
    if (asset.status === ASSET_STATUSES.ALLOCATED) {
      const holder = users.find(u => u.id === asset.assignedTo);
      setConflict({ assetId: asset.id, holderName: holder?.name || 'Unknown', assetName: asset.name });
    } else {
      setConflict(null);
    }
  };

  const handleAllocate = () => {
    if (!form.assetId || !form.toUserId) { toast('Asset and recipient are required', 'error'); return; }
    const result = allocateAsset(form.assetId, form.toUserId, form.toDeptId, form.returnDate, form.notes, currentUser);
    if (!result.success) { toast(result.error, 'error'); return; }
    toast('Asset allocated successfully', 'success');
    setForm({ assetId: '', toUserId: '', toDeptId: '', returnDate: '', notes: '' });
    setConflict(null);
    onClose();
  };

  const handleTransferRequest = () => {
    if (!form.assetId || !form.toUserId) { toast('Asset and recipient are required', 'error'); return; }
    const asset = assets.find(a => a.id === form.assetId);
    requestTransfer(form.assetId, asset?.assignedTo, form.toUserId, form.notes, currentUser);
    toast('Transfer request submitted', 'success');
    setForm({ assetId: '', toUserId: '', toDeptId: '', returnDate: '', notes: '' });
    setConflict(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Allocate Asset">
      <div className="space-y-4">
        <Select label="Asset" value={form.assetId} onChange={set('assetId')} onBlur={checkConflict}>
          <option value="">Select asset</option>
          {availableAssets.map(a => (
            <option key={a.id} value={a.id}>{a.tag} — {a.name} ({a.status})</option>
          ))}
        </Select>

        {conflict && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Already Allocated — Block reallocation is active</p>
                <p className="text-sm text-amber-700 mt-1">
                  <strong>{conflict.assetName}</strong> is currently held by <strong>{conflict.holderName}</strong>.
                  Direct reallocation is blocked. Submit a Transfer Request instead.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select label="Assign To (Employee)" value={form.toUserId} onChange={set('toUserId')}>
            <option value="">Select employee</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </Select>
          <Select label="Department (optional)" value={form.toDeptId} onChange={set('toDeptId')}>
            <option value="">None</option>
            {/* departments rendered via useAppData */}
          </Select>
        </div>
        <Input label="Expected Return Date (optional)" type="date" value={form.returnDate} onChange={set('returnDate')} />
        <Textarea label="Notes" value={form.notes} onChange={set('notes')} placeholder="Any notes..." rows={3} />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {conflict ? (
            <Button variant="primary" onClick={handleTransferRequest}>
              <ArrowLeftRight size={14} className="mr-1.5" />Submit Transfer Request
            </Button>
          ) : (
            <Button variant="primary" onClick={handleAllocate}>Allocate Asset</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Return Modal ──────────────────────────────────────────────
function ReturnModal({ open, onClose, allocation, assetName }) {
  const { returnAsset } = useAppData();
  const { currentUser } = useAuth();
  const toast = useToast();
  const [notes, setNotes] = useState('');

  const handleReturn = () => {
    returnAsset(allocation.id, notes, currentUser);
    toast(`${assetName} returned successfully`, 'success');
    setNotes('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Return Asset — ${assetName}`}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Capture the condition of the asset at check-in. The asset will revert to Available.</p>
        <Textarea label="Condition Check-in Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Good condition, minor scratches..." rows={4} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleReturn}>Confirm Return</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AllocationPage() {
  const { currentUser } = useAuth();
  const { assets, users, allocations, transferRequests, resolveTransfer } = useAppData();
  const toast = useToast();

  const [tab, setTab] = useState('active');
  const [allocateModal, setAllocateModal] = useState(false);
  const [returnModal, setReturnModal] = useState({ open: false, allocation: null });

  const canManage = [ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPT_HEAD].includes(currentUser?.role);

  const today = new Date();

  const activeAllocations = useMemo(() =>
    allocations.filter(a => !a.returnDate).map(a => ({
      ...a,
      asset: assets.find(x => x.id === a.assetId),
      toUser: users.find(u => u.id === a.assignedTo),
      byUser: users.find(u => u.id === a.assignedBy),
      isOverdue: a.expectedReturnDate && new Date(a.expectedReturnDate) < today,
    })), [allocations, assets, users]);

  const pendingTransfers = useMemo(() =>
    transferRequests.filter(t => t.status === TRANSFER_STATUSES.REQUESTED).map(t => ({
      ...t,
      asset: assets.find(a => a.id === t.assetId),
      fromUser: users.find(u => u.id === t.fromUserId),
      toUser: users.find(u => u.id === t.toUserId),
    })), [transferRequests, assets, users]);

  const allTransfers = useMemo(() =>
    transferRequests.map(t => ({
      ...t,
      asset: assets.find(a => a.id === t.assetId),
      fromUser: users.find(u => u.id === t.fromUserId),
      toUser: users.find(u => u.id === t.toUserId),
    })), [transferRequests, assets, users]);

  const handleResolve = (id, approved) => {
    resolveTransfer(id, approved, currentUser);
    toast(approved ? 'Transfer approved' : 'Transfer rejected', approved ? 'success' : 'warning');
  };

  const tabs = [
    { id: 'active', label: `Active Allocations (${activeAllocations.length})` },
    { id: 'transfers', label: `Transfer Requests (${pendingTransfers.length})` },
    { id: 'history', label: 'All Transfers' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Allocation & Transfer</h1>
          <p className="text-slate-500 mt-1">Manage asset assignments and transfer workflows</p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={() => setAllocateModal(true)}>
            <Plus size={14} className="mr-1.5" />Allocate Asset
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Active Allocations */}
      {tab === 'active' && (
        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Asset', 'Assigned To', 'Allocated By', 'Date', 'Return Date', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeAllocations.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No active allocations</td></tr>
              ) : activeAllocations.map(a => (
                <tr key={a.id} className={`hover:bg-slate-50 transition-colors ${a.isOverdue ? 'bg-red-50/50' : ''}`}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{a.asset?.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{a.asset?.tag}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{a.toUser?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{a.byUser?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{a.allocationDate}</td>
                  <td className="px-6 py-4 text-sm">
                    {a.expectedReturnDate
                      ? <span className={a.isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                          {a.isOverdue && <AlertTriangle size={12} className="inline mr-1" />}
                          {a.expectedReturnDate}
                        </span>
                      : <span className="text-slate-400">—</span>
                    }
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={a.isOverdue ? 'Lost' : 'Allocated'} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canManage && (
                      <button
                        onClick={() => setReturnModal({ open: true, allocation: a })}
                        className="flex items-center gap-1.5 text-xs text-slate-600 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <RotateCcw size={12} />Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Pending Transfers */}
      {tab === 'transfers' && (
        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Asset', 'From', 'To', 'Reason', 'Requested', ''].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pendingTransfers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No pending transfer requests</td></tr>
              ) : pendingTransfers.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{t.asset?.name}</p>
                    <p className="text-xs font-mono text-slate-400">{t.asset?.tag}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{t.fromUser?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{t.toUser?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{t.reason}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    {canManage && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleResolve(t.id, true)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                          <Check size={16} />
                        </button>
                        <button onClick={() => handleResolve(t.id, false)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* All Transfers History */}
      {tab === 'history' && (
        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Asset', 'From', 'To', 'Status', 'Requested', 'Resolved'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allTransfers.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{t.asset?.name}</p>
                    <p className="text-xs font-mono text-slate-400">{t.asset?.tag}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{t.fromUser?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{t.toUser?.name || '—'}</td>
                  <td className="px-6 py-4"><StatusPill status={t.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <AllocateModal open={allocateModal} onClose={() => setAllocateModal(false)} />
      {returnModal.allocation && (
        <ReturnModal
          open={returnModal.open}
          onClose={() => setReturnModal({ open: false, allocation: null })}
          allocation={returnModal.allocation}
          assetName={returnModal.allocation.asset?.name || 'Asset'}
        />
      )}
    </div>
  );
}
