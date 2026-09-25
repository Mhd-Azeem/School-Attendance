PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SECTION_HEAD','TEACHER')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS academic_years (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  is_current INTEGER NOT NULL DEFAULT 0 CHECK(is_current IN(0,1))
);
CREATE TABLE IF NOT EXISTS grades (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN(0,1))
);
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  grade_id TEXT NOT NULL REFERENCES grades(id),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN(0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(grade_id,name)
);
CREATE TABLE IF NOT EXISTS teacher_class_assignments (
  teacher_id TEXT NOT NULL REFERENCES users(id),
  class_id TEXT NOT NULL REFERENCES classes(id),
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by TEXT REFERENCES users(id),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN(0,1)),
  PRIMARY KEY(teacher_id,class_id)
);
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  admission_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  class_id TEXT NOT NULL REFERENCES classes(id),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN(0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS students_class_idx ON students(class_id,is_active);
CREATE INDEX IF NOT EXISTS students_name_idx ON students(full_name);
CREATE TABLE IF NOT EXISTS student_class_history (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  from_class_id TEXT REFERENCES classes(id),
  to_class_id TEXT NOT NULL REFERENCES classes(id),
  transferred_by TEXT NOT NULL REFERENCES users(id),
  transferred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT
);
CREATE TABLE IF NOT EXISTS school_days (
  day TEXT PRIMARY KEY,
  day_type TEXT NOT NULL CHECK(day_type IN ('SCHOOL_DAY','WEEKEND','HOLIDAY','SPECIAL_HOLIDAY','SPECIAL_SCHOOL_DAY')),
  label TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id),
  attendance_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK(status IN ('DRAFT','SUBMITTED')),
  submitted_by TEXT NOT NULL REFERENCES users(id),
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_id,attendance_date)
);
CREATE INDEX IF NOT EXISTS attendance_sessions_date_idx ON attendance_sessions(attendance_date,class_id);
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES attendance_sessions(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  status TEXT NOT NULL CHECK(status IN ('PRESENT','ABSENT','LATE')),
  marked_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id,student_id)
);
CREATE INDEX IF NOT EXISTS attendance_records_student_idx ON attendance_records(student_id,session_id);
CREATE TABLE IF NOT EXISTS attendance_changes (
  id TEXT PRIMARY KEY,
  attendance_record_id TEXT NOT NULL REFERENCES attendance_records(id),
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL REFERENCES users(id),
  changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT
);
CREATE TABLE IF NOT EXISTS holidays (
  id TEXT PRIMARY KEY,
  holiday_date TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  old_values TEXT,
  new_values TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at);
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by TEXT REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO academic_years(id,name,starts_on,ends_on,is_current) VALUES ('ay-2026','2026','2026-01-01','2026-12-31',1);
INSERT OR IGNORE INTO grades(id,name,sort_order) VALUES ('grade-6','6',6),('grade-7','7',7);
INSERT OR IGNORE INTO classes(id,grade_id,name,display_name) VALUES
('class-10-a','grade-6','A','6-A'),('class-10-b','grade-6','B','6-B'),('class-10-c','grade-6','C','6-C'),('class-10-d','grade-6','D','6-D'),('class-10-e','grade-6','E','6-E'),
('class-11-a','grade-7','A','7-A'),('class-11-b','grade-7','B','7-B'),('class-11-c','grade-7','C','7-C'),('class-11-d','grade-7','D','7-D'),('class-11-e','grade-7','E','7-E');
INSERT OR IGNORE INTO system_settings(key,value) VALUES
('attendance_threshold','80'),('school_timezone','Asia/Colombo'),('teacher_correction_allowed','false');
