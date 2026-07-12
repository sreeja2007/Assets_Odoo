-- ============================================================
-- AssetFlow – Seed Data (mirrors frontend mock data)
-- Passwords are all: "password123" (bcrypt, 12 rounds)
-- ============================================================

-- ── Departments (no head yet – users come after) ─────────────
INSERT INTO departments (id, name, status) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Engineering',     'Active'),
  ('d1000000-0000-0000-0000-000000000002', 'Human Resources', 'Active'),
  ('d1000000-0000-0000-0000-000000000003', 'Finance',         'Active'),
  ('d1000000-0000-0000-0000-000000000004', 'Operations',      'Active');

INSERT INTO departments (id, name, parent_id, status) VALUES
  ('d1000000-0000-0000-0000-000000000005', 'Frontend Team', 'd1000000-0000-0000-0000-000000000001', 'Active'),
  ('d1000000-0000-0000-0000-000000000006', 'DevOps',        'd1000000-0000-0000-0000-000000000001', 'Inactive');

-- ── Users ─────────────────────────────────────────────────────
-- password hash for "password123" with bcrypt 12 rounds
INSERT INTO users (id, name, email, password_hash, role, department_id, status, avatar) VALUES
  ('u1000000-0000-0000-0000-000000000001', 'Alex Rivera',   'alex@assetflow.io',   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oZ6Z.5K6i', 'Admin',           NULL,                                        'Active', 'AR'),
  ('u1000000-0000-0000-0000-000000000002', 'Jordan Kim',    'jordan@assetflow.io', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oZ6Z.5K6i', 'Asset Manager',   'd1000000-0000-0000-0000-000000000001', 'Active', 'JK'),
  ('u1000000-0000-0000-0000-000000000003', 'Sam Patel',     'sam@assetflow.io',    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oZ6Z.5K6i', 'Department Head', 'd1000000-0000-0000-0000-000000000001', 'Active', 'SP'),
  ('u1000000-0000-0000-0000-000000000004', 'Morgan Lee',    'morgan@assetflow.io', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oZ6Z.5K6i', 'Department Head', 'd1000000-0000-0000-0000-000000000002', 'Active', 'ML'),
  ('u1000000-0000-0000-0000-000000000005', 'Casey Chen',    'casey@assetflow.io',  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oZ6Z.5K6i', 'Department Head', 'd1000000-0000-0000-0000-000000000004', 'Active', 'CC'),
  ('u1000000-0000-0000-0000-000000000006', 'Taylor Brooks', 'taylor@assetflow.io', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oZ6Z.5K6i', 'Employee',        'd1000000-0000-0000-0000-000000000001', 'Active', 'TB'),
  ('u1000000-0000-0000-0000-000000000007', 'Jamie Walsh',   'jamie@assetflow.io',  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oZ6Z.5K6i', 'Employee',        'd1000000-0000-0000-0000-000000000002', 'Active', 'JW'),
  ('u1000000-0000-0000-0000-000000000008', 'Drew Nguyen',   'drew@assetflow.io',   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oZ6Z.5K6i', 'Employee',        'd1000000-0000-0000-0000-000000000003', 'Inactive','DN');

-- Assign department heads
UPDATE departments SET head_id = 'u1000000-0000-0000-0000-000000000003' WHERE id = 'd1000000-0000-0000-0000-000000000001';
UPDATE departments SET head_id = 'u1000000-0000-0000-0000-000000000004' WHERE id = 'd1000000-0000-0000-0000-000000000002';
UPDATE departments SET head_id = 'u1000000-0000-0000-0000-000000000005' WHERE id = 'd1000000-0000-0000-0000-000000000004';

-- ── Asset Categories ──────────────────────────────────────────
INSERT INTO asset_categories (id, name, custom_fields) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Electronics',       '[{"label":"Warranty Period","type":"text"}]'),
  ('c1000000-0000-0000-0000-000000000002', 'Furniture',         '[]'),
  ('c1000000-0000-0000-0000-000000000003', 'Vehicles',          '[{"label":"License Plate","type":"text"}]'),
  ('c1000000-0000-0000-0000-000000000004', 'Office Equipment',  '[{"label":"Warranty Period","type":"text"}]'),
  ('c1000000-0000-0000-0000-000000000005', 'Software Licenses', '[{"label":"License Key","type":"text"},{"label":"Expiry Date","type":"date"}]');

-- ── Assets ────────────────────────────────────────────────────
INSERT INTO assets (id, tag, name, category_id, serial_number, acquisition_date, acquisition_cost, condition, location, status, is_bookable, department_id, assigned_to, custom_fields) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'AF-0001', 'MacBook Pro 16"',    'c1000000-0000-0000-0000-000000000001', 'C02XG0JFHV2R',  '2023-01-15', 2499.00, 'Good',      'Engineering Lab',  'Allocated',         FALSE, 'd1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000006', '{"Warranty Period":"3 years"}'),
  ('a1000000-0000-0000-0000-000000000002', 'AF-0002', 'Dell Monitor 27"',   'c1000000-0000-0000-0000-000000000001', 'CN-0K185D-12345','2023-02-10',  399.00, 'Excellent', 'Engineering Lab',  'Available',         FALSE, NULL,                                   NULL,                                   '{"Warranty Period":"2 years"}'),
  ('a1000000-0000-0000-0000-000000000003', 'AF-0003', 'Conference Room A',  'c1000000-0000-0000-0000-000000000004', 'CONF-A-001',    '2022-06-01',    0.00, 'Good',      'Floor 2',          'Available',         TRUE,  NULL,                                   NULL,                                   '{}'),
  ('a1000000-0000-0000-0000-000000000004', 'AF-0004', 'Honda Civic 2022',   'c1000000-0000-0000-0000-000000000003', 'VIN-1HGBH41JX', '2022-03-20',25000.00, 'Good',      'Parking Lot B',    'Under Maintenance', FALSE, 'd1000000-0000-0000-0000-000000000004', NULL,                                   '{"License Plate":"XYZ-1234"}'),
  ('a1000000-0000-0000-0000-000000000005', 'AF-0005', 'iPad Pro 12.9"',     'c1000000-0000-0000-0000-000000000001', 'DMPXC2F3Q1GH',  '2023-05-01', 1099.00, 'Good',      'HR Office',        'Allocated',         FALSE, 'd1000000-0000-0000-0000-000000000002', 'u1000000-0000-0000-0000-000000000007', '{"Warranty Period":"1 year"}'),
  ('a1000000-0000-0000-0000-000000000006', 'AF-0006', 'Standing Desk',      'c1000000-0000-0000-0000-000000000002', 'SD-FLEX-007',   '2023-07-01',  650.00, 'Excellent', 'Engineering Lab',  'Available',         FALSE, NULL,                                   NULL,                                   '{}'),
  ('a1000000-0000-0000-0000-000000000007', 'AF-0007', 'Projector Epson',    'c1000000-0000-0000-0000-000000000004', 'X8C-99201-EP',  '2021-09-10',  800.00, 'Fair',      'Meeting Room B',   'Available',         TRUE,  NULL,                                   NULL,                                   '{}'),
  ('a1000000-0000-0000-0000-000000000008', 'AF-0008', 'Adobe CC License',   'c1000000-0000-0000-0000-000000000005', 'ADCC-ENT-2024', '2024-01-01',  600.00, 'N/A',       'Virtual',          'Allocated',         FALSE, 'd1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000003', '{"License Key":"XXXX-XXXX-XXXX","Expiry Date":"2024-12-31"}'),
  ('a1000000-0000-0000-0000-000000000009', 'AF-0009', 'ThinkPad X1 Carbon', 'c1000000-0000-0000-0000-000000000001', 'PC-0X1C-9876',  '2022-11-01', 1800.00, 'Good',      'Storage',          'Available',         FALSE, NULL,                                   NULL,                                   '{"Warranty Period":"3 years"}'),
  ('a1000000-0000-0000-0000-000000000010', 'AF-0010', 'Ergonomic Chair',    'c1000000-0000-0000-0000-000000000002', 'CHAIR-HM-0010', '2023-04-01',  420.00, 'Excellent', 'Finance Office',   'Retired',           FALSE, NULL,                                   NULL,                                   '{}');

-- Advance tag sequence past seed data
SELECT setval('asset_tag_seq', 10);

-- ── Allocations ───────────────────────────────────────────────
INSERT INTO allocations (id, asset_id, assigned_to, assigned_by, allocation_date, expected_return_date, notes) VALUES
  ('al100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000006', 'u1000000-0000-0000-0000-000000000002', '2023-06-01', '2024-06-30', 'Primary work laptop'),
  ('al100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', 'u1000000-0000-0000-0000-000000000007', 'u1000000-0000-0000-0000-000000000002', '2023-06-15', '2024-03-15', 'For HR onboarding sessions'),
  ('al100000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000008', 'u1000000-0000-0000-0000-000000000003', 'u1000000-0000-0000-0000-000000000002', '2024-01-01', '2024-12-31', 'Design team license');

-- ── Transfer Requests ─────────────────────────────────────────
INSERT INTO transfer_requests (id, asset_id, from_user_id, to_user_id, requested_by, status, reason, created_at) VALUES
  ('tr100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000006', 'u1000000-0000-0000-0000-000000000003', 'u1000000-0000-0000-0000-000000000006', 'Requested', 'New project requirement',  '2024-07-01T10:00:00Z'),
  ('tr100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000009', NULL,                                   'u1000000-0000-0000-0000-000000000007', 'u1000000-0000-0000-0000-000000000007', 'Approved',  'Current laptop failing',   '2024-07-02T09:00:00Z');

-- ── Maintenance Requests ──────────────────────────────────────
INSERT INTO maintenance_requests (id, asset_id, requested_by, assigned_technician, status, priority, issue, notes, created_at) VALUES
  ('m1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'u1000000-0000-0000-0000-000000000005', 'u1000000-0000-0000-0000-000000000002', 'In Progress', 'High',   'Engine warning light on, requires inspection', 'Scheduled with mechanic', '2024-07-01T08:00:00Z'),
  ('m1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000007', 'u1000000-0000-0000-0000-000000000006', NULL,                                   'Pending',     'Medium', 'Bulb flickering, image quality degraded',      '',                        '2024-07-05T11:00:00Z'),
  ('m1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000006', 'u1000000-0000-0000-0000-000000000002', 'Resolved',    'Low',    'Battery drain issue',                          'Battery replaced',        '2024-06-10T09:00:00Z'),
  ('m1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'u1000000-0000-0000-0000-000000000003', NULL,                                   'Approved',    'Low',    'Screen flickering at certain angles',          '',                        '2024-07-08T14:00:00Z');

UPDATE maintenance_requests SET resolved_at = '2024-06-15T17:00:00Z' WHERE id = 'm1000000-0000-0000-0000-000000000003';

-- ── Bookings ──────────────────────────────────────────────────
INSERT INTO bookings (id, asset_id, booked_by, title, start_time, end_time, status, notes) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'u1000000-0000-0000-0000-000000000003', 'Sprint Planning', '2024-07-10T09:00:00Z', '2024-07-10T10:00:00Z', 'Completed', ''),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 'u1000000-0000-0000-0000-000000000004', 'HR All-Hands',    '2024-07-12T14:00:00Z', '2024-07-12T16:00:00Z', 'Upcoming',  'Q3 review'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000007', 'u1000000-0000-0000-0000-000000000006', 'Product Demo',    '2024-07-15T10:00:00Z', '2024-07-15T11:30:00Z', 'Upcoming',  'Client presentation'),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', 'u1000000-0000-0000-0000-000000000005', 'Ops Weekly Sync', '2024-07-16T09:00:00Z', '2024-07-16T10:00:00Z', 'Upcoming',  '');

-- ── Audit Cycles ──────────────────────────────────────────────
INSERT INTO audit_cycles (id, name, department_id, location, start_date, end_date, status, created_by) VALUES
  ('ac100000-0000-0000-0000-000000000001', 'Q2 Engineering Audit',    'd1000000-0000-0000-0000-000000000001', 'Engineering Lab', '2024-06-01', '2024-06-30', 'Closed', 'u1000000-0000-0000-0000-000000000002'),
  ('ac100000-0000-0000-0000-000000000002', 'Q3 Full Inventory Check',  NULL,                                  'All Locations',   '2024-07-01', '2024-07-31', 'Open',   'u1000000-0000-0000-0000-000000000002');

INSERT INTO audit_cycle_auditors (cycle_id, user_id) VALUES
  ('ac100000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000002'),
  ('ac100000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000003'),
  ('ac100000-0000-0000-0000-000000000002', 'u1000000-0000-0000-0000-000000000002');

INSERT INTO audit_items (cycle_id, asset_id, status) VALUES
  ('ac100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Verified'),
  ('ac100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'Verified'),
  ('ac100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 'Verified'),
  ('ac100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'Damaged'),
  ('ac100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006', 'Pending'),
  ('ac100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000007', 'Pending'),
  ('ac100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000009', 'Pending'),
  ('ac100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000010', 'Missing');

-- ── Activity Logs ─────────────────────────────────────────────
INSERT INTO activity_logs (type, user_id, target_id, message, created_at) VALUES
  ('Allocation',   'u1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Allocated MacBook Pro 16" to Taylor Brooks',            '2024-07-08T10:30:00Z'),
  ('Maintenance',  'u1000000-0000-0000-0000-000000000006', 'm1000000-0000-0000-0000-000000000002', 'Raised maintenance request for Projector Epson',         '2024-07-05T11:00:00Z'),
  ('Transfer',     'u1000000-0000-0000-0000-000000000006', 'tr100000-0000-0000-0000-000000000001', 'Requested transfer of MacBook Pro 16" to Sam Patel',     '2024-07-01T10:00:00Z'),
  ('Booking',      'u1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', 'Booked Conference Room A for HR All-Hands',              '2024-07-01T09:00:00Z'),
  ('Approval',     'u1000000-0000-0000-0000-000000000002', 'tr100000-0000-0000-0000-000000000002', 'Approved transfer request for ThinkPad X1 Carbon',       '2024-07-03T14:00:00Z'),
  ('Registration', 'u1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000009', 'Registered new asset: ThinkPad X1 Carbon (AF-0009)',     '2024-06-20T08:00:00Z'),
  ('Audit',        'u1000000-0000-0000-0000-000000000002', 'ac100000-0000-0000-0000-000000000001', 'Closed Q2 Engineering Audit cycle',                      '2024-06-30T17:00:00Z'),
  ('Maintenance',  'u1000000-0000-0000-0000-000000000002', 'm1000000-0000-0000-0000-000000000003', 'Resolved maintenance request for MacBook Pro 16"',       '2024-06-15T17:00:00Z');

-- ── Notifications ─────────────────────────────────────────────
INSERT INTO notifications (user_id, type, message, is_read, created_at) VALUES
  ('u1000000-0000-0000-0000-000000000006', 'Alert',       'Your iPad Pro 12.9" is overdue for return (was due Mar 15)', FALSE, '2024-07-08T08:00:00Z'),
  ('u1000000-0000-0000-0000-000000000002', 'Approval',    'Transfer request from Taylor Brooks needs review',           FALSE, '2024-07-01T10:00:00Z'),
  ('u1000000-0000-0000-0000-000000000003', 'Booking',     'Conference Room A booked for HR All-Hands on Jul 12',       TRUE,  '2024-07-01T09:00:00Z'),
  ('u1000000-0000-0000-0000-000000000002', 'Maintenance',  'New maintenance request raised for Projector Epson',        FALSE, '2024-07-05T11:00:00Z'),
  ('u1000000-0000-0000-0000-000000000005', 'Alert',       'Honda Civic maintenance is In Progress',                    TRUE,  '2024-07-01T08:00:00Z');
