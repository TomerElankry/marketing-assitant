import { McpAgent } from '@marketing-assistant/mcp-core';
import { Result } from '@marketing-assistant/schemas';

const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';

class LlmStubAgent extends McpAgent {
    constructor() {
        super({
            name: 'agent-llm-stub',
            version: '0.0.1',
            natsUrl: NATS_URL,
        });

        this.registerTool({
            name: 'analyze_market',
            description: 'Generates creative marketing analysis (personas, hooks, angles).',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string' }
                },
                required: ['query']
            }
        });
    }

    async start() {
        await this.connect();

        this.bus.subscribe<any>(`task.llm`, async (task) => {
            console.log(`Received LLM task: ${task.id}`);

            try {
                // Simulate "Thinking"
                await new Promise(r => setTimeout(r, 1000));

                const mockCreativeStrategy = {
                    persona: "Tech-savvy Growth Lead (Dana)",
                    pain_points: ["Creative fatigue", "Low CTR", "Guesswork"],
                    positioning: "The Data-Driven Creative Copilot",
                    messaging_angle: "Stop guessing. Start validating.",
                    hooks: [
                        "Your creative isn't failing, your strategy is.",
                        "What if your ads wrote themselves?",
                        "Data-backed creative in minutes, not days."
                    ],
                    channels: ["LinkedIn", "Twitter/X"],
                    confidence: 0.85
                };

                const result: Result = {
                    taskId: task.id,
                    status: 'success',
                    data: mockCreativeStrategy
                };

                await this.bus.publish('task.result', result);
                console.log(`Completed LLM task: ${task.id}`);

            } catch (err: any) {
                console.error(err);
                await this.bus.publish('task.result', { taskId: task.id, status: 'error', error: err.message });
            }
        });
    }
}

const agent = new LlmStubAgent();
agent.start().catch(err => {
    console.error(err);
    process.exit(1);
});
