import type { UUID, Character } from "@elizaos/core";
import { API_CONFIG } from "@/lib/constants";

const BASE_URL = API_CONFIG.BASE_URL;

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
      // @ts-expect-error - Suppressing potentially undefined options header
      delete options.headers["Content-Type"];
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

// Import types from centralized location - DRY principle
import type { FamilyStats, FamilyHistory } from "@/types/family";

export type { FamilyStats, FamilyHistory } from "@/types/family";

export const apiClient = {
  sendMessage: (
    agentId: string,
    message: string,
    selectedFile?: File | null,
    settings?: any,
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
  getAgents: () => fetcher({ url: "/agents" }),
  getAgent: (agentId: string): Promise<{ id: UUID; character: Character }> =>
    fetcher({ url: `/agents/${agentId}` }),
  tts: (agentId: string, text: string) =>
    fetcher({
      url: `/${agentId}/tts`,
      method: "POST",
      body: {
        text,
      },
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
  getFamilyStats: (): Promise<FamilyStats> => fetcher({ url: "/family/stats" }),
  getFamilyHistory: (url?: string): Promise<FamilyHistory> =>
    fetcher({ url: url || "/family/stats/history" }),
  // --- Bond Score API (Phase 4a) ---
  getFamilyBondScore: (familyId: string) => {
    return fetch(`${API_CONFIG.HEALTH_BASE_URL}/api/families/${familyId}/bond-score`)
      .then(async (resp) => {
        if (resp.ok) {
          return resp.json();
        }
        const errorText = await resp.text();
        throw new Error(errorText || "Failed to fetch bond score");
      });
  },
  // --- GoodDollar endpoints ---
  getGDBalance: (address: string) =>
    fetcher({ url: `/gooddollar/wallet/${address}` }),
  getGDStatus: (address: string) =>
    fetcher({ url: `/gooddollar/status/${address}` }),
  claimGoodDollar: (address: string) =>
    fetcher({ url: `/gooddollar/claim`, method: "POST", body: { address } }),
  
  // --- Agent Insights ---
  getAgentInsights: (): Promise<{ insights: any[] }> =>
    fetcher({ url: "/agents/insights" }),
  getAgentInsight: (agentId: string): Promise<any> =>
    fetcher({ url: `/agents/${agentId}/insights` }),

  // --- AG-UI Protocol (Standardized AI-User Interaction) ---
  streamAGUI: (
    agentId: string,
    text: string,
    onEvent: (event: import("@/types/agui").AGUIEvent) => void,
    options?: {
      tools?: import("@/types/agui").ToolDefinition[];
      context?: Record<string, unknown>;
      userId?: string;
      roomId?: string;
      threadId?: string;
    },
  ): AbortController => {
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(`${BASE_URL}/${agentId}/ag-ui`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            user: options?.userId ?? "user",
            userId: options?.userId,
            roomId: options?.roomId,
            threadId: options?.threadId,
            tools: options?.tools,
            context: options?.context,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`AG-UI Stream failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                onEvent(data);
              } catch (e) {
                console.error("Failed to parse AG-UI event", e);
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("AG-UI stream error", err);
        }
      }
    })();

    return controller;
  },
};
