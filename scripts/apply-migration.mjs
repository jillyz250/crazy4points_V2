#!/usr/bin/env node
// Apply a supabase/migrations/<file>.sql to the DB via the Supavisor pooler.
// Usage: node scripts/apply-migration.mjs 619_content_idea_roadmap_tags.sql
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'
const env = readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1') }
const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]
const file = process.argv[2]
if (!file) { console.error('usage: node scripts/apply-migration.mjs <file.sql>'); process.exit(1) }
const sql = readFileSync(join('supabase/migrations', file), 'utf8')
// Supabase moved direct connections to IPv6-only; use the IPv4 Supavisor pooler.
const client = new pg.Client({ host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543, user: `postgres.${ref}`, password: process.env.SUPABASE_DB_PASSWORD, database: 'postgres', ssl: { rejectUnauthorized: false } })
await client.connect()
await client.query(sql)
console.log('applied:', file)
await client.end()
