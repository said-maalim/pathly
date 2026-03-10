import { Client } from 'pg';
const client = new Client({
  host: 'db.kjzigbozunhisvmvxbxx.supabase.co',
  port: 6543,
  user: 'postgres',
  password: 'N2crpRr8d??tq#7',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => console.log('Connected safely!'))
  .catch(err => console.error('Connection error', err.stack))
  .finally(() => client.end());
