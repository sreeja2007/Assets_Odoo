-- ============================================================
-- AssetFlow – Initial Database Schema
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- required for the booking overlap EXCLUDE constraint

-- ── ENUM types ────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM (
  'Admin', 'Asset Manager', 'Department Head', 'Employee'
);

CREATE TYPE user_status AS ENUM ('Active', 'Inactive');

CREATE TYPE dept_status AS ENUM ('Active', 'Inactive');

CREATE TYPE asset_status AS ENUM (
  'Available', 'Allocated', 'Reserved',
  'Under Maintenance', 'Lost', 'Retired', 'Disposed'
);

CREATE TYPE asset_condition AS ENUM (
  'Excellent', 'Good', 'Fair', 'Poor', 'N/A'
);

CREATE TYPE transfer_status AS ENUM (
  'Requested', 'Approved', 'Rejected', 'Completed'
);

CREATE TYPE maintenance_status AS ENUM (
  'Pending', 'Approved', 'Rejected',
  'Technician Assigned', 'In Progress', 'Resolved'
);

CREATE TYPE maintenance_priority AS ENUM ('Low', 'Medium', 'High');

CREATE TYPE booking_status AS ENUM (
  'Upcoming', 'Ongoing', 'Completed', 'Cancelled'
);

CREATE TYPE audit_cycle_status AS ENUM ('Open', 'Closed');

CREATE TYPE audit_item_status AS ENUM (
  'Pending', 'Verified', 'Missing', 'Damaged'
);

CREATE TYPE log_type AS ENUM (
  'Allocation', 'Maintenance', 'Transfer', 'Booking',
  'Approval', 'Registration', 'Audit', 'Return', 'Admin'
);

CREATE TYPE notification_type AS ENUM (
  'Alert', 'Approval', 'Booking', 'Maintenance'
);

-- ── Departments ───────────────────────────────────────────────
CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  status      dept_status NOT NULL DEFAULT 'Active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'Employee',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  status        user_status NOT NULL DEFAULT 'Active',
  avatar        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Department head FK (circular — added after both tables exist)
ALTER TABLE departments ADD COLUMN head_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- ── Asset Categories ──────────────────────────────────────────
CREATE TABLE asset_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  custom_fields JSONB NOT NULL DEFAULT '[]',   -- [{label, type}]
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Assets ────────────────────────────────────────────────────
CREATE TABLE assets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag              TEXT NOT NULL UNIQUE,        -- e.g. AF-0001
  name             TEXT NOT NULL,
  category_id      UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
  serial_number    TEXT,
  acquisition_date DATE,
  acquisition_cost NUMERIC(12,2),
  condition        asset_condition NOT NULL DEFAULT 'Good',
  location         TEXT,
  status           asset_status NOT NULL DEFAULT 'Available',
  is_bookable      BOOLEAN NOT NULL DEFAULT FALSE,
  department_id    UUID REFERENCES departments(id) ON DELETE SET NULL,
  assigned_to      UUID REFERENCES users(id) ON DELETE SET NULL,
  photo_url        TEXT,
  custom_fields    JSONB NOT NULL DEFAULT '{}', -- {fieldLabel: value}
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-increment tag counter
CREATE SEQUENCE asset_tag_seq START 1;

-- ── Allocations ───────────────────────────────────────────────
CREATE TABLE allocations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id            UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  department_id       UUID REFERENCES departments(id) ON DELETE SET NULL,
  allocation_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date DATE,
  return_date         DATE,
  condition_on_return TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Transfer Requests ─────────────────────────────────────────
CREATE TABLE transfer_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id      UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  from_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  to_user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  requested_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  status        transfer_status NOT NULL DEFAULT 'Requested',
  reason        TEXT,
  resolved_at   TIMESTAMPTZ,
  resolved_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Maintenance Requests ──────────────────────────────────────
CREATE TABLE maintenance_requests (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id             UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  requested_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_technician  UUID REFERENCES users(id) ON DELETE SET NULL,
  status               maintenance_status NOT NULL DEFAULT 'Pending',
  priority             maintenance_priority NOT NULL DEFAULT 'Medium',
  issue                TEXT NOT NULL,
  notes                TEXT,
  photo_url            TEXT,
  resolved_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Resource Bookings ─────────────────────────────────────────
CREATE TABLE bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id    UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  booked_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ NOT NULL,
  status      booking_status NOT NULL DEFAULT 'Upcoming',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent overlapping bookings for the same asset (excluding cancelled)
  CONSTRAINT no_overlap EXCLUDE USING gist (
    asset_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  ) WHERE (status <> 'Cancelled')
);

-- ── Audit Cycles ──────────────────────────────────────────────
CREATE TABLE audit_cycles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  location      TEXT,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  status        audit_cycle_status NOT NULL DEFAULT 'Open',
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  closed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  closed_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auditors assigned to a cycle (many-to-many)
CREATE TABLE audit_cycle_auditors (
  cycle_id  UUID NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (cycle_id, user_id)
);

-- Per-asset items within a cycle
CREATE TABLE audit_items (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id  UUID NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
  asset_id  UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  status    audit_item_status NOT NULL DEFAULT 'Pending',
  notes     TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cycle_id, asset_id)
);

-- ── Activity Logs ─────────────────────────────────────────────
CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        log_type NOT NULL,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  target_id   TEXT,   -- generic reference to any entity ID
  message     TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX idx_assets_status       ON assets(status);
CREATE INDEX idx_assets_department   ON assets(department_id);
CREATE INDEX idx_assets_assigned_to  ON assets(assigned_to);
CREATE INDEX idx_allocations_asset   ON allocations(asset_id);
CREATE INDEX idx_allocations_user    ON allocations(assigned_to);
CREATE INDEX idx_transfers_asset     ON transfer_requests(asset_id);
CREATE INDEX idx_transfers_status    ON transfer_requests(status);
CREATE INDEX idx_maintenance_asset   ON maintenance_requests(asset_id);
CREATE INDEX idx_maintenance_status  ON maintenance_requests(status);
CREATE INDEX idx_bookings_asset      ON bookings(asset_id);
CREATE INDEX idx_bookings_times      ON bookings(start_time, end_time);
CREATE INDEX idx_audit_items_cycle   ON audit_items(cycle_id);
CREATE INDEX idx_logs_user           ON activity_logs(user_id);
CREATE INDEX idx_logs_created        ON activity_logs(created_at DESC);
CREATE INDEX idx_notifs_user         ON notifications(user_id);
CREATE INDEX idx_notifs_read         ON notifications(user_id, is_read);
