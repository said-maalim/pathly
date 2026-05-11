/**
 * scripts/db-tool.mjs
 *
 * One-off operator script for applying the four migrations in
 * docs/specs/data-model-cleanup.md against the linked Supabase
 * Postgres database, with backup + verification gates.
 *
 * Reads DB_URL from .env.supabase.local. Never echoes the
 * connection string.
 *
 * Subcommands:
 *   backup       Dump kv_store_268175b3, requests, responses to backups/<ts>.json
 *   state        Show current state of all touched objects (counts, columns, constraints)
 *   apply <file> Execute a single migration file from supabase/migrations/
 *   verify       Final success-criteria check (returns non-zero exit if any fail)
 *
 * Usage:
 *   node scripts/db-tool.mjs backup
 *   node scripts/db-tool.mjs state
 *   node scripts/db-tool.mjs apply supabase/migrations/20260511020000_responses_document_id_fk.sql
 *   node scripts/db-tool.mjs verify
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { Client } from 'pg';

// ─────────────────────────────────────────────────────────────────────────────
// Env loading

function loadEnv(path = '.env.supabase.local') {
  if (!existsSync(path)) {
    console.error(`ERROR: ${path} not found`);
    process.exit(1);
  }
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

loadEnv();

if (!process.env.DB_URL) {
  console.error('ERROR: DB_URL not set in .env.supabase.local');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Connection helper

function clientConfig() {
  // Parse DB_URL with a regex. Native URL() treats `postgresql://` as
  // a non-special scheme and refuses to extract userinfo; pg's own URI
  // parser mishandles Supabase pooler's dotted username
  // (`postgres.<project_ref>`). Hand-parsed and passed as discrete fields.
  const m = process.env.DB_URL.match(/^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:/]+):(\d+)\/(.+)$/);
  if (!m) {
    throw new Error('DB_URL does not match expected postgresql://user:pwd@host:port/db shape');
  }
  const [, user, password, host, port, database] = m;
  return {
    host,
    port: Number(port),
    database,
    user: decodeURIComponent(user),
    password: decodeURIComponent(password),
    ssl: { rejectUnauthorized: false },
  };
}

async function withClient(fn) {
  const client = new Client(clientConfig());
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// State queries

const STATE_QUERIES = [
  {
    label: 'kv_store_268175b3 table exists?',
    sql: `SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'kv_store_268175b3'
          ) AS exists;`,
  },
  {
    label: 'requests.uploaded_files column exists?',
    sql: `SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'requests' AND column_name = 'uploaded_files'
          ) AS exists;`,
  },
  {
    label: 'responses.document_url column exists?',
    sql: `SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'responses' AND column_name = 'document_url'
          ) AS exists;`,
  },
  {
    label: 'responses_document_id_fkey constraint exists?',
    sql: `SELECT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = 'public.responses'::regclass
              AND conname  = 'responses_document_id_fkey'
          ) AS exists;`,
  },
  {
    label: 'requests row count',
    sql: `SELECT COUNT(*)::int AS count FROM public.requests;`,
  },
  {
    label: 'responses row count',
    sql: `SELECT COUNT(*)::int AS count FROM public.responses;`,
  },
  {
    label: 'kv_store_268175b3 row count (if table exists)',
    sql: `DO $$ DECLARE c int; BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='kv_store_268175b3') THEN
              EXECUTE 'SELECT count(*) FROM public.kv_store_268175b3' INTO c;
              RAISE NOTICE 'kv_store_268175b3 row count: %', c;
            ELSE
              RAISE NOTICE 'kv_store_268175b3 table does not exist';
            END IF;
          END $$;`,
    raw: true,
  },
];

async function cmdState() {
  await withClient(async (client) => {
    console.log('━━━ Database State ━━━');
    for (const q of STATE_QUERIES) {
      try {
        if (q.raw) {
          const res = await client.query(q.sql);
          const notices = res?.notice || [];
          // pg client surfaces NOTICE via client events, not result rows.
          // For the kv_store row count, fall back to a direct conditional query:
          const exists = await client.query(`SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema='public' AND table_name='kv_store_268175b3') AS e;`);
          if (exists.rows[0].e) {
            const c = await client.query(`SELECT COUNT(*)::int AS count FROM public.kv_store_268175b3;`);
            console.log(`  ${q.label.padEnd(60)} ${c.rows[0].count}`);
          } else {
            console.log(`  ${q.label.padEnd(60)} (table absent)`);
          }
          continue;
        }
        const res = await client.query(q.sql);
        const row = res.rows[0];
        const val = row.exists !== undefined ? row.exists : row.count;
        console.log(`  ${q.label.padEnd(60)} ${val}`);
      } catch (err) {
        console.log(`  ${q.label.padEnd(60)} ERROR: ${err.message}`);
      }
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Backup: dump touched tables to JSON

async function cmdBackup() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = `backups/pre-migration-${ts}.json`;

  await withClient(async (client) => {
    const out = { timestamp: new Date().toISOString(), tables: {} };

    const tablesExists = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('kv_store_268175b3', 'requests', 'responses')
    `);
    const present = new Set(tablesExists.rows.map(r => r.table_name));

    for (const t of ['kv_store_268175b3', 'requests', 'responses']) {
      if (!present.has(t)) {
        out.tables[t] = { exists: false, rows: [] };
        continue;
      }
      const rows = await client.query(`SELECT * FROM public.${t};`);
      out.tables[t] = { exists: true, rowCount: rows.rowCount, rows: rows.rows };
    }

    writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log(`✓ Backup written: ${outPath}`);
    for (const [t, info] of Object.entries(out.tables)) {
      console.log(`  ${t.padEnd(24)} ${info.exists ? `${info.rowCount} rows` : '(table absent)'}`);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply one migration file

async function cmdApply(path) {
  if (!path) {
    console.error('ERROR: apply requires a migration file path');
    process.exit(1);
  }
  if (!existsSync(path)) {
    console.error(`ERROR: ${path} not found`);
    process.exit(1);
  }
  const sql = readFileSync(path, 'utf8');
  console.log(`━━━ Applying ${path} ━━━`);
  console.log(sql);
  console.log('━━━ Executing ━━━');

  await withClient(async (client) => {
    await client.query('BEGIN;');
    try {
      await client.query(sql);
      await client.query('COMMIT;');
      console.log('✓ COMMIT successful');
    } catch (err) {
      await client.query('ROLLBACK;').catch(() => {});
      console.error(`✗ Migration failed, rolled back: ${err.message}`);
      throw err;
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Final verification against spec success criteria

async function cmdVerify() {
  const checks = [
    { name: 'kv_store_268175b3 table gone',
      sql: `SELECT NOT EXISTS (
              SELECT 1 FROM information_schema.tables
              WHERE table_schema='public' AND table_name='kv_store_268175b3'
            ) AS pass;` },
    { name: 'requests.uploaded_files column gone',
      sql: `SELECT NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='requests' AND column_name='uploaded_files'
            ) AS pass;` },
    { name: 'responses.document_url column gone',
      sql: `SELECT NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='responses' AND column_name='document_url'
            ) AS pass;` },
    { name: 'responses.document_id FK exists',
      sql: `SELECT EXISTS (
              SELECT 1 FROM pg_constraint
              WHERE conrelid='public.responses'::regclass
                AND conname='responses_document_id_fkey'
            ) AS pass;` },
    { name: 'requests row count unchanged (=5)',
      sql: `SELECT (COUNT(*) = 5) AS pass FROM public.requests;` },
    { name: 'responses row count unchanged (=0)',
      sql: `SELECT (COUNT(*) = 0) AS pass FROM public.responses;` },
  ];

  let allPass = true;
  await withClient(async (client) => {
    console.log('━━━ Spec Success Criteria ━━━');
    for (const c of checks) {
      try {
        const res = await client.query(c.sql);
        const pass = res.rows[0].pass;
        console.log(`  ${pass ? '✓' : '✗'} ${c.name}`);
        if (!pass) allPass = false;
      } catch (err) {
        console.log(`  ✗ ${c.name} — ERROR: ${err.message}`);
        allPass = false;
      }
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(allPass ? '✓ All checks pass' : '✗ FAIL');
  });
  if (!allPass) process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main

const [, , cmd, arg] = process.argv;
const dispatch = { backup: cmdBackup, state: cmdState, apply: () => cmdApply(arg), verify: cmdVerify };

if (!dispatch[cmd]) {
  console.error('Usage: node scripts/db-tool.mjs <backup|state|apply <file>|verify>');
  process.exit(1);
}

try {
  await dispatch[cmd]();
} catch (err) {
  console.error(`FATAL: ${err.message}`);
  process.exit(1);
}
