import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Server, Wrench, Activity } from 'lucide-react';

interface Tool {
  name: string;
  description: string;
  inputSchema: any;
}

interface Agent {
  agentId: string;
  service: string;
  tools: Tool[];
}

export function ToolsInspector() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = async () => {
    try {
      // Fetches from the Orchestrator via the Vite proxy (/mcp -> localhost:3000)
      const response = await fetch('/mcp/tools');
      if (!response.ok) throw new Error('Failed to connect to Orchestrator');
      const data = await response.json();
      setAgents(data);
      setError(null);
    } catch (err) {
      setError('Orchestrator is offline. Make sure to run: npm run dev --prefix services/orchestrator');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
    const interval = setInterval(fetchTools, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  if (loading && agents.length === 0) return <div className="p-4">Scanning for agents...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6 text-green-500" />
          MCP Inspector
        </h2>
        <Badge variant={error ? "destructive" : "outline"} className="text-sm">
          {error ? "Orchestrator Offline" : "System Healthy"}
        </Badge>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.agentId} className="overflow-hidden border-2 hover:border-blue-500 transition-colors">
            <CardHeader className="bg-gray-50/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Server className="h-5 w-5 text-blue-600" />
                  {agent.service}
                </CardTitle>
                <Badge variant="secondary" className="font-mono text-xs">
                  {agent.agentId.slice(0, 8)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Available Tools ({agent.tools.length})
              </h4>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-4">
                  {agent.tools.map((tool) => (
                    <div key={tool.name} className="p-3 bg-white rounded-lg border shadow-sm">
                      <div className="font-semibold text-sm text-blue-700">{tool.name}</div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {tool.description}
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <code className="text-[10px] text-gray-400">
                          Input: {Object.keys(tool.inputSchema?.properties || {}).join(', ')}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}

        {agents.length === 0 && !error && (
          <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
            No active agents found. Start an agent service to see it here.
          </div>
        )}
      </div>
    </div>
  );
}
