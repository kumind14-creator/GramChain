let cachedPool = null;
let initializationPromise = null;

function isDatabaseLoggingEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

function shouldUseSsl() {
  if (process.env.PGSSLMODE === "disable") {
    return false;
  }

  return process.env.NODE_ENV === "production" || /render\.com/i.test(process.env.DATABASE_URL || "");
}

function getPool() {
  if (!isDatabaseLoggingEnabled()) {
    return null;
  }

  if (cachedPool) {
    return cachedPool;
  }

  const { Pool } = require("pg");
  cachedPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: shouldUseSsl() ? { rejectUnauthorized: false } : false
  });

  cachedPool.on("error", (error) => {
    console.error("Postgres pool error:", error);
  });

  return cachedPool;
}

async function initLoggingStore() {
  if (!isDatabaseLoggingEnabled()) {
    return { ok: true, mode: "file" };
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS research_logs (
        id BIGSERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        participant_code TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_research_logs_session_id
      ON research_logs (session_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_research_logs_logged_at
      ON research_logs (logged_at DESC);
    `);

    return { ok: true, mode: "postgres" };
  })();

  return initializationPromise;
}

async function writeLogEntry(entry) {
  const pool = getPool();
  if (!pool) {
    return { ok: false, mode: "file" };
  }

  await initLoggingStore();

  await pool.query(
    `
      INSERT INTO research_logs (
        session_id,
        participant_code,
        event_type,
        payload,
        logged_at
      )
      VALUES ($1, $2, $3, $4::jsonb, $5)
    `,
    [
      String(entry.sessionId || "unknown"),
      String(entry.participantCode || "unknown"),
      String(entry.type || "unknown"),
      JSON.stringify(entry.payload || {}),
      entry.loggedAt || new Date().toISOString()
    ]
  );

  return { ok: true, mode: "postgres" };
}

function getLoggingModeLabel() {
  return isDatabaseLoggingEnabled() ? "postgres" : "file";
}

module.exports = {
  getLoggingModeLabel,
  initLoggingStore,
  isDatabaseLoggingEnabled,
  writeLogEntry
};
