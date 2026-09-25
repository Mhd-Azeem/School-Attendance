PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS class_teacher_assignments (
 class_id TEXT PRIMARY KEY REFERENCES classes(id),
 teacher_id TEXT NOT NULL REFERENCES users(id),
 assigned_by TEXT REFERENCES users(id),
 assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS class_periods (
 id TEXT PRIMARY KEY,
 class_id TEXT NOT NULL REFERENCES classes(id),
 period_no INTEGER NOT NULL,
 subject TEXT NOT NULL,
 teacher_id TEXT REFERENCES users(id),
 is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN(0,1)),
 UNIQUE(class_id,period_no)
);
CREATE TABLE IF NOT EXISTS period_teacher_attendance (
 id TEXT PRIMARY KEY,
 class_id TEXT NOT NULL REFERENCES classes(id),
 period_id TEXT NOT NULL REFERENCES class_periods(id),
 attendance_date TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('ARRIVED','NOT_ARRIVED','DELAYED','RELIEF','NOT_ARRIVED_RELIEF')),
 marked_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(period_id,attendance_date)
);
CREATE INDEX IF NOT EXISTS period_teacher_attendance_date_idx ON period_teacher_attendance(attendance_date,class_id);
