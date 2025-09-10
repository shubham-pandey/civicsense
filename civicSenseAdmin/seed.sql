-- Example seed data for quick testing
BEGIN;

-- Ensure required extensions for citext
CREATE EXTENSION IF NOT EXISTS citext;

INSERT INTO users (name, email, phone)
VALUES
  ('User 1', 'user1@example.com', '+1-555-0100'),
  ('User 2', 'user2@example.com', '+1-555-0101'),
  ('User 3', 'user3@example.com', '+1-555-0102')
ON CONFLICT DO NOTHING;

INSERT INTO reports (user_id, category, description, priority, status, department, location_address, location_lat, location_lng)
VALUES
  (1, 'pothole', 'Large pothole near intersection causing traffic slowdown.', 'high', 'new', 'public_works', '123 Main St, City', 37.78, -122.42),
  (2, 'lighting', 'Streetlight flickering at night, unsafe for pedestrians.', 'medium', 'acknowledged', 'transport', '456 Oak Ave, City', 37.79, -122.41),
  (3, 'sanitation', 'Overflowing trash bin with unpleasant odor.', 'critical', 'in_progress', 'sanitation', '789 Pine Rd, City', 37.77, -122.43);

INSERT INTO report_attachments (report_id, url)
VALUES
  (1, 'https://images.unsplash.com/photo-1541976076758-347942db1970?q=80&w=400&auto=format&fit=crop'),
  (2, 'https://images.unsplash.com/photo-1541976076758-347942db1970?q=80&w=400&auto=format&fit=crop');

INSERT INTO report_activity (report_id, occurred_at, message)
VALUES
  (1, now(), 'Report created'),
  (2, now(), 'Report created'),
  (3, now(), 'Report created');

COMMIT;


