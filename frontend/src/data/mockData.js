// ============================================================
// AssetFlow – Central Mock Data Store
// Swap these imports for real API calls when backend is ready
// ============================================================

export const ROLES = {
  ADMIN: 'Admin',
  ASSET_MANAGER: 'Asset Manager',
  DEPT_HEAD: 'Department Head',
  EMPLOYEE: 'Employee',
};

export const ASSET_STATUSES = {
  AVAILABLE: 'Available',
  ALLOCATED: 'Allocated',
  RESERVED: 'Reserved',
  UNDER_MAINTENANCE: 'Under Maintenance',
  LOST: 'Lost',
  RETIRED: 'Retired',
  DISPOSED: 'Disposed',
};

export const MAINTENANCE_STATUSES = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  TECHNICIAN_ASSIGNED: 'Technician Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

export const TRANSFER_STATUSES = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};

export const BOOKING_STATUSES = {
  UPCOMING: 'Upcoming',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const AUDIT_STATUSES = {
  OPEN: 'Open',
  CLOSED: 'Closed',
};

export const AUDIT_ITEM_STATUSES = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  MISSING: 'Missing',
  DAMAGED: 'Damaged',
};

// ── Departments ──────────────────────────────────────────────
export const departments = [
  { id: 'd1', name: 'Engineering', headId: 'u3', parentId: null, status: 'Active' },
  { id: 'd2', name: 'Human Resources', headId: 'u4', parentId: null, status: 'Active' },
  { id: 'd3', name: 'Finance', headId: null, parentId: null, status: 'Active' },
  { id: 'd4', name: 'Operations', headId: 'u5', parentId: null, status: 'Active' },
  { id: 'd5', name: 'Frontend Team', headId: null, parentId: 'd1', status: 'Active' },
  { id: 'd6', name: 'DevOps', headId: null, parentId: 'd1', status: 'Inactive' },
];

// ── Asset Categories ─────────────────────────────────────────
export const categories = [
  { id: 'c1', name: 'Electronics', customFields: [{ label: 'Warranty Period', type: 'text' }] },
  { id: 'c2', name: 'Furniture', customFields: [] },
  { id: 'c3', name: 'Vehicles', customFields: [{ label: 'License Plate', type: 'text' }] },
  { id: 'c4', name: 'Office Equipment', customFields: [{ label: 'Warranty Period', type: 'text' }] },
  { id: 'c5', name: 'Software Licenses', customFields: [{ label: 'License Key', type: 'text' }, { label: 'Expiry Date', type: 'date' }] },
];

// ── Users ────────────────────────────────────────────────────
export const users = [
  { id: 'u1', name: 'Alex Rivera', email: 'alex@assetflow.io', role: ROLES.ADMIN, departmentId: null, status: 'Active', avatar: 'AR' },
  { id: 'u2', name: 'Jordan Kim', email: 'jordan@assetflow.io', role: ROLES.ASSET_MANAGER, departmentId: 'd1', status: 'Active', avatar: 'JK' },
  { id: 'u3', name: 'Sam Patel', email: 'sam@assetflow.io', role: ROLES.DEPT_HEAD, departmentId: 'd1', status: 'Active', avatar: 'SP' },
  { id: 'u4', name: 'Morgan Lee', email: 'morgan@assetflow.io', role: ROLES.DEPT_HEAD, departmentId: 'd2', status: 'Active', avatar: 'ML' },
  { id: 'u5', name: 'Casey Chen', email: 'casey@assetflow.io', role: ROLES.DEPT_HEAD, departmentId: 'd4', status: 'Active', avatar: 'CC' },
  { id: 'u6', name: 'Taylor Brooks', email: 'taylor@assetflow.io', role: ROLES.EMPLOYEE, departmentId: 'd1', status: 'Active', avatar: 'TB' },
  { id: 'u7', name: 'Jamie Walsh', email: 'jamie@assetflow.io', role: ROLES.EMPLOYEE, departmentId: 'd2', status: 'Active', avatar: 'JW' },
  { id: 'u8', name: 'Drew Nguyen', email: 'drew@assetflow.io', role: ROLES.EMPLOYEE, departmentId: 'd3', status: 'Inactive', avatar: 'DN' },
];

// ── Assets ───────────────────────────────────────────────────
export const assets = [
  {
    id: 'a1', tag: 'AF-0001', name: 'MacBook Pro 16"', categoryId: 'c1', serialNumber: 'C02XG0JFHV2R',
    acquisitionDate: '2023-01-15', acquisitionCost: 2499, condition: 'Good',
    location: 'Engineering Lab', status: ASSET_STATUSES.ALLOCATED, isBookable: false,
    departmentId: 'd1', assignedTo: 'u6', expectedReturnDate: '2024-06-30', photo: null,
    customFields: { 'Warranty Period': '3 years' },
  },
  {
    id: 'a2', tag: 'AF-0002', name: 'Dell Monitor 27"', categoryId: 'c1', serialNumber: 'CN-0K185D-12345',
    acquisitionDate: '2023-02-10', acquisitionCost: 399, condition: 'Excellent',
    location: 'Engineering Lab', status: ASSET_STATUSES.AVAILABLE, isBookable: false,
    departmentId: null, assignedTo: null, expectedReturnDate: null, photo: null,
    customFields: { 'Warranty Period': '2 years' },
  },
  {
    id: 'a3', tag: 'AF-0003', name: 'Conference Room A', categoryId: 'c4', serialNumber: 'CONF-A-001',
    acquisitionDate: '2022-06-01', acquisitionCost: 0, condition: 'Good',
    location: 'Floor 2', status: ASSET_STATUSES.AVAILABLE, isBookable: true,
    departmentId: null, assignedTo: null, expectedReturnDate: null, photo: null,
    customFields: {},
  },
  {
    id: 'a4', tag: 'AF-0004', name: 'Honda Civic 2022', categoryId: 'c3', serialNumber: 'VIN-1HGBH41JX',
    acquisitionDate: '2022-03-20', acquisitionCost: 25000, condition: 'Good',
    location: 'Parking Lot B', status: ASSET_STATUSES.UNDER_MAINTENANCE, isBookable: false,
    departmentId: 'd4', assignedTo: null, expectedReturnDate: null, photo: null,
    customFields: { 'License Plate': 'XYZ-1234' },
  },
  {
    id: 'a5', tag: 'AF-0005', name: 'iPad Pro 12.9"', categoryId: 'c1', serialNumber: 'DMPXC2F3Q1GH',
    acquisitionDate: '2023-05-01', acquisitionCost: 1099, condition: 'Good',
    location: 'HR Office', status: ASSET_STATUSES.ALLOCATED, isBookable: false,
    departmentId: 'd2', assignedTo: 'u7', expectedReturnDate: '2024-03-15', photo: null,
    customFields: { 'Warranty Period': '1 year' },
  },
  {
    id: 'a6', tag: 'AF-0006', name: 'Standing Desk', categoryId: 'c2', serialNumber: 'SD-FLEX-007',
    acquisitionDate: '2023-07-01', acquisitionCost: 650, condition: 'Excellent',
    location: 'Engineering Lab', status: ASSET_STATUSES.AVAILABLE, isBookable: false,
    departmentId: null, assignedTo: null, expectedReturnDate: null, photo: null,
    customFields: {},
  },
  {
    id: 'a7', tag: 'AF-0007', name: 'Projector Epson', categoryId: 'c4', serialNumber: 'X8C-99201-EP',
    acquisitionDate: '2021-09-10', acquisitionCost: 800, condition: 'Fair',
    location: 'Meeting Room B', status: ASSET_STATUSES.AVAILABLE, isBookable: true,
    departmentId: null, assignedTo: null, expectedReturnDate: null, photo: null,
    customFields: {},
  },
  {
    id: 'a8', tag: 'AF-0008', name: 'Adobe CC License', categoryId: 'c5', serialNumber: 'ADCC-ENT-2024',
    acquisitionDate: '2024-01-01', acquisitionCost: 600, condition: 'N/A',
    location: 'Virtual', status: ASSET_STATUSES.ALLOCATED, isBookable: false,
    departmentId: 'd1', assignedTo: 'u3', expectedReturnDate: '2024-12-31', photo: null,
    customFields: { 'License Key': 'XXXX-XXXX-XXXX', 'Expiry Date': '2024-12-31' },
  },
  {
    id: 'a9', tag: 'AF-0009', name: 'ThinkPad X1 Carbon', categoryId: 'c1', serialNumber: 'PC-0X1C-9876',
    acquisitionDate: '2022-11-01', acquisitionCost: 1800, condition: 'Good',
    location: 'Storage', status: ASSET_STATUSES.AVAILABLE, isBookable: false,
    departmentId: null, assignedTo: null, expectedReturnDate: null, photo: null,
    customFields: { 'Warranty Period': '3 years' },
  },
  {
    id: 'a10', tag: 'AF-0010', name: 'Ergonomic Chair', categoryId: 'c2', serialNumber: 'CHAIR-HM-0010',
    acquisitionDate: '2023-04-01', acquisitionCost: 420, condition: 'Excellent',
    location: 'Finance Office', status: ASSET_STATUSES.RETIRED, isBookable: false,
    departmentId: null, assignedTo: null, expectedReturnDate: null, photo: null,
    customFields: {},
  },
];

// ── Allocations ──────────────────────────────────────────────
export const allocations = [
  {
    id: 'al1', assetId: 'a1', assignedTo: 'u6', assignedBy: 'u2',
    allocationDate: '2023-06-01', expectedReturnDate: '2024-06-30',
    returnDate: null, conditionOnReturn: null, notes: 'Primary work laptop',
  },
  {
    id: 'al2', assetId: 'a5', assignedTo: 'u7', assignedBy: 'u2',
    allocationDate: '2023-06-15', expectedReturnDate: '2024-03-15',
    returnDate: null, conditionOnReturn: null, notes: 'For HR onboarding sessions',
  },
  {
    id: 'al3', assetId: 'a8', assignedTo: 'u3', assignedBy: 'u2',
    allocationDate: '2024-01-01', expectedReturnDate: '2024-12-31',
    returnDate: null, conditionOnReturn: null, notes: 'Design team license',
  },
];

// ── Transfer Requests ────────────────────────────────────────
export const transferRequests = [
  {
    id: 'tr1', assetId: 'a1', fromUserId: 'u6', toUserId: 'u3',
    requestedBy: 'u6', status: TRANSFER_STATUSES.REQUESTED,
    reason: 'New project requirement', createdAt: '2024-07-01T10:00:00Z', resolvedAt: null,
  },
  {
    id: 'tr2', assetId: 'a9', fromUserId: null, toUserId: 'u7',
    requestedBy: 'u7', status: TRANSFER_STATUSES.APPROVED,
    reason: 'Current laptop failing', createdAt: '2024-07-02T09:00:00Z', resolvedAt: '2024-07-03T14:00:00Z',
  },
];

// ── Maintenance Requests ──────────────────────────────────────
export const maintenanceRequests = [
  {
    id: 'm1', assetId: 'a4', requestedBy: 'u5', assignedTechnician: 'u2',
    status: MAINTENANCE_STATUSES.IN_PROGRESS, priority: 'High',
    issue: 'Engine warning light on, requires inspection', photo: null,
    createdAt: '2024-07-01T08:00:00Z', resolvedAt: null, notes: 'Scheduled with mechanic',
  },
  {
    id: 'm2', assetId: 'a7', requestedBy: 'u6', assignedTechnician: null,
    status: MAINTENANCE_STATUSES.PENDING, priority: 'Medium',
    issue: 'Bulb flickering, image quality degraded', photo: null,
    createdAt: '2024-07-05T11:00:00Z', resolvedAt: null, notes: '',
  },
  {
    id: 'm3', assetId: 'a1', requestedBy: 'u6', assignedTechnician: 'u2',
    status: MAINTENANCE_STATUSES.RESOLVED, priority: 'Low',
    issue: 'Battery drain issue', photo: null,
    createdAt: '2024-06-10T09:00:00Z', resolvedAt: '2024-06-15T17:00:00Z', notes: 'Battery replaced',
  },
  {
    id: 'm4', assetId: 'a2', requestedBy: 'u3', assignedTechnician: null,
    status: MAINTENANCE_STATUSES.APPROVED, priority: 'Low',
    issue: 'Screen flickering at certain angles', photo: null,
    createdAt: '2024-07-08T14:00:00Z', resolvedAt: null, notes: '',
  },
];

// ── Resource Bookings ─────────────────────────────────────────
export const bookings = [
  {
    id: 'b1', assetId: 'a3', bookedBy: 'u3', title: 'Sprint Planning',
    startTime: '2024-07-10T09:00:00Z', endTime: '2024-07-10T10:00:00Z',
    status: BOOKING_STATUSES.COMPLETED, notes: '',
  },
  {
    id: 'b2', assetId: 'a3', bookedBy: 'u4', title: 'HR All-Hands',
    startTime: '2024-07-12T14:00:00Z', endTime: '2024-07-12T16:00:00Z',
    status: BOOKING_STATUSES.UPCOMING, notes: 'Q3 review',
  },
  {
    id: 'b3', assetId: 'a7', bookedBy: 'u6', title: 'Product Demo',
    startTime: '2024-07-15T10:00:00Z', endTime: '2024-07-15T11:30:00Z',
    status: BOOKING_STATUSES.UPCOMING, notes: 'Client presentation',
  },
  {
    id: 'b4', assetId: 'a3', bookedBy: 'u5', title: 'Ops Weekly Sync',
    startTime: '2024-07-16T09:00:00Z', endTime: '2024-07-16T10:00:00Z',
    status: BOOKING_STATUSES.UPCOMING, notes: '',
  },
];

// ── Audit Cycles ──────────────────────────────────────────────
export const auditCycles = [
  {
    id: 'ac1', name: 'Q2 Engineering Audit', departmentId: 'd1', location: 'Engineering Lab',
    startDate: '2024-06-01', endDate: '2024-06-30', auditorIds: ['u2', 'u3'],
    status: AUDIT_STATUSES.CLOSED,
    items: [
      { assetId: 'a1', status: AUDIT_ITEM_STATUSES.VERIFIED, notes: '' },
      { assetId: 'a2', status: AUDIT_ITEM_STATUSES.VERIFIED, notes: '' },
    ],
  },
  {
    id: 'ac2', name: 'Q3 Full Inventory Check', departmentId: null, location: 'All Locations',
    startDate: '2024-07-01', endDate: '2024-07-31', auditorIds: ['u2'],
    status: AUDIT_STATUSES.OPEN,
    items: [
      { assetId: 'a3', status: AUDIT_ITEM_STATUSES.VERIFIED, notes: '' },
      { assetId: 'a4', status: AUDIT_ITEM_STATUSES.DAMAGED, notes: 'Engine issues noted' },
      { assetId: 'a6', status: AUDIT_ITEM_STATUSES.PENDING, notes: '' },
      { assetId: 'a7', status: AUDIT_ITEM_STATUSES.PENDING, notes: '' },
      { assetId: 'a9', status: AUDIT_ITEM_STATUSES.PENDING, notes: '' },
      { assetId: 'a10', status: AUDIT_ITEM_STATUSES.MISSING, notes: 'Not found in storage' },
    ],
  },
];

// ── Activity Logs ─────────────────────────────────────────────
export const activityLogs = [
  { id: 'log1', type: 'Allocation', userId: 'u2', targetId: 'a1', message: 'Allocated MacBook Pro 16" to Taylor Brooks', timestamp: '2024-07-08T10:30:00Z' },
  { id: 'log2', type: 'Maintenance', userId: 'u6', targetId: 'm2', message: 'Raised maintenance request for Projector Epson', timestamp: '2024-07-05T11:00:00Z' },
  { id: 'log3', type: 'Transfer', userId: 'u6', targetId: 'tr1', message: 'Requested transfer of MacBook Pro 16" to Sam Patel', timestamp: '2024-07-01T10:00:00Z' },
  { id: 'log4', type: 'Booking', userId: 'u4', targetId: 'b2', message: 'Booked Conference Room A for HR All-Hands', timestamp: '2024-07-01T09:00:00Z' },
  { id: 'log5', type: 'Approval', userId: 'u2', targetId: 'tr2', message: 'Approved transfer request for ThinkPad X1 Carbon', timestamp: '2024-07-03T14:00:00Z' },
  { id: 'log6', type: 'Registration', userId: 'u2', targetId: 'a9', message: 'Registered new asset: ThinkPad X1 Carbon (AF-0009)', timestamp: '2024-06-20T08:00:00Z' },
  { id: 'log7', type: 'Audit', userId: 'u2', targetId: 'ac1', message: 'Closed Q2 Engineering Audit cycle', timestamp: '2024-06-30T17:00:00Z' },
  { id: 'log8', type: 'Maintenance', userId: 'u2', targetId: 'm3', message: 'Resolved maintenance request for MacBook Pro 16"', timestamp: '2024-06-15T17:00:00Z' },
];

// ── Notifications ─────────────────────────────────────────────
export const notifications = [
  { id: 'n1', userId: 'u6', type: 'Alert', message: 'Your iPad Pro 5 is overdue for return (was due Mar 15)', read: false, timestamp: '2024-07-08T08:00:00Z' },
  { id: 'n2', userId: 'u2', type: 'Approval', message: 'Transfer request TR-001 from Taylor Brooks needs review', read: false, timestamp: '2024-07-01T10:00:00Z' },
  { id: 'n3', userId: 'u3', type: 'Booking', message: 'Conference Room A booked for HR All-Hands on Jul 12', read: true, timestamp: '2024-07-01T09:00:00Z' },
  { id: 'n4', userId: 'u2', type: 'Maintenance', message: 'New maintenance request raised for Projector Epson', read: false, timestamp: '2024-07-05T11:00:00Z' },
  { id: 'n5', userId: 'u5', type: 'Alert', message: 'Honda Civic maintenance is In Progress', read: true, timestamp: '2024-07-01T08:00:00Z' },
];
