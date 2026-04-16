-- ============================================================
--  Add messages table for DSO ↔ Student bidirectional messaging
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id      UUID        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  -- thread_id groups a message and all its replies
  thread_id      UUID        NOT NULL DEFAULT gen_random_uuid(),
  -- parent_id points to the message being replied to (NULL for thread root)
  parent_id      UUID        REFERENCES messages(id),
  sender_id      UUID        NOT NULL REFERENCES users(id),
  sender_role    TEXT        NOT NULL CHECK (sender_role IN ('student', 'dso', 'admin')),
  -- recipient_id is NULL when a student sends to the school DSO office (broadcast)
  recipient_id   UUID        REFERENCES users(id),
  recipient_type TEXT        NOT NULL DEFAULT 'individual'
                             CHECK (recipient_type IN ('individual', 'bulk', 'school')),
  bulk_filter    JSONB,
  subject        TEXT        NOT NULL,
  body           TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'sent'
                             CHECK (status IN ('sent', 'delivered', 'read')),
  read_at        TIMESTAMPTZ,
  template_ref   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_school_id    ON messages(school_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id    ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id    ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id)
  WHERE recipient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_created_at   ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status       ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_role  ON messages(sender_role);

-- ── Row-Level Security ────────────────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Students: see messages they sent OR were directly addressed to them
CREATE POLICY "Students read own messages" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id
    OR auth.uid() = recipient_id
  );

-- DSO / admin: see all messages belonging to their school
CREATE POLICY "DSO reads school messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id    = auth.uid()
        AND role  IN ('dso', 'admin')
        AND school_id = messages.school_id
    )
  );

-- Any authenticated user can insert a message where they are the sender
CREATE POLICY "Sender can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Recipients and DSO can update a message (e.g. mark read)
CREATE POLICY "Recipient or DSO can update message" ON messages
  FOR UPDATE USING (
    auth.uid() = recipient_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id   = auth.uid()
        AND role IN ('dso', 'admin')
        AND school_id = messages.school_id
    )
  )
  WITH CHECK (true);
