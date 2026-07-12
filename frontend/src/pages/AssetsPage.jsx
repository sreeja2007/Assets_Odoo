import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal, Package, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { ASSET_STATUSES, ROLES } from '../data/mockData';
import Card from '../components/common/Card';
import StatusPill from '../components/common/StatusPill';
import Modal from '../components/common/Modal';
import { Input, Select, Textarea } from '../components/common/Input';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';

// ── Register/Edit Modal ───────────────────────────────────────
function AssetModal({ open, onClose, initial }) {
  const { categories, registerAsset, updateAsset } = useAppData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const blank = { name: '', categoryId: '', serialNumber: '', acquisitionDate: '', acquisitionCost: '', condition: 'Good', location: '', isBookable: false, customFields: {} };
  const [form, setForm] = useState(initial || blank);
  const [errors, setErrors] = useState({});

  useEffect(() => { setForm(initial || blank); }, [initial, open]);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const selectedCat = categories.find(c => c.id === form.categoryId);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!form.categoryId) e.categoryId = 'Category required';
    if (!form.location.trim()) e.location = 'Location required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (initial) {
      updateAsset(initial.id, form);
      toast('Asset updated', 'success');
    } else {
      registerAsset(form, currentUser);
      toast('Asset registered', 'success');
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Asset' : 'Register Asset'} maxWidth="max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Asset Name" value={form.name} onChange={set('name')} error={errors.name} placeholder="e.g. MacBook Pro" className="col-span-1 sm:col-span-2" />
        <Select label="Category" value={form.categoryId} onChange={set('categoryId')} error={errors.categoryId}>
          <option value="">Select category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Input label="Serial Number" value={form.serialNumber} onChange={set('serialNumber')} placeholder="e.g. C02XG0JF" />
        <Input label="Acquisition Date" type="date" value={form.acquisitionDate} onChange={set('acquisitionDate')} />
        <Input label="Acquisition Cost ($)" type="number" value={form.acquisitionCost} onChange={set('acquisitionCost')} placeholder="0" />
        <Select label="Condition" value={form.condition} onChange={set('condition')}>
          {['Excellent', 'Good', 'Fair', 'Poor', 'N/A'].map(c => <option key={c}>{c}</option>)}
        </Select>
        <Input label="Location" value={form.location} onChange={set('location')} error={errors.location} placeholder="e.g. Engineering Lab" />
 
        {selectedCat?.customFields?.length > 0 && (
          <div className="col-span-1 sm:col-span-2 border-t border-slate-100 pt-4 space-y-4">
            <p className="text-sm font-medium text-slate-700">Category-specific fields</p>
            {selectedCat.customFields.map(f => (
              <Input
                key={f.label}
                label={f.label}
                type={f.type || 'text'}
                value={form.customFields?.[f.label] || ''}
                onChange={e => setForm(p => ({ ...p, customFields: { ...p.customFields, [f.label]: e.target.value } }))}
              />
            ))}
          </div>
        )}
 
        <label className="col-span-1 sm:col-span-2 flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.isBookable} onChange={set('isBookable')} className="w-4 h-4 accent-blue-600 rounded" />
          <span className="text-sm text-slate-700">Mark as shared / bookable resource</span>
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>{initial ? 'Save Changes' : 'Register Asset'}</Button>
      </div>
    </Modal>
  );
}

// ── History Drawer ────────────────────────────────────────────
function HistoryModal({ open, onClose, asset }) {
  const { allocations, maintenanceRequests, users } = useAppData();
  if (!asset) return null;

  const assetAllocs = allocations.filter(a => a.assetId === asset.id);
  const assetMaint = maintenanceRequests.filter(m => m.assetId === asset.id);
  const getUser = id => users.find(u => u.id === id)?.name || '—';

  return (
    <Modal open={open} onClose={onClose} title={`History — ${asset.name}`}>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Allocation History</h3>
          {assetAllocs.length === 0
            ? <p className="text-sm text-slate-400">No allocation history</p>
            : <ul className="space-y-2">
                {assetAllocs.map(a => (
                  <li key={a.id} className="flex justify-between text-sm bg-slate-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{getUser(a.assignedTo)}</p>
                      <p className="text-slate-500 text-xs">{a.allocationDate} → {a.returnDate || 'Active'}</p>
                    </div>
                    <StatusPill status={a.returnDate ? 'Completed' : 'Allocated'} />
                  </li>
                ))}
              </ul>
          }
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Maintenance History</h3>
          {assetMaint.length === 0
            ? <p className="text-sm text-slate-400">No maintenance history</p>
            : <ul className="space-y-2">
                {assetMaint.map(m => (
                  <li key={m.id} className="flex justify-between text-sm bg-slate-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{m.issue}</p>
                      <p className="text-slate-500 text-xs">{new Date(m.createdAt).toLocaleDateString()}</p>
                    </div>
                    <StatusPill status={m.status} />
                  </li>
                ))}
              </ul>
          }
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────
const ALL_STATUSES = Object.values(ASSET_STATUSES);

export default function AssetsPage() {
  const { currentUser } = useAuth();
  const { assets, categories, departments } = useAppData();
  const [params] = useSearchParams();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [assetModal, setAssetModal] = useState({ open: false, initial: null });
  const [historyModal, setHistoryModal] = useState({ open: false, asset: null });

  // Open register modal if action param is set
  useEffect(() => {
    if (params.get('action') === 'register') setAssetModal({ open: true, initial: null });
  }, [params]);

  const canManage = [ROLES.ADMIN, ROLES.ASSET_MANAGER].includes(currentUser?.role);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter(a => {
      if (filterCat && a.categoryId !== filterCat) return false;
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterDept && a.departmentId !== filterDept) return false;
      if (q && !a.name.toLowerCase().includes(q) && !a.tag.toLowerCase().includes(q) && !a.serialNumber.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assets, filterCat, filterStatus, filterDept, search]);

  const getCatName = id => categories.find(c => c.id === id)?.name || '—';
  const getDeptName = id => departments.find(d => d.id === id)?.name || '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Asset Directory</h1>
          <p className="text-slate-500 mt-1">{assets.length} total assets</p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={() => setAssetModal({ open: true, initial: null })} className="w-full sm:w-auto justify-center">
            <Plus size={14} className="mr-1.5" />Register Asset
          </Button>
        )}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full md:flex-1 md:min-w-64">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Search by name, tag, or serial..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {(filterCat || filterStatus || filterDept || search) && (
          <button onClick={() => { setFilterCat(''); setFilterStatus(''); setFilterDept(''); setSearch(''); }} className="text-sm text-blue-600 hover:underline w-full sm:w-auto text-left sm:text-center mt-1 sm:mt-0">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Tag', 'Name', 'Category', 'Status', 'Location', 'Department', 'Condition', ''].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">No assets found</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">{a.tag}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{a.name}</span>
                      {a.isBookable && <span className="text-xs bg-teal-50 text-teal-700 rounded-full px-2 py-0.5">Bookable</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{getCatName(a.categoryId)}</td>
                  <td className="px-6 py-4"><StatusPill status={a.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{a.location}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{getDeptName(a.departmentId)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{a.condition}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setHistoryModal({ open: true, asset: a })}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        title="View history"
                      >
                        <History size={14} />
                      </button>
                      {canManage && (
                        <button
                          onClick={() => setAssetModal({ open: true, initial: a })}
                          className="text-xs text-blue-600 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AssetModal
        open={assetModal.open}
        onClose={() => setAssetModal({ open: false, initial: null })}
        initial={assetModal.initial}
      />
      <HistoryModal
        open={historyModal.open}
        onClose={() => setHistoryModal({ open: false, asset: null })}
        asset={historyModal.asset}
      />
    </div>
  );
}
