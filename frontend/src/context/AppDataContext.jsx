import { createContext, useContext, useState, useCallback } from 'react';
import {
  assets as initAssets,
  users as initUsers,
  departments as initDepartments,
  categories as initCategories,
  allocations as initAllocations,
  transferRequests as initTransfers,
  maintenanceRequests as initMaintenance,
  bookings as initBookings,
  auditCycles as initAuditCycles,
  activityLogs as initLogs,
  notifications as initNotifications,
  ASSET_STATUSES,
  MAINTENANCE_STATUSES,
  TRANSFER_STATUSES,
  AUDIT_ITEM_STATUSES,
} from '../data/mockData';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [assets, setAssets] = useState(initAssets);
  const [users, setUsers] = useState(initUsers);
  const [departments, setDepartments] = useState(initDepartments);
  const [categories, setCategories] = useState(initCategories);
  const [allocations, setAllocations] = useState(initAllocations);
  const [transferRequests, setTransferRequests] = useState(initTransfers);
  const [maintenanceRequests, setMaintenanceRequests] = useState(initMaintenance);
  const [bookings, setBookings] = useState(initBookings);
  const [auditCycles, setAuditCycles] = useState(initAuditCycles);
  const [activityLogs, setActivityLogs] = useState(initLogs);
  const [notifications, setNotifications] = useState(initNotifications);

  const addLog = useCallback((log) => {
    setActivityLogs(prev => [{ id: `log${Date.now()}`, timestamp: new Date().toISOString(), ...log }, ...prev]);
  }, []);

  const addNotification = useCallback((notif) => {
    setNotifications(prev => [{ id: `n${Date.now()}`, read: false, timestamp: new Date().toISOString(), ...notif }, ...prev]);
  }, []);

  // ── Asset actions ────────────────────────────────────────────
  const registerAsset = useCallback((assetData, currentUser) => {
    const newAsset = {
      id: `a${Date.now()}`,
      tag: `AF-${String(assets.length + 1).padStart(4, '0')}`,
      status: ASSET_STATUSES.AVAILABLE,
      assignedTo: null,
      departmentId: null,
      expectedReturnDate: null,
      photo: null,
      customFields: {},
      ...assetData,
    };
    setAssets(prev => [...prev, newAsset]);
    addLog({ type: 'Registration', userId: currentUser.id, targetId: newAsset.id, message: `Registered new asset: ${newAsset.name} (${newAsset.tag})` });
    return newAsset;
  }, [assets.length, addLog]);

  const updateAsset = useCallback((id, updates) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  // ── Allocation actions ────────────────────────────────────────
  const allocateAsset = useCallback((assetId, toUserId, toDeptId, returnDate, notes, currentUser) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset || asset.status === ASSET_STATUSES.ALLOCATED) return { success: false, error: 'Asset is already allocated.' };

    const alloc = {
      id: `al${Date.now()}`, assetId, assignedTo: toUserId,
      assignedBy: currentUser.id, allocationDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: returnDate, returnDate: null, conditionOnReturn: null, notes,
    };
    setAllocations(prev => [...prev, alloc]);
    updateAsset(assetId, { status: ASSET_STATUSES.ALLOCATED, assignedTo: toUserId, departmentId: toDeptId, expectedReturnDate: returnDate });
    const toUser = users.find(u => u.id === toUserId);
    addLog({ type: 'Allocation', userId: currentUser.id, targetId: assetId, message: `Allocated ${asset.name} to ${toUser?.name}` });
    return { success: true };
  }, [assets, users, updateAsset, addLog]);

  const returnAsset = useCallback((allocationId, conditionNotes, currentUser) => {
    const alloc = allocations.find(a => a.id === allocationId);
    if (!alloc) return;
    setAllocations(prev => prev.map(a => a.id === allocationId
      ? { ...a, returnDate: new Date().toISOString().split('T')[0], conditionOnReturn: conditionNotes }
      : a));
    updateAsset(alloc.assetId, { status: ASSET_STATUSES.AVAILABLE, assignedTo: null, departmentId: null, expectedReturnDate: null });
    const asset = assets.find(a => a.id === alloc.assetId);
    addLog({ type: 'Return', userId: currentUser.id, targetId: alloc.assetId, message: `${asset?.name} returned. Condition: ${conditionNotes || 'Good'}` });
  }, [allocations, assets, updateAsset, addLog]);

  // ── Transfer actions ─────────────────────────────────────────
  const requestTransfer = useCallback((assetId, fromUserId, toUserId, reason, currentUser) => {
    const req = {
      id: `tr${Date.now()}`, assetId, fromUserId, toUserId,
      requestedBy: currentUser.id, status: TRANSFER_STATUSES.REQUESTED,
      reason, createdAt: new Date().toISOString(), resolvedAt: null,
    };
    setTransferRequests(prev => [...prev, req]);
    const asset = assets.find(a => a.id === assetId);
    addLog({ type: 'Transfer', userId: currentUser.id, targetId: req.id, message: `Transfer request raised for ${asset?.name}` });
    return req;
  }, [assets, addLog]);

  const resolveTransfer = useCallback((transferId, approved, currentUser) => {
    const transfer = transferRequests.find(t => t.id === transferId);
    if (!transfer) return;
    const newStatus = approved ? TRANSFER_STATUSES.APPROVED : TRANSFER_STATUSES.REJECTED;
    setTransferRequests(prev => prev.map(t => t.id === transferId
      ? { ...t, status: newStatus, resolvedAt: new Date().toISOString() }
      : t));
    if (approved) {
      updateAsset(transfer.assetId, { assignedTo: transfer.toUserId });
    }
    const asset = assets.find(a => a.id === transfer.assetId);
    addLog({ type: 'Approval', userId: currentUser.id, targetId: transferId, message: `${approved ? 'Approved' : 'Rejected'} transfer for ${asset?.name}` });
  }, [transferRequests, assets, updateAsset, addLog]);

  // ── Maintenance actions ───────────────────────────────────────
  const createMaintenanceRequest = useCallback((data, currentUser) => {
    const req = {
      id: `m${Date.now()}`, ...data,
      requestedBy: currentUser.id,
      status: MAINTENANCE_STATUSES.PENDING,
      assignedTechnician: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null, notes: '',
    };
    setMaintenanceRequests(prev => [...prev, req]);
    const asset = assets.find(a => a.id === data.assetId);
    addLog({ type: 'Maintenance', userId: currentUser.id, targetId: req.id, message: `Raised maintenance request for ${asset?.name}` });
    return req;
  }, [assets, addLog]);

  const updateMaintenanceStatus = useCallback((id, status, technicianId, notes, currentUser) => {
    setMaintenanceRequests(prev => prev.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, status, notes: notes || m.notes };
      if (technicianId) updated.assignedTechnician = technicianId;
      if (status === MAINTENANCE_STATUSES.RESOLVED) updated.resolvedAt = new Date().toISOString();
      return updated;
    }));
    const req = maintenanceRequests.find(m => m.id === id);
    const asset = assets.find(a => a.id === req?.assetId);
    if (status === MAINTENANCE_STATUSES.APPROVED) {
      updateAsset(req?.assetId, { status: ASSET_STATUSES.UNDER_MAINTENANCE });
    }
    if (status === MAINTENANCE_STATUSES.RESOLVED) {
      updateAsset(req?.assetId, { status: ASSET_STATUSES.AVAILABLE });
    }
    addLog({ type: 'Maintenance', userId: currentUser.id, targetId: id, message: `Maintenance for ${asset?.name} updated to ${status}` });
  }, [maintenanceRequests, assets, updateAsset, addLog]);

  // ── Booking actions ───────────────────────────────────────────
  const checkBookingConflict = useCallback((assetId, start, end, excludeId = null) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return bookings.filter(b => b.assetId === assetId && b.id !== excludeId && b.status !== 'Cancelled')
      .some(b => {
        const bs = new Date(b.startTime).getTime();
        const be = new Date(b.endTime).getTime();
        return s < be && e > bs;
      });
  }, [bookings]);

  const createBooking = useCallback((data, currentUser) => {
    if (checkBookingConflict(data.assetId, data.startTime, data.endTime)) {
      return { success: false, error: 'This time slot overlaps with an existing booking.' };
    }
    const booking = {
      id: `b${Date.now()}`, ...data,
      bookedBy: currentUser.id,
      status: 'Upcoming',
    };
    setBookings(prev => [...prev, booking]);
    addLog({ type: 'Booking', userId: currentUser.id, targetId: booking.id, message: `Booked resource for "${data.title}"` });
    return { success: true, booking };
  }, [checkBookingConflict, addLog]);

  const updateBooking = useCallback((id, updates) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  // ── Audit actions ─────────────────────────────────────────────
  const createAuditCycle = useCallback((data, currentUser) => {
    const cycle = { id: `ac${Date.now()}`, status: 'Open', items: [], ...data };
    setAuditCycles(prev => [...prev, cycle]);
    addLog({ type: 'Audit', userId: currentUser.id, targetId: cycle.id, message: `Created audit cycle: ${data.name}` });
    return cycle;
  }, [addLog]);

  const updateAuditItem = useCallback((cycleId, assetId, status, notes) => {
    setAuditCycles(prev => prev.map(cycle => {
      if (cycle.id !== cycleId) return cycle;
      const existing = cycle.items.find(i => i.assetId === assetId);
      const items = existing
        ? cycle.items.map(i => i.assetId === assetId ? { ...i, status, notes } : i)
        : [...cycle.items, { assetId, status, notes }];
      return { ...cycle, items };
    }));
  }, []);

  const closeAuditCycle = useCallback((cycleId, currentUser) => {
    const cycle = auditCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    cycle.items.forEach(item => {
      if (item.status === AUDIT_ITEM_STATUSES.MISSING) {
        updateAsset(item.assetId, { status: ASSET_STATUSES.LOST });
      }
    });
    setAuditCycles(prev => prev.map(c => c.id === cycleId ? { ...c, status: 'Closed' } : c));
    addLog({ type: 'Audit', userId: currentUser.id, targetId: cycleId, message: `Closed audit cycle: ${cycle.name}` });
  }, [auditCycles, updateAsset, addLog]);

  // ── Department & Category actions ─────────────────────────────
  const saveDepartment = useCallback((data) => {
    if (data.id) {
      setDepartments(prev => prev.map(d => d.id === data.id ? { ...d, ...data } : d));
    } else {
      setDepartments(prev => [...prev, { id: `d${Date.now()}`, ...data }]);
    }
  }, []);

  const saveCategory = useCallback((data) => {
    if (data.id) {
      setCategories(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c));
    } else {
      setCategories(prev => [...prev, { id: `c${Date.now()}`, customFields: [], ...data }]);
    }
  }, []);

  const updateUserRole = useCallback((userId, newRole, currentUser) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    const target = users.find(u => u.id === userId);
    addLog({ type: 'Admin', userId: currentUser.id, targetId: userId, message: `Promoted ${target?.name} to ${newRole}` });
  }, [users, addLog]);

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback((userId) => {
    setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, read: true } : n));
  }, []);

  return (
    <AppDataContext.Provider value={{
      assets, users, departments, categories,
      allocations, transferRequests, maintenanceRequests,
      bookings, auditCycles, activityLogs, notifications,
      registerAsset, updateAsset,
      allocateAsset, returnAsset,
      requestTransfer, resolveTransfer,
      createMaintenanceRequest, updateMaintenanceStatus,
      checkBookingConflict, createBooking, updateBooking,
      createAuditCycle, updateAuditItem, closeAuditCycle,
      saveDepartment, saveCategory, updateUserRole,
      markNotificationRead, markAllNotificationsRead,
      addLog,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export const useAppData = () => useContext(AppDataContext);
