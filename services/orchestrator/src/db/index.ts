import { Pool } from 'pg';

let pool: Pool;

export const initDB = () => {
    pool = new Pool({
        user: process.env.POSTGRES_USER || 'admin',
        password: process.env.POSTGRES_PASSWORD || 'password',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'marketing_assistant',
    });

    pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
    });

    console.log('Database pool initialized');
};

export const getPool = () => {
    if (!pool) {
        throw new Error('Database not initialized');
    }
    return pool;
};
