import { createContext, useContext, useState, useCallback, useEffect } from 'react';
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
const API_BASE = 'http://localhost:8069';

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

  // Helper to fetch data safely with fallback
  const fetchFromOdoo = useCallback(async (endpoint, fallbackData) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      if (response.ok) {
        const json = await response.json();
        if (json.status === 'success') {
          return json.data;
        }
      }
    } catch (e) {
      console.warn(`Odoo API offline for ${endpoint}, using mock fallback.`);
    }
    return fallbackData;
  }, []);

  // Fetch initial datasets on mount
  useEffect(() => {
    async function loadData() {
      const odooDepts = await fetchFromOdoo('/api/base/departments', initDepartments);
      setDepartments(odooDepts);

      const odooCats = await fetchFromOdoo('/api/base/categories', initCategories);
      setCategories(odooCats);

      const odooEmps = await fetchFromOdoo('/api/base/employees', initUsers);
      setUsers(odooEmps);

      const odooAssets = await fetchFromOdoo('/api/assets', initAssets);
      setAssets(odooAssets);

      const odooAllocations = await fetchFromOdoo('/api/operations/allocations', initAllocations);
      setAllocations(odooAllocations);

      const odooBookings = await fetchFromOdoo('/api/operations/bookings', initBookings);
      setBookings(odooBookings);

      const odooMaint = await fetchFromOdoo('/api/operations/maintenance', initMaintenance);
      setMaintenanceRequests(odooMaint);

      const odooNotifs = await fetchFromOdoo('/api/dashboard/notifications', initNotifications);
      setNotifications(odooNotifs);

      const odooAudits = await fetchFromOdoo('/api/dashboard/audits', initAuditCycles);
      setAuditCycles(odooAudits);

      const odooLogs = await fetchFromOdoo('/api/dashboard/activities', initLogs);
      setActivityLogs(odooLogs);
    }
    loadData();
  }, [fetchFromOdoo]);

  const addLog = useCallback((log) => {
    setActivityLogs(prev => [{ id: `log${Date.now()}`, timestamp: new Date().toISOString(), ...log }, ...prev]);
  }, []);

  const addNotification = useCallback((notif) => {
    setNotifications(prev => [{ id: `n${Date.now()}`, read: false, timestamp: new Date().toISOString(), ...notif }, ...prev]);
  }, []);

  // ── Asset actions ────────────────────────────────────────────
  const registerAsset = useCallback(async (assetData, currentUser) => {
    try {
      const response = await fetch(`${API_BASE}/api/assets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetData)
      });
      if (response.ok) {
        const json = await response.json();
        if (json.status === 'success') {
          const newAsset = {
            id: json.data.id,
            tag: json.data.tag,
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
        }
      }
    } catch (e) {
      console.error(e);
    }
    // Fallback Mock Logic
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
    return newAsset;
  }, [assets.length, addLog]);

  const updateAsset = useCallback((id, updates) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  // ── Allocation actions ────────────────────────────────────────
  const allocateAsset = useCallback(async (assetId, toUserId, toDeptId, returnDate, notes, currentUser) => {
    try {
      const response = await fetch(`${API_BASE}/api/operations/allocations/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: assetId,
          employee_id: toUserId,
          expected_return_date: returnDate,
        })
      });
      const json = await response.json();
      if (response.status === 409 || json.status === 'conflict') {
        return { success: false, error: json.message || 'Asset is already allocated.' };
      }
      if (response.ok && json.status === 'success') {
        const alloc = {
          id: json.data.id, assetId, assignedTo: toUserId,
          assignedBy: currentUser.id, allocationDate: new Date().toISOString().split('T')[0],
          expectedReturnDate: returnDate, returnDate: null, conditionOnReturn: null, notes,
        };
        setAllocations(prev => [...prev, alloc]);
        updateAsset(assetId, { status: ASSET_STATUSES.ALLOCATED, assignedTo: toUserId, departmentId: toDeptId, expectedReturnDate: returnDate });
        const toUser = users.find(u => u.id === toUserId);
        addLog({ type: 'Allocation', userId: currentUser.id, targetId: assetId, message: `Allocated asset to ${toUser?.name}` });
        return { success: true };
      }
    } catch (e) {
      console.error(e);
    }
    // Fallback Mock Logic
    const alloc = {
      id: `al${Date.now()}`, assetId, assignedTo: toUserId,
      assignedBy: currentUser.id, allocationDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: returnDate, returnDate: null, conditionOnReturn: null, notes,
    };
    setAllocations(prev => [...prev, alloc]);
    updateAsset(assetId, { status: ASSET_STATUSES.ALLOCATED, assignedTo: toUserId, departmentId: toDeptId, expectedReturnDate: returnDate });
    return { success: true };
  }, [users, updateAsset, addLog]);

  const returnAsset = useCallback(async (allocationId, conditionNotes, currentUser) => {
    try {
      const response = await fetch(`${API_BASE}/api/operations/allocations/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocation_id: allocationId,
          return_notes: conditionNotes
        })
      });
      if (response.ok) {
        const json = await response.json();
        if (json.status === 'success') {
          const alloc = allocations.find(a => a.id === allocationId);
          if (!alloc) return;
          setAllocations(prev => prev.map(a => a.id === allocationId
            ? { ...a, returnDate: new Date().toISOString().split('T')[0], conditionOnReturn: conditionNotes }
            : a));
          updateAsset(alloc.assetId, { status: ASSET_STATUSES.AVAILABLE, assignedTo: null, departmentId: null, expectedReturnDate: null });
          const asset = assets.find(a => a.id === alloc.assetId);
          addLog({ type: 'Return', userId: currentUser.id, targetId: alloc.assetId, message: `${asset?.name} returned. Condition: ${conditionNotes || 'Good'}` });
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    // Fallback Mock Logic
    const alloc = allocations.find(a => a.id === allocationId);
    if (!alloc) return;
    setAllocations(prev => prev.map(a => a.id === allocationId
      ? { ...a, returnDate: new Date().toISOString().split('T')[0], conditionOnReturn: conditionNotes }
      : a));
    updateAsset(alloc.assetId, { status: ASSET_STATUSES.AVAILABLE, assignedTo: null, departmentId: null, expectedReturnDate: null });
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
  const createMaintenanceRequest = useCallback(async (data, currentUser) => {
    try {
      const response = await fetch(`${API_BASE}/api/operations/maintenance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: data.assetId,
          description: data.description,
          priority: data.priority
        })
      });
      if (response.ok) {
        const json = await response.json();
        if (json.status === 'success') {
          const req = {
            id: json.data.id, ...data,
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
        }
      }
    } catch (e) {
      console.error(e);
    }
    // Fallback Mock Logic
    const req = {
      id: `m${Date.now()}`, ...data,
      requestedBy: currentUser.id,
      status: MAINTENANCE_STATUSES.PENDING,
      assignedTechnician: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null, notes: '',
    };
    setMaintenanceRequests(prev => [...prev, req]);
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

  const createBooking = useCallback(async (data, currentUser) => {
    try {
      const response = await fetch(`${API_BASE}/api/operations/bookings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: data.assetId,
          start_datetime: data.startTime,
          end_datetime: data.endTime
        })
      });
      const json = await response.json();
      if (response.status === 409 || json.status === 'conflict') {
        return { success: false, error: json.message || 'This time slot overlaps with an existing booking.' };
      }
      if (response.ok && json.status === 'success') {
        const booking = {
          id: json.data.id, ...data,
          bookedBy: currentUser.id,
          status: 'Upcoming',
        };
        setBookings(prev => [...prev, booking]);
        addLog({ type: 'Booking', userId: currentUser.id, targetId: booking.id, message: `Booked resource for "${data.title}"` });
        return { success: true, booking };
      }
    } catch (e) {
      console.error(e);
    }
    // Fallback Mock Logic
    if (checkBookingConflict(data.assetId, data.startTime, data.endTime)) {
      return { success: false, error: 'This time slot overlaps with an existing booking.' };
    }
    const booking = {
      id: `b${Date.now()}`, ...data,
      bookedBy: currentUser.id,
      status: 'Upcoming',
    };
    setBookings(prev => [...prev, booking]);
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

  const updateAuditItem = useCallback(async (cycleId, assetId, status, notes) => {
    try {
      // Find Odoo item ID by looking in the local audit cycle state
      const cycle = auditCycles.find(c => c.id === cycleId);
      const item = cycle?.items?.find(i => i.assetId === assetId);
      if (item && typeof item.id === 'number') {
        await fetch(`${API_BASE}/api/dashboard/audits/item/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: item.id, status, notes })
        });
      }
    } catch (e) {
      console.error(e);
    }
    setAuditCycles(prev => prev.map(cycle => {
      if (cycle.id !== cycleId) return cycle;
      const existing = cycle.items.find(i => i.assetId === assetId);
      const items = existing
        ? cycle.items.map(i => i.assetId === assetId ? { ...i, status, notes } : i)
        : [...cycle.items, { assetId, status, notes }];
      return { ...cycle, items };
    }));
  }, [auditCycles]);

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
  const saveDepartment = useCallback(async (data) => {
    try {
      await fetch(`${API_BASE}/api/base/departments/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error(e);
    }
    if (data.id) {
      setDepartments(prev => prev.map(d => d.id === data.id ? { ...d, ...data } : d));
    } else {
      setDepartments(prev => [...prev, { id: `d${Date.now()}`, ...data }]);
    }
  }, []);

  const saveCategory = useCallback(async (data) => {
    try {
      await fetch(`${API_BASE}/api/base/categories/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error(e);
    }
    if (data.id) {
      setCategories(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c));
    } else {
      setCategories(prev => [...prev, { id: `c${Date.now()}`, customFields: [], ...data }]);
    }
  }, []);

  const updateUserRole = useCallback(async (userId, newRole, currentUser) => {
    try {
      await fetch(`${API_BASE}/api/base/employees/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: userId, role: newRole })
      });
    } catch (e) {
      console.error(e);
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    const target = users.find(u => u.id === userId);
    addLog({ type: 'Admin', userId: currentUser.id, targetId: userId, message: `Promoted ${target?.name} to ${newRole}` });
  }, [users, addLog]);

  const markNotificationRead = useCallback(async (id) => {
    try {
      if (typeof id === 'number') {
        await fetch(`${API_BASE}/api/dashboard/notifications/mark_read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notification_id: id })
        });
      }
    } catch (e) {
      console.error(e);
    }
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
