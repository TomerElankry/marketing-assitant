import { Pool } from 'pg';

export interface Artifact {
    id?: string;
    job_id: string;
    project_id?: string;
    name: string;
    path: string;
    bucket: string;
    mime_type?: string;
    size_bytes?: number;
    metadata?: any;
    created_at?: Date;
}

export class ArtifactRepository {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async createArtifact(artifact: Artifact): Promise<Artifact> {
        const query = `
            INSERT INTO artifacts (job_id, project_id, name, path, bucket, mime_type, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [
            artifact.job_id,
            artifact.project_id,
            artifact.name,
            artifact.path,
            artifact.bucket,
            artifact.mime_type,
            artifact.metadata || {}
        ];
        const res = await this.pool.query(query, values);
        return res.rows[0];
    }

    async getArtifact(id: string): Promise<Artifact | null> {
        const query = 'SELECT * FROM artifacts WHERE id = $1';
        const res = await this.pool.query(query, [id]);
        return res.rows[0] || null;
    }

    async getArtifactsByJob(jobId: string): Promise<Artifact[]> {
        const query = 'SELECT * FROM artifacts WHERE job_id = $1';
        const res = await this.pool.query(query, [jobId]);
        return res.rows;
    }
}
