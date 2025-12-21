import { McpAgent } from '@marketing-assistant/mcp-core';
import {
    ValidateQuestionnaireSchema,
    NormalizationResult,
    ValidateQuestionnaireInput
} from '@marketing-assistant/schemas';
import { Result } from '@marketing-assistant/schemas';
import { z } from 'zod';

// Define the shape of a Valid Questionnaire for normalization
const QuestionnaireRules = z.object({
    productName: z.string().min(1, "Product name is required"),
    targetAudience: z.string().min(1, "Target audience is required"),
    objectives: z.array(z.string()).min(1, "At least one objective is required"),
    country: z.string().min(2, "Country code must be at least 2 chars"),
});

class DataAgent extends McpAgent {
    constructor() {
        super({
            name: 'agent-data',
            version: '0.0.1'
        });

        this.registerTool({
            name: 'validate_questionnaire',
            description: 'Validates and normalizes user questionnaire data.',
            inputSchema: {
                type: 'object',
                properties: {
                    // For M0, we accept the raw data directly in the payload to simplify
                    // In a real scenario, we might fetch by ID
                    questionnaire: { type: 'object' }
                },
                required: ['questionnaire']
            }
        });
    }

    async start() {
        await this.connect();

        this.bus.subscribe<any>('task.data', async (task) => {
            console.log(`Received data task: ${task.id}`);

            try {
                // Logic: Extract questionnaire from payload
                const rawData = task.payload?.questionnaire;

                if (!rawData) {
                    throw new Error('No questionnaire data provided in payload');
                }

                // Validate
                const validation = QuestionnaireRules.safeParse(rawData);

                const response: NormalizationResult = {
                    valid: validation.success,
                    issues: validation.success ? [] : validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
                    normalized_data: validation.success ? validation.data : undefined
                };

                const result: Result = {
                    taskId: task.id,
                    status: response.valid ? 'success' : 'error',
                    data: response as any, // Cast to generic record
                    error: response.valid ? undefined : 'Validation failed'
                };

                await this.bus.publish('task.result', result);
                console.log(`Completed data task: ${task.id}, Valid: ${response.valid}`);

            } catch (err: any) {
                console.error(`Task failed: ${task.id}`, err);
                const result: Result = {
                    taskId: task.id,
                    status: 'error',
                    error: err.message
                };
                await this.bus.publish('task.result', result);
            }
        });
    }
}

const agent = new DataAgent();
agent.start().catch(err => {
    console.error(err);
    process.exit(1);
});
