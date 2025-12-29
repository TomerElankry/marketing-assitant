import { z } from 'zod';

export const McpToolSchema = z.object({
    name: z.string(),
    description: z.string(),
    inputSchema: z.record(z.any()),
});

export type McpTool = z.infer<typeof McpToolSchema>;
