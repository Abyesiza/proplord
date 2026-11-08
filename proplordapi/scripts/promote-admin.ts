import { config } from 'dotenv';
import { Client } from 'pg';

config();

// Usage: npm run admin:promote -- someone@example.com
// The person must already have signed up; this switches their profile to the platform admin role.
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error('Pass the email of an existing account');

  const connection = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: `db.${new URL(process.env.DB_SUPABASE_URL ?? '').hostname.split('.')[0]}.supabase.co`,
        port: 5432,
        user: 'postgres',
        database: 'postgres',
        password: process.env.DB_PASSWORD,
      };

  const client = new Client({ ...connection, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const result = await client.query(
    "update public.profiles set role = 'admin' where lower(email) = $1 returning email",
    [email],
  );
  await client.end();

  if (!result.rowCount) throw new Error(`No account found for ${email}`);
  console.log(`${email} is now a platform admin`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
