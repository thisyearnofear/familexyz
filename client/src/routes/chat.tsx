import { useParams, useSearchParams } from "react-router-dom";
import { ChatInterface } from "@/components/ChatInterface";
import { AGUIChatInterface } from "@/components/AGUIChatInterface";
import type { UUID } from "@elizaos/core";

export default function AgentRoute() {
    const { agentId } = useParams<{ agentId: UUID }>();
    const [searchParams] = useSearchParams();
    const useProtocol = searchParams.get("protocol") === "ag-ui";

    if (!agentId) return <div>No data.</div>;

    if (useProtocol) {
        return <AGUIChatInterface />;
    }

    return <ChatInterface initialAgentId={agentId} />;
}
