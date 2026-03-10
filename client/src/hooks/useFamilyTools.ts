/**
 * useFamilyTools — frontend-defined tool definitions for AG-UI protocol.
 *
 * These tools are sent to the agent at the start of each run so the agent
 * can invoke them.  The UI renders approval/input dialogs; the result is
 * posted back to the agent via the tool-result channel.
 */

import { useMemo, useCallback, useState } from "react";
import type { ToolDefinition } from "@/types/agui";

// ────────────────────────────────────────────────────
// Tool catalogue
// ────────────────────────────────────────────────────

const FAMILY_TOOLS: ToolDefinition[] = [
  {
    name: "confirmPayout",
    description:
      "Ask the family member to approve an agent payout before it is executed on Hedera.",
    parameters: {
      type: "object",
      properties: {
        agentName: { type: "string", description: "Name of the agent requesting the payout" },
        amount: { type: "number", description: "FAM token amount" },
        reason: { type: "string", description: "Why the payout was earned" },
        transactionMemo: { type: "string", description: "On-chain memo for the transaction" },
      },
      required: ["agentName", "amount", "reason"],
    },
  },
  {
    name: "setFamilyGoal",
    description:
      "Propose a new shared family goal that members can collectively work toward.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short title for the goal" },
        description: { type: "string", description: "Detailed description of the goal" },
        targetDate: { type: "string", description: "ISO-8601 target date" },
        category: {
          type: "string",
          description: "Goal category",
          enum: ["communication", "bonding", "health", "growth", "traditions"],
        },
      },
      required: ["title", "description", "category"],
    },
  },
  {
    name: "suggestActivity",
    description:
      "Recommend a family activity to strengthen bonds, with expected impact details.",
    parameters: {
      type: "object",
      properties: {
        activity: { type: "string", description: "Name of the activity" },
        description: { type: "string", description: "How the activity works" },
        duration: { type: "string", description: "Estimated time commitment" },
        expectedImpact: { type: "string", description: "Expected impact on bond score" },
        targetMetric: {
          type: "string",
          description: "Which metric this activity targets",
          enum: ["bondScore", "communicationDepth", "presenceConsistency", "generationalBridge", "growthMomentum"],
        },
      },
      required: ["activity", "description", "expectedImpact"],
    },
  },
];

// ────────────────────────────────────────────────────
// Pending tool call state
// ────────────────────────────────────────────────────

export interface PendingToolCall {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

// ────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────

export function useFamilyTools() {
  const [pendingToolCalls, setPendingToolCalls] = useState<PendingToolCall[]>([]);

  const tools = useMemo(() => FAMILY_TOOLS, []);

  /** Called when the agent invokes a frontend tool — queues for user approval. */
  const enqueueToolCall = useCallback(
    (toolCallId: string, toolName: string, args: Record<string, unknown>) => {
      setPendingToolCalls((prev) => [...prev, { toolCallId, toolName, args }]);
    },
    [],
  );

  /** Remove a tool call from the queue after the user approves / rejects. */
  const resolveToolCall = useCallback((toolCallId: string) => {
    setPendingToolCalls((prev) => prev.filter((t) => t.toolCallId !== toolCallId));
  }, []);

  /** Clear all pending calls (e.g. on new run). */
  const clearPendingToolCalls = useCallback(() => setPendingToolCalls([]), []);

  return {
    tools,
    pendingToolCalls,
    enqueueToolCall,
    resolveToolCall,
    clearPendingToolCalls,
  };
}
