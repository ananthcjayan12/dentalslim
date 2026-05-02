CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  tooth_number TEXT,
  concern TEXT,
  shade TEXT DEFAULT 'B1',
  status TEXT NOT NULL DEFAULT 'draft',
  preview_model TEXT DEFAULT 'gemini-3.1-flash-image-preview',
  preview_quality TEXT DEFAULT 'standard',
  image_size TEXT DEFAULT '0.5K',
  aspect_ratio TEXT DEFAULT '4:3',
  estimated_cost_usd REAL DEFAULT 0,
  original_image_key TEXT,
  mask_image_key TEXT,
  preview_image_key TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reference_images (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  image_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (case_id) REFERENCES cases(id)
);
