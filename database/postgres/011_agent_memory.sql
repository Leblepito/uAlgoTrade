-- =============================================================================
-- 011: Agent Memory — Long-term Decision Memory, Pattern Storage
-- =============================================================================

-- Agent long-term memory (MemoryCore persistence)
CREATE TABLE IF NOT EXISTS ualgo_agent_memory (
  id            BIGSERIAL PRIMARY KEY,
  agent_name    TEXT NOT NULL,
  memory_type   TEXT NOT NULL CHECK (memory_type IN ('decision', 'learning', 'pattern', 'error')),
  symbol        TEXT,
  content       JSONB NOT NULL,
  importance    NUMERIC(5,4) DEFAULT 0.5,
  ttl_hours     INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_memory_agent ON ualgo_agent_memory(agent_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_type ON ualgo_agent_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_memory_expiry ON ualgo_agent_memory(expires_at) WHERE expires_at IS NOT NULL;

-- Auto-set expires_at from ttl_hours on insert
CREATE OR REPLACE FUNCTION set_memory_expiry()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ttl_hours IS NOT NULL THEN
    NEW.expires_at := NEW.created_at + (NEW.ttl_hours || ' hours')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_memory_expiry ON ualgo_agent_memory;
CREATE TRIGGER trg_memory_expiry
BEFORE INSERT ON ualgo_agent_memory
FOR EACH ROW EXECUTE FUNCTION set_memory_expiry();

-- Cleanup function for expired memories
CREATE OR REPLACE FUNCTION cleanup_expired_memories()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ualgo_agent_memory WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
