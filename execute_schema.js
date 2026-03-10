import { Client } from 'pg';
import fs from 'fs';

async function migrate() {
    console.log('Starting migration...');
    const client = new Client({
        host: 'db.kjzigbozunhisvmvxbxx.supabase.co',
        port: 6543,
        user: 'postgres',
        password: 'pathly2026!',
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const schema = fs.readFileSync('./src/DATABASE_SCHEMA.sql', 'utf8');

        console.log('Executing schema...');
        await client.query(schema);
        console.log('Schema executed successfully.');

        console.log('Inserting initial tenant...');
        const res = await client.query(`
            INSERT INTO schools (name, code, subscription_status)
            VALUES ('Your University', 'university-001', 'active')
            RETURNING id;
        `);
        console.log('Tenant inserted successfully. School ID:', res.rows[0].id);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
