import { useState, useMemo } from 'react';
import { Plus, Edit2, Check, X as XIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { ROLES } from '../data/mockData';
import { Navigate } from 'react-router-dom';
import Card from '../components/common/Card';
import StatusPill from '../components/common/StatusPill';
import Modal from '../components/common/Modal';
import { Input, Select } from '../components/common/Input';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';

// ── Department Modal ──────────────────────────────────────────
function DeptModal({ open, onClose, initial, departments, users }) {
  const { saveDepartment } = useAppData();
  const toast = useToast();
  const [form, setForm] = useState(initial || { name: '', headId: '', parentId: '', status: 'Active' });
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const heads = users.filter(u => u.role === ROLES.DEPT_HEAD || u.role === ROLES.ADMIN);

  const handleSave = () => {
    if (!form.name.trim()) { toast('Department name is required', 'error'); return; }
    saveDepartment({ ...form, id: initial?.id });
    toast(initial ? 'Department updated' : 'Department created', 'success');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Department' : 'New Department'}>
      <div className="space-y-4">
        <Input label="Name" value={form.name} onChange={set('name')} placeholder="e.g. Engineering" />
        <Select label="Department Head (optional)" value={form.headId} onChange={set('headId')}>
          <option value="">None</option>
          {heads.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        <Select label="Parent Department (optional)" value={form.parentId} onChange={set('parentId')}>
          <option value="">None (Top-level)</option>
          {departments.filter(d => d.id !== initial?.id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Select label="Status" value={form.status} onChange={set('status')}>
          <option>Active</option>
          <option>Inactive</option>
        </Select>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Category Modal ────────────────────────────────────────────
function CategoryModal({ open, onClose, initial }) {
  const { saveCategory } = useAppData();
  const toast = useToast();
  const [form, setForm] = useState(initial || { name: '', customFields: [] });
  const [newField, setNewField] = useState('');

  const addField = () => {
    if (!newField.trim()) return;
    setForm(p => ({ ...p, customFields: [...p.customFields, { label: newField, type: 'text' }] }));
    setNewField('');
  };

  const removeField = (idx) => setForm(p => ({ ...p, customFields: p.customFields.filter((_, i) => i !== idx) }));

  const handleSave = () => {
    if (!form.name.trim()) { toast('Category name is required', 'error'); return; }
    saveCategory({ ...form, id: initial?.id });
    toast(initial ? 'Category updated' : 'Category created', 'success');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Category' : 'New Category'}>
      <div className="space-y-4">
        <Input label="Category Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Electronics" />
        <div>
          <p className="block text-sm font-medium text-slate-700 mb-2">Custom Fields</p>
          {form.customFields.map((f, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <span className="flex-1 text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-2">{f.label}</span>
              <button onClick={() => removeField(i)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                <XIcon size={14} />
              </button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Add field name..."
              value={newField}
              onChange={e => setNewField(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addField()}
            />
            <Button variant="secondary" onClick={addField}><Plus size={14} /></Button>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Role Promotion Modal ──────────────────────────────────────
function PromoteModal({ open, onClose, user }) {
  const { updateUserRole } = useAppData();
  const { currentUser } = useAuth();
  const toast = useToast();
  const [role, setRole] = useState(user?.role || ROLES.EMPLOYEE);

  const promotableRoles = [ROLES.EMPLOYEE, ROLES.DEPT_HEAD, ROLES.ASSET_MANAGER];

  const handleSave = () => {
    updateUserRole(user.id, role, currentUser);
    toast(`${user.name} promoted to ${role}`, 'success');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Manage Role — ${user?.name}`}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Select a role to assign. Only Admins can perform this action.</p>
        <div className="space-y-2">
          {promotableRoles.map(r => (
            <label key={r} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors
              ${role === r ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="accent-blue-600" />
              <span className="text-sm font-medium text-slate-900">{r}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Role</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function OrgSetupPage() {
  const { currentUser } = useAuth();
  const { departments, categories, users } = useAppData();
  const [tab, setTab] = useState('departments');
  const [deptModal, setDeptModal] = useState({ open: false, initial: null });
  const [catModal, setCatModal] = useState({ open: false, initial: null });
  const [promoteModal, setPromoteModal] = useState({ open: false, user: null });
  const [search, setSearch] = useState('');

  if (currentUser?.role !== ROLES.ADMIN) return <Navigate to="/dashboard" replace />;

  const tabs = [
    { id: 'departments', label: 'Departments' },
    { id: 'categories',  label: 'Asset Categories' },
    { id: 'employees',   label: 'Employee Directory' },
  ];

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const getDeptName = (id) => departments.find(d => d.id === id)?.name || '—';
  const getHeadName = (id) => users.find(u => u.id === id)?.name || '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Organization Setup</h1>
        <p className="text-slate-500 mt-1">Manage departments, categories, and team members</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-100 rounded-2xl p-1 w-full sm:w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 sm:flex-none text-center px-5 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Departments */}
      {tab === 'departments' && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 gap-4">
            <h2 className="text-base font-medium text-slate-900">Departments ({departments.length})</h2>
            <Button variant="primary" onClick={() => setDeptModal({ open: true, initial: null })} className="w-full sm:w-auto justify-center">
              <Plus size={14} className="mr-1.5" /> Add Department
            </Button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                {['Name', 'Head', 'Parent', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {departments.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{d.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{getHeadName(d.headId)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{getDeptName(d.parentId)}</td>
                  <td className="px-6 py-4"><StatusPill status={d.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setDeptModal({ open: true, initial: d })}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Categories */}
      {tab === 'categories' && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 gap-4">
            <h2 className="text-base font-medium text-slate-900">Asset Categories ({categories.length})</h2>
            <Button variant="primary" onClick={() => setCatModal({ open: true, initial: null })} className="w-full sm:w-auto justify-center">
              <Plus size={14} className="mr-1.5" /> Add Category
            </Button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                {['Category', 'Custom Fields', ''].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {categories.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{c.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {c.customFields.length === 0
                        ? <span className="text-xs text-slate-400">None</span>
                        : c.customFields.map(f => (
                            <span key={f.label} className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5">{f.label}</span>
                          ))
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setCatModal({ open: true, initial: c })}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Employee Directory */}
      {tab === 'employees' && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 gap-4">
            <h2 className="text-base font-medium text-slate-900">Employee Directory ({users.length})</h2>
            <input
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full sm:w-64"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                {['Name', 'Email', 'Department', 'Role', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 text-xs font-semibold">{u.avatar}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{getDeptName(u.departmentId)}</td>
                  <td className="px-6 py-4"><StatusPill status={u.role} /></td>
                  <td className="px-6 py-4"><StatusPill status={u.status} /></td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== currentUser.id && (
                      <button
                        onClick={() => setPromoteModal({ open: true, user: u })}
                        className="text-xs text-blue-600 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Manage Role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <DeptModal
        open={deptModal.open}
        onClose={() => setDeptModal({ open: false, initial: null })}
        initial={deptModal.initial}
        departments={departments}
        users={users}
      />
      <CategoryModal
        open={catModal.open}
        onClose={() => setCatModal({ open: false, initial: null })}
        initial={catModal.initial}
      />
      {promoteModal.user && (
        <PromoteModal
          open={promoteModal.open}
          onClose={() => setPromoteModal({ open: false, user: null })}
          user={promoteModal.user}
        />
      )}
    </div>
  );
}
