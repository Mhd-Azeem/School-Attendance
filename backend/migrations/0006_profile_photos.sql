CREATE TABLE IF NOT EXISTS user_profile_photos (
  user_id TEXT PRIMARY KEY,
  data_url TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_profile_photos_updated_at
ON user_profile_photos(updated_at);
