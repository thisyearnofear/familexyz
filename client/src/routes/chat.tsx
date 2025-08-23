import { useParams } from "react-router";
import { ChatInterface } from "@/components/ChatInterface";
import type { UUID } from "@elizaos/core";

export default function AgentRoute() {
    const { agentId } = useParams<{ agentId: UUID }>();

    if (!agentId) return <div>No data.</div>;

    return <ChatInterface initialAgentId={agentId} />;
}
