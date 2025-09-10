-- CivicSense schema: users, reports, attachments, activity
-- Compatible with PostgreSQL 14+ (should also work on 12+). Adjust types if using MySQL.

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS citext;

BEGIN;

CREATE TYPE report_status AS ENUM ('new', 'acknowledged', 'in_progress', 'resolved', 'rejected');
CREATE TYPE report_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE report_category AS ENUM ('pothole', 'lighting', 'sanitation', 'graffiti', 'other');

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email CITEXT UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  category report_category NOT NULL,
  description TEXT NOT NULL,
  priority report_priority NOT NULL DEFAULT 'medium',
  status report_status NOT NULL DEFAULT 'new',
  department TEXT,
  location_address TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION
);

-- optional: files/urls for images
CREATE TABLE IF NOT EXISTS report_attachments (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- activity feed entries (status changes, reassignment, comments)
CREATE TABLE IF NOT EXISTS report_activity (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  message TEXT NOT NULL
);

-- indexes to support dashboard filters/sorts
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_department ON reports(department);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- materialized search helpers (optional):
-- CREATE INDEX IF NOT EXISTS idx_reports_description_trgm ON reports USING gin (description gin_trgm_ops);
-- CREATE EXTENSION IF NOT EXISTS citext;
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMIT;


