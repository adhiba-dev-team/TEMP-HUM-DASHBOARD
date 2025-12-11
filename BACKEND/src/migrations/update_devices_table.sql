-- Add new columns (no UNIQUE constraint here)
ALTER TABLE devices ADD COLUMN device_id INTEGER;
ALTER TABLE devices ADD COLUMN device_name TEXT;
ALTER TABLE devices ADD COLUMN location TEXT;

-- Make device_id unique using an index
CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_device_id
ON devices(device_id);
