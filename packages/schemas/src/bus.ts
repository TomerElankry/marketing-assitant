import { z } from 'zod';
import { McpToolSchema } from './mcp/index.js';

export const BusSubjects = {
    AgentHeartbeat: 'agent.heartbeat',
    AgentDiscovery: 'agent.discovery',
    TaskSubmit: 'task.submit',
    TaskResult: 'task.result',
} as const;

export const AgentHeartbeatSchema = z.object({
    agentId: z.string(),
    service: z.string(),
    version: z.string(),
    timestamp: z.number(),
    tools: z.array(McpToolSchema),
    metadata: z.record(z.any()).optional(),
});

export type AgentHeartbeat = z.infer<typeof AgentHeartbeatSchema>;
