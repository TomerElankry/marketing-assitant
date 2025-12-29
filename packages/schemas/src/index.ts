import { z } from 'zod';

export const TaskSchema = z.object({
    id: z.string(),
    type: z.string(),
    payload: z.record(z.any()),
});

export type Task = z.infer<typeof TaskSchema>;

export const ResultSchema = z.object({
    taskId: z.string(),
    status: z.enum(['success', 'error']),
    data: z.record(z.any()).optional(),
    error: z.string().optional(),
});

export type Result = z.infer<typeof ResultSchema>;

export const LogSchema = z.object({
    level: z.enum(['info', 'warn', 'error', 'debug']),
    message: z.string(),
    timestamp: z.string(),
    service: z.string(),
});



export * from './mcp/index.js';
export * from './mcp/data-agent.js';
export * from './mcp/report-agent.js';
export * from './bus.js';
export * from './job.js';
