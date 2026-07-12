import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, CalendarDays, Clock, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { BOOKING_STATUSES } from '../data/mockData';
import Card from '../components/common/Card';
import StatusPill from '../components/common/StatusPill';
import Modal from '../components/common/Modal';
import { Input, Select, Textarea } from '../components/common/Input';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';

// ── Book Modal ────────────────────────────────────────────────
function BookModal({ open, onClose, preSelectedAsset }) {
  const { assets, createBooking, checkBookingConflict } = useAppData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const bookableAssets = assets.filter(a => a.isBookable);
  const [form, setForm] = useState({ assetId: preSelectedAsset || '', title: '', startTime: '', endTime: '', notes: '' });
  const [conflict, setConflict] = useState(false);

  useEffect(() => { setForm(p => ({ ...p, assetId: preSelectedAsset || '' })); }, [preSelectedAsset]);

  const set = f => e => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    setConflict(false);
  };

  const checkAndSet = (f) => e => {
    const updated = { ...form, [f]: e.target.value };
    setForm(updated);
    if (updated.assetId && updated.startTime && updated.endTime) {
      setConflict(checkBookingConflict(updated.assetId, updated.startTime, updated.endTime));
    }
  };

  const validate = () => {
    if (!form.assetId || !form.title || !form.startTime || !form.endTime) {
      toast('Please fill all required fields', 'error'); return false;
    }
    if (new Date(form.startTime) >= new Date(form.endTime)) {
      toast('End time must be after start time', 'error'); return false;
    }
    return true;
  };

  const handleBook = () => {
    if (!validate()) return;
    if (conflict) { toast('This time slot overlaps with an existing booking.', 'error'); return; }
    const result = createBooking(form, currentUser);
    if (!result.success) { toast(result.error, 'error'); return; }
    toast('Resource booked successfully', 'success');
    setForm({ assetId: '', title: '', startTime: '', endTime: '', notes: '' });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Book Resource">
      <div className="space-y-4">
        <Select label="Resource" value={form.assetId} onChange={set('assetId')}>
          <option value="">Select a bookable resource</option>
          {bookableAssets.map(a => <option key={a.id} value={a.id}>{a.name} — {a.location}</option>)}
        </Select>
        <Input label="Booking Title" value={form.title} onChange={set('title')} placeholder="e.g. Sprint Planning" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Time" type="datetime-local" value={form.startTime} onChange={checkAndSet('startTime')} />
          <Input label="End Time" type="datetime-local" value={form.endTime} onChange={checkAndSet('endTime')} />
        </div>

        {conflict && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">This time slot overlaps with an existing booking. Please choose a different time.</p>
          </div>
        )}

        <Textarea label="Notes (optional)" value={form.notes} onChange={set('notes')} rows={3} placeholder="Any notes..." />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleBook} disabled={conflict}>Book Resource</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Timeline View ─────────────────────────────────────────────
function BookingTimeline({ bookings, assets, users, onCancel, canCancel }) {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8am–8pm
  const today = new Date().toISOString().split('T')[0];

  const dayBookings = bookings.filter(b => {
    const d = new Date(b.startTime).toISOString().split('T')[0];
    return d === today;
  });

  const statusColors = {
    Upcoming: 'bg-blue-100 border-blue-300 text-blue-800',
    Ongoing:  'bg-emerald-100 border-emerald-300 text-emerald-800',
    Completed:'bg-slate-100 border-slate-300 text-slate-500',
    Cancelled:'bg-red-50 border-red-200 text-red-400 line-through',
  };

  if (dayBookings.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
        <p>No bookings scheduled for today</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Hour markers */}
        <div className="flex border-b border-slate-100 mb-4">
          <div className="w-32 flex-shrink-0" />
          {hours.map(h => (
            <div key={h} className="flex-1 text-center text-xs text-slate-400 pb-2">
              {h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {dayBookings.map(b => {
            const asset = assets.find(a => a.id === b.assetId);
            const user = users.find(u => u.id === b.bookedBy);
            const start = new Date(b.startTime);
            const end = new Date(b.endTime);
            const startH = start.getHours() + start.getMinutes() / 60;
            const endH = end.getHours() + end.getMinutes() / 60;
            const left = ((startH - 8) / 12) * 100;
            const width = ((endH - startH) / 12) * 100;
            const colors = statusColors[b.status] || statusColors.Upcoming;

            return (
              <div key={b.id} className="flex items-center gap-4">
                <div className="w-32 flex-shrink-0 text-xs text-slate-600 font-medium text-right pr-4 leading-tight">
                  {asset?.name}
                </div>
                <div className="flex-1 relative h-10 bg-slate-50 rounded-xl overflow-hidden">
                  <div
                    className={`absolute top-1 bottom-1 rounded-lg border text-xs flex items-center px-2 font-medium overflow-hidden whitespace-nowrap ${colors}`}
                    style={{ left: `${Math.max(0, left)}%`, width: `${Math.max(5, width)}%` }}
                    title={`${b.title} — ${user?.name}`}
                  >
                    {b.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function BookingPage() {
  const { currentUser } = useAuth();
  const { bookings, assets, users, updateBooking } = useAppData();
  const [params] = useSearchParams();
  const toast = useToast();

  const [tab, setTab] = useState('upcoming');
  const [bookModal, setBookModal] = useState({ open: false, assetId: null });

  useEffect(() => {
    if (params.get('action') === 'book') setBookModal({ open: true, assetId: null });
  }, [params]);

  const [filterAsset, setFilterAsset] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const bookableAssets = assets.filter(a => a.isBookable);

  const handleCancel = (id) => {
    updateBooking(id, { status: BOOKING_STATUSES.CANCELLED });
    toast('Booking cancelled', 'success');
  };

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      if (filterAsset && b.assetId !== filterAsset) return false;
      if (filterStatus && b.status !== filterStatus) return false;
      if (tab === 'upcoming') return b.status === BOOKING_STATUSES.UPCOMING || b.status === BOOKING_STATUSES.ONGOING;
      if (tab === 'history') return b.status === BOOKING_STATUSES.COMPLETED || b.status === BOOKING_STATUSES.CANCELLED;
      return true;
    });
  }, [bookings, filterAsset, filterStatus, tab]);

  const getAsset = id => assets.find(a => a.id === id);
  const getUser = id => users.find(u => u.id === id);

  const tabs = [
    { id: 'timeline', label: 'Today\'s Timeline' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Resource Booking</h1>
          <p className="text-slate-500 mt-1">Schedule and manage shared resource bookings</p>
        </div>
        <Button variant="primary" onClick={() => setBookModal({ open: true, assetId: null })}>
          <Plus size={14} className="mr-1.5" />Book Resource
        </Button>
      </div>

      {/* Bookable resources quick list */}
      <div className="flex flex-wrap gap-3">
        {bookableAssets.map(a => (
          <button
            key={a.id}
            onClick={() => setBookModal({ open: true, assetId: a.id })}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
          >
            <CalendarDays size={15} />
            {a.name}
            <span className="text-xs text-slate-400">{a.location}</span>
          </button>
        ))}
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

      {/* Timeline */}
      {tab === 'timeline' && (
        <Card className="p-6">
          <h2 className="text-base font-medium text-slate-900 mb-4">Today's Bookings — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          <BookingTimeline bookings={bookings} assets={assets} users={users} onCancel={handleCancel} canCancel />
        </Card>
      )}

      {/* List view */}
      {(tab === 'upcoming' || tab === 'history') && (
        <>
          <div className="flex gap-3">
            <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500" value={filterAsset} onChange={e => setFilterAsset(e.target.value)}>
              <option value="">All Resources</option>
              {bookableAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {Object.values(BOOKING_STATUSES).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Card>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Resource', 'Title', 'Booked By', 'Start', 'End', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No bookings found</td></tr>
                ) : filtered.map(b => {
                  const asset = getAsset(b.assetId);
                  const user = getUser(b.bookedBy);
                  const isOwner = b.bookedBy === currentUser.id;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{asset?.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{b.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{user?.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400" />
                          {new Date(b.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(b.endTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4"><StatusPill status={b.status} /></td>
                      <td className="px-6 py-4 text-right">
                        {isOwner && b.status === BOOKING_STATUSES.UPCOMING && (
                          <button onClick={() => handleCancel(b.id)} className="flex items-center gap-1 text-xs text-red-500 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                            <X size={12} />Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <BookModal
        open={bookModal.open}
        onClose={() => setBookModal({ open: false, assetId: null })}
        preSelectedAsset={bookModal.assetId}
      />
    </div>
  );
}
