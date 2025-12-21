import { MessageBus } from '@marketing-assistant/bus';
import { AgentHeartbeat, BusSubjects, McpTool } from '@marketing-assistant/schemas';

interface AgentInfo {
    lastSeen: number;
    heartbeat: AgentHeartbeat;
}

export class DiscoveryService {
    private bus: MessageBus;
    private agents: Map<string, AgentInfo> = new Map();

    constructor(bus: MessageBus) {
        this.bus = bus;
    }

    start() {
        this.bus.subscribe<AgentHeartbeat>(BusSubjects.AgentHeartbeat, (heartbeat) => {
            if (!this.isValidHeartbeat(heartbeat)) return;

            this.agents.set(heartbeat.agentId, {
                lastSeen: Date.now(),
                heartbeat,
            });
            // console.log(`Discovered/Updated agent: ${heartbeat.service} (${heartbeat.agentId})`);
        });
    }

    private isValidHeartbeat(hb: any): hb is AgentHeartbeat {
        return hb && hb.agentId && hb.service;
    }

    getAllTools(): { agentId: string; service: string; tools: McpTool[] }[] {
        const now = Date.now();
        const activeAgents: { agentId: string; service: string; tools: McpTool[] }[] = [];

        // Filter out stale agents (> 15 seconds)
        for (const [id, info] of this.agents.entries()) {
            if (now - info.lastSeen < 15000) {
                activeAgents.push({
                    agentId: id,
                    service: info.heartbeat.service,
                    tools: info.heartbeat.tools || [],
                });
            } else {
                this.agents.delete(id);
            }
        }
        return activeAgents;
    }

    async refresh() {
        // Publish discovery request to solicit immediate heartbeats
        await this.bus.publish(BusSubjects.AgentDiscovery, {});
    }
}
