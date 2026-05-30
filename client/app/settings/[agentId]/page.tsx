'use client';

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Overview } from "@/components/overview/Overview";

export default function AgentSettingsPage() {
    const params = useParams();
    const agentId = params.agentId as string;

    const query = useQuery({
        queryKey: ["agent", agentId],
        queryFn: () => apiClient.getAgent(agentId ?? ""),
        refetchInterval: 5_000,
        enabled: Boolean(agentId),
    });

    if (!agentId) return <div>No data.</div>;

    const character = query?.data?.character;

    if (!character) return null;

    return <Overview character={character} />;
}
