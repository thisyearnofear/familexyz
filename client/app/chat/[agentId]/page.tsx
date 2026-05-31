'use client';

import { useParams, useSearchParams } from "next/navigation";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { AGUIChatInterface } from "@/components/chat/AGUIChatInterface";

export default function ChatPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const agentId = params.agentId as string;
    const context = searchParams.get("context") || undefined;
    const useProtocol = searchParams.get("protocol") === "ag-ui";

    if (!agentId) return <div>No data.</div>;

    if (useProtocol) {
        return <AGUIChatInterface />;
    }

    return <ChatInterface initialAgentId={agentId} context={context} />;
}
