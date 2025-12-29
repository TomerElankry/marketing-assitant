import { z } from 'zod';

// Basic MCP types based on JSON-RPC 2.0
export const JsonRpcRequestSchema = z.object({
    jsonrpc: z.literal('2.0'),
    method: z.string(),
    params: z.any().optional(),
    id: z.union([z.string(), z.number()]).optional(),
});

export type JsonRpcRequest = z.infer<typeof JsonRpcRequestSchema>;

export const JsonRpcResponseSchema = z.object({
    jsonrpc: z.literal('2.0'),
    result: z.any().optional(),
    error: z.object({
        code: z.number(),
        message: z.string(),
        data: z.any().optional(),
    }).optional(),
    id: z.union([z.string(), z.number(), z.null()]),
});

export type JsonRpcResponse = z.infer<typeof JsonRpcResponseSchema>;


export * from './agent.js';
