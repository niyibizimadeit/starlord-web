import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env.local manually (no dotenv dependency)
function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env.local');
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const KNOWN_TABLES = [
  'products', 'product_images', 'product_variations',
  'categories', 'orders', 'order_items',
  'users', 'reviews', 'banners',
  'promotions', 'promotion_products',
  'settings', 'admin_logs', 'processed_webhooks'
];

async function getTableSchema(tableName) {
  // Try to get one row to introspect column names and types
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error) {
    return { exists: false, error: error.message };
  }

  if (!data || data.length === 0) {
    // Table exists but is empty — try to get column info from REST headers
    // Use HEAD request to check structure
    const { data: colData, error: colErr } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    return { exists: true, empty: true, columns: [], sample: null };
  }

  const sample = data[0];
  const columns = Object.keys(sample).map(col => {
    const val = sample[col];
    let type = 'text';
    if (typeof val === 'number') {
      type = Number.isInteger(val) ? 'integer' : 'numeric';
    } else if (typeof val === 'boolean') {
      type = 'boolean';
    } else if (Array.isArray(val)) {
      type = 'jsonb'; // arrays stored as jsonb
    } else if (typeof val === 'object' && val !== null) {
      type = 'jsonb';
    } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      type = 'timestamp with time zone';
    }
    return { name: col, type, sample: val };
  });

  return { exists: true, empty: false, columns, sample };
}

async function getRowCount(tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });
  return error ? '?' : count;
}

async function main() {
  let output = [];
  output.push('-- =============================================================');
  output.push('-- STARLORD GROUP — Database Schema');
  output.push(`-- Project: zphpfahgyerabtpvtwol.supabase.co`);
  output.push(`-- Extracted: ${new Date().toISOString()}`);
  output.push('-- Method: Supabase REST API introspection');
  output.push('--');
  output.push('-- NOTE: This is structural introspection, not a full DDL dump.');
  output.push('-- Foreign keys, indexes, triggers, RLS policies, and constraints');
  output.push('-- are NOT included. For those, use the Supabase Dashboard.');
  output.push('-- =============================================================\n');

  let foundTables = [];
  let missingTables = [];

  for (const tableName of KNOWN_TABLES) {
    process.stdout.write(`  ${tableName}... `);
    const schema = await getTableSchema(tableName);

    if (!schema.exists) {
      console.log(`NOT FOUND (${schema.error})`);
      missingTables.push(tableName);
      continue;
    }

    const count = await getRowCount(tableName);
    console.log(`${schema.columns.length} cols, ${count} rows`);

    foundTables.push({ name: tableName, schema, count });

    output.push(`-- ─────────────────────────────────────────────────────────────`);
    output.push(`-- Table: public.${tableName}  (${count} rows)`);
    output.push(`-- ─────────────────────────────────────────────────────────────`);
    output.push(`CREATE TABLE ${tableName} (`);

    if (schema.columns.length > 0) {
      const colDefs = schema.columns.map((c, i) => {
        const comma = i < schema.columns.length - 1 ? ',' : '';
        let def = `  "${c.name}" ${c.type}`;
        if (c.name === 'id') def += ' NOT NULL';
        // Add sample comment for context
        const sampleStr = c.sample !== null && c.sample !== undefined
          ? ` -- e.g. ${JSON.stringify(c.sample)}`.slice(0, 80)
          : '';
        return def + comma + sampleStr;
      });
      output.push(colDefs.join('\n'));
    } else {
      output.push('  -- columns unknown (table is empty)');
    }

    output.push(');\n');

    // Add sample row as INSERT comment
    if (schema.sample) {
      output.push(`-- Sample row:`);
      output.push(`-- ${JSON.stringify(schema.sample).slice(0, 200)}`);
      output.push('');
    }
  }

  // ── Summary ────────────────────────────────────────────────────────
  output.push('-- =============================================================');
  output.push('-- SUMMARY');
  output.push('-- =============================================================');
  output.push(`-- Tables found:    ${foundTables.length}`);
  output.push(`-- Tables missing:  ${missingTables.length}`);
  if (missingTables.length > 0) {
    output.push(`-- Missing: ${missingTables.join(', ')}`);
  }
  output.push(`--`);
  output.push(`-- Found tables:`);
  for (const t of foundTables) {
    output.push(`--   ${t.name}: ${t.schema.columns.length} columns, ${t.count} rows`);
  }

  const filePath = resolve(__dirname, '..', 'schema.sql');
  writeFileSync(filePath, output.join('\n'));
  console.log(`\n✅ Schema written to ${filePath}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
