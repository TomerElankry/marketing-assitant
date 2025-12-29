import { MessageBus } from '@marketing-assistant/bus';
import { AgentHeartbeat, BusSubjects, McpTool } from '@marketing-assistant/schemas';
import { randomUUID } from 'crypto';

export interface McpAgentConfig {
    name: string;
    version: string;
    natsUrl?: string;
}

export class McpAgent {
    protected bus: MessageBus;
    protected tools: McpTool[] = [];
    protected agentId: string;
    protected config: McpAgentConfig;
    private heartbeatInterval: NodeJS.Timeout | null = null;

    constructor(config: McpAgentConfig) {
        this.config = config;
        this.agentId = randomUUID();
        this.bus = new MessageBus();
    }

    async connect() {
        const url = this.config.natsUrl || process.env.NATS_URL || 'nats://localhost:4222';
        await this.bus.connect(url);
        this.startHeartbeat();
        this.setupDiscoveryHandler();
        console.log(`Agent ${this.config.name} (${this.agentId}) connected to NATS`);
    }

    registerTool(tool: McpTool) {
        this.tools.push(tool);
    }

    private startHeartbeat() {
        const sendHeartbeat = async () => {
            const heartbeat: AgentHeartbeat = {
                agentId: this.agentId,
                service: this.config.name,
                version: this.config.version,
                timestamp: Date.now(),
                tools: this.tools,
            };
            try {
                await this.bus.publish(BusSubjects.AgentHeartbeat, heartbeat);
            } catch (err) {
                console.error('Failed to send heartbeat:', err);
            }
        };

        // Send immediately then interval
        sendHeartbeat();
        this.heartbeatInterval = setInterval(sendHeartbeat, 5000);
    }

    private setupDiscoveryHandler() {
        // Subscribe to explicit discovery requests
        this.bus.subscribe(BusSubjects.AgentDiscovery, async () => {
            // Force a heartbeat response
            const heartbeat: AgentHeartbeat = {
                agentId: this.agentId,
                service: this.config.name,
                version: this.config.version,
                timestamp: Date.now(),
                tools: this.tools,
            };
            await this.bus.publish(BusSubjects.AgentHeartbeat, heartbeat);
        });
    }

    async close() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        await this.bus.close();
    }
}
