import { Pool } from 'pg';
import { Job } from '@marketing-assistant/schemas';

export class JobRepository {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async createJob(job: Job): Promise<Job> {
        const query = `
            INSERT INTO jobs (type, status, config, trace_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [job.type, job.status, job.config, job.trace_id];
        const res = await this.pool.query(query, values);
        return res.rows[0];
    }

    async updateStatus(id: string, status: string, completedAt?: Date): Promise<Job> {
        let query = 'UPDATE jobs SET status = $2, updated_at = NOW()';
        const values: any[] = [id, status];

        if (completedAt) {
            query += ', completed_at = $3';
            values.push(completedAt);
        }

        query += ' WHERE id = $1 RETURNING *';

        const res = await this.pool.query(query, values);
        return res.rows[0];
    }

    async getJob(id: string): Promise<Job | null> {
        const query = 'SELECT * FROM jobs WHERE id = $1';
        const res = await this.pool.query(query, [id]);
        return res.rows[0] || null;
    }
}
