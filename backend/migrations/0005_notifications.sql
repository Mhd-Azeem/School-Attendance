PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS notifications (
 id TEXT PRIMARY KEY,
 recipient_user_id TEXT NOT NULL REFERENCES users(id),
 sender_user_id TEXT REFERENCES users(id),
 class_id TEXT REFERENCES classes(id),
 type TEXT NOT NULL,
 title TEXT NOT NULL,
 message TEXT NOT NULL,
 is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN(0,1)),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 read_at TEXT
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx
 ON notifications(recipient_user_id,is_read,created_at);

CREATE INDEX IF NOT EXISTS notifications_class_idx
 ON notifications(class_id,created_at);
