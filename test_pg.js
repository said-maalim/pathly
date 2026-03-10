import { Client } from 'pg';
const password = encodeURIComponent('N2crpRr8d??tq#7');
const uri = `postgresql://postgres:${password}@db.kjzigbozunhisvmvxbxx.supabase.co:5432/postgres`;
console.log("URI: ", uri);

const client = new Client({ connectionString: uri });

client.connect()
  .then(() => console.log('Connected safely!'))
  .catch(err => console.error('Connection error', err.stack))
  .finally(() => client.end());
