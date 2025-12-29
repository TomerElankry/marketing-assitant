import { z } from 'zod';

export const JobSchema = z.object({
    id: z.string().uuid().optional(),
    project_id: z.string().uuid().optional(),
    type: z.string(),
    status: z.enum(['pending', 'running', 'completed', 'failed']).default('pending'),
    config: z.record(z.any()).default({}),
    trace_id: z.string().optional(),
    created_at: z.date().optional(),
    updated_at: z.date().optional(),
    completed_at: z.date().optional(),
});

export type Job = z.infer<typeof JobSchema>;
