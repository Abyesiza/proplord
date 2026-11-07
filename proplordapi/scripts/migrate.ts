import { config } from 'dotenv';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

config();

// Supabase direct connection: db.<project-ref>.supabase.co
function connectionConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  const ref = new URL(process.env.DB_SUPABASE_URL ?? '').hostname.split('.')[0];
  return {
    host: `db.${ref}.supabase.co`,
    port: 5432,
    user: 'postgres',
    database: 'postgres',
    password: process.env.DB_PASSWORD,
  };
}

async function main() {
  const client = new Client({
    ...connectionConfig(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query(
    'create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now())',
  );

  const dir = join(__dirname, '..', 'supabase', 'migrations');
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const done = await client.query(
      'select 1 from public._migrations where name = $1',
      [file],
    );
    if (done.rowCount) continue;

    console.log(`Applying ${file}`);
    try {
      await client.query('begin');
      await client.query(readFileSync(join(dir, file), 'utf8'));
      await client.query('insert into public._migrations (name) values ($1)', [
        file,
      ]);
      await client.query('commit');
    } catch (err) {
      await client.query('rollback');
      throw err;
    }
  }
  await client.end();
  console.log('Migrations up to date');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
