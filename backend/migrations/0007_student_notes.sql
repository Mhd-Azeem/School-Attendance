PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS student_notes (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id),
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_notes_student_created
  ON student_notes(student_id,created_at);
