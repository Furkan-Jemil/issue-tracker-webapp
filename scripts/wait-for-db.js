#!/usr/bin/env node
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.log('No DATABASE_URL set; skipping wait.');
  process.exit(0);
}

const url = new URL(DATABASE_URL);
const config = {
  host: url.hostname,
  port: url.port || 5432,
  user: url.username,
  password: url.password,
  database: url.pathname ? url.pathname.replace(/^\//, '') : undefined,
  connectionTimeoutMillis: 2000,
};

async function wait() {
  for (let i = 0; i < 60; i++) {
    const client = new Client(config);
    try {
      await client.connect();
      await client.end();
      console.log('Postgres is available');
      process.exit(0);
    } catch (err) {
      console.log(`Postgres not ready yet (${i + 1}/60): ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.error('Timed out waiting for Postgres');
  process.exit(1);
}

wait();
