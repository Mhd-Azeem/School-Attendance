PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS academic_promotions (
 id TEXT PRIMARY KEY,
 from_year_id TEXT NOT NULL REFERENCES academic_years(id),
 to_year_id TEXT NOT NULL REFERENCES academic_years(id),
 status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK(status IN ('DRAFT','COMPLETED')),
 created_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 confirmed_at TEXT,
 UNIQUE(from_year_id,to_year_id)
);

CREATE TABLE IF NOT EXISTS promotion_class_mappings (
 id TEXT PRIMARY KEY,
 promotion_id TEXT NOT NULL REFERENCES academic_promotions(id) ON DELETE CASCADE,
 from_class_id TEXT NOT NULL REFERENCES classes(id),
 to_class_id TEXT REFERENCES classes(id),
 new_teacher_id TEXT REFERENCES users(id),
 UNIQUE(promotion_id,from_class_id)
);

CREATE TABLE IF NOT EXISTS promotion_students (
 id TEXT PRIMARY KEY,
 promotion_id TEXT NOT NULL REFERENCES academic_promotions(id) ON DELETE CASCADE,
 student_id TEXT NOT NULL REFERENCES students(id),
 from_class_id TEXT NOT NULL REFERENCES classes(id),
 to_class_id TEXT REFERENCES classes(id),
 outcome TEXT NOT NULL CHECK(outcome IN ('PROMOTE','REPEAT','LEFT')),
 UNIQUE(promotion_id,student_id)
);

CREATE TABLE IF NOT EXISTS class_teacher_history (
 id TEXT PRIMARY KEY,
 academic_year_id TEXT NOT NULL REFERENCES academic_years(id),
 class_id TEXT NOT NULL REFERENCES classes(id),
 teacher_id TEXT NOT NULL REFERENCES users(id),
 assigned_by TEXT REFERENCES users(id),
 assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS promotion_students_promotion_idx ON promotion_students(promotion_id,outcome);
CREATE INDEX IF NOT EXISTS class_teacher_history_year_idx ON class_teacher_history(academic_year_id,class_id);
