import { useQuery } from '@tanstack/react-query';
import type { AgentStatus } from '@/lib/agents';

interface AgentStreamEvent {
  type: string;
  agents: AgentStatus[];
  isConnected: boolean;
}

export function useAgentStatuses() {
  return useQuery<AgentStatus[]>({
    queryKey: ['agent-statuses'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      if (!res.ok) return [];
      const reader = res.body?.getReader();
      if (!reader) return [];
      const decoder = new TextDecoder();
      const { value } = await reader.read();
      reader.cancel();
      const text = decoder.decode(value);
      const line = text.split('\n').find((l) => l.startsWith('data: '));
      if (!line) return [];
      const event: AgentStreamEvent = JSON.parse(line.slice(6));
      return event.agents || [];
    },
    refetchInterval: 30_000,
  });
}
