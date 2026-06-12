import type { Character } from "@/types/elizaos";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.famile.xyz";

const fetcher = async ({
    url,
    method,
    body,
    headers,
}: {
    url: string;
    method?: "GET" | "POST";
    body?: object | FormData;
    headers?: HeadersInit;
}) => {
    const options: RequestInit = {
        method: method ?? "GET",
        headers: headers
            ? headers
            : {
                  Accept: "application/json",
                  "Content-Type": "application/json",
              },
    };

    if (method === "POST") {
        if (body instanceof FormData) {
            const h = new Headers(options.headers);
            h.delete("Content-Type");
            options.headers = h;
            options.body = body;
        } else {
            options.body = JSON.stringify(body);
        }
    }

    return fetch(`${BASE_URL}${url}`, options).then(async (resp) => {
        if (resp.ok) {
            const contentType = resp.headers.get("Content-Type");
            if (contentType === "audio/mpeg") {
                return await resp.blob();
            }
            return resp.json();
        }

        const errorText = await resp.text();
        console.error("Error: ", errorText);

        let errorMessage = "An error occurred.";
        try {
            const errorObj = JSON.parse(errorText);
            errorMessage = errorObj.message || errorMessage;
        } catch {
            errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
    });
};

export interface AgUiEvent {
    type: string;
    timestamp?: number;
    [key: string]: any;
}

export const apiClient = {
    sendMessage: (
        agentId: string,
        message: string,
        selectedFile?: File | null,
        settings?: any
    ) => {
        const formData = new FormData();
        formData.append("text", message);
        formData.append("user", "user");

        if (selectedFile) {
            formData.append("file", selectedFile);
        }

        if (settings) {
            formData.append("veniceParameters", JSON.stringify(settings));
        }

        return fetcher({
            url: `/${agentId}/message`,
            method: "POST",
            body: formData,
        });
    },

    sendMessageStream: async function* (
        agentId: string,
        message: string,
        signal?: AbortSignal
    ): AsyncGenerator<AgUiEvent> {
        const res = await fetch(`${BASE_URL}/${agentId}/ag-ui`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
            body: JSON.stringify({ text: message, userId: "user" }),
            signal,
        });

        if (!res.ok || !res.body) {
            throw new Error(`AG-UI request failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    try {
                        yield JSON.parse(line.slice(6));
                    } catch {
                        // skip malformed events
                    }
                }
            }
        }

        if (buffer.startsWith("data: ")) {
            try {
                yield JSON.parse(buffer.slice(6));
            } catch {
                // skip malformed final event
            }
        }
    },
    getAgents: () => fetcher({ url: "/agents" }).then((res: any) => res.data ?? res),
    getAgent: (agentId: string): Promise<{ id: string; character: Character }> =>
        fetcher({ url: `/agents/${agentId}` }),
    tts: (agentId: string, text: string) =>
        fetcher({
            url: `/${agentId}/tts`,
            method: "POST",
            body: { text },
            headers: {
                "Content-Type": "application/json",
                Accept: "audio/mpeg",
                "Transfer-Encoding": "chunked",
            },
        }),
    whisper: async (agentId: string, audioBlob: Blob) => {
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.wav");
        return fetcher({
            url: `/${agentId}/whisper`,
            method: "POST",
            body: formData,
        });
    },

    createSession: (accountId: string, familyId?: string) =>
        fetcher({ url: "/api/auth/session", method: "POST", body: { accountId, familyId } }),

    getMarketplaceAgents: (category?: string) => {
        const params = category ? `?category=${category}` : "";
        return fetcher({ url: `/api/marketplace/agents${params}` });
    },

    getMarketplaceAgent: (slug: string) =>
        fetcher({ url: `/api/marketplace/agents/${slug}` }),

    subscribeToAgent: (agentSlug: string) =>
        fetcher({
            url: "/api/marketplace/subscribe",
            method: "POST",
            body: { agentSlug },
        }),

    getSubscriptionStatus: () =>
        fetcher({ url: "/api/subscription/status" }),
};
