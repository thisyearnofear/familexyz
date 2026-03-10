/**
 * AG-UI Protocol Event Types
 *
 * Aligned with the Agent-User Interaction Protocol specification.
 * https://docs.ag-ui.com/concepts/events
 *
 * FamilyXYZ extensions are prefixed with `family.` in custom event names.
 */

// ============================================================
// Event Type Enum
// ============================================================

export enum EventType {
  // Lifecycle
  RUN_STARTED = "RunStarted",
  RUN_FINISHED = "RunFinished",
  RUN_ERROR = "RunError",

  // Steps
  STEP_STARTED = "StepStarted",
  STEP_FINISHED = "StepFinished",

  // Text messages
  TEXT_MESSAGE_START = "TextMessageStart",
  TEXT_MESSAGE_CONTENT = "TextMessageContent",
  TEXT_MESSAGE_END = "TextMessageEnd",

  // Tool calls
  TOOL_CALL_START = "ToolCallStart",
  TOOL_CALL_ARGS = "ToolCallArgs",
  TOOL_CALL_END = "ToolCallEnd",

  // State management
  STATE_SNAPSHOT = "StateSnapshot",
  STATE_DELTA = "StateDelta",

  // Special
  CUSTOM = "Custom",
  RAW = "Raw",
}

// ============================================================
// Base Event
// ============================================================

export interface BaseEvent {
  type: EventType | string;
  timestamp?: number;
  rawEvent?: unknown;
}

// ============================================================
// Lifecycle Events
// ============================================================

export interface RunStartedEvent extends BaseEvent {
  type: EventType.RUN_STARTED;
  runId: string;
  threadId?: string;
}

export interface RunFinishedEvent extends BaseEvent {
  type: EventType.RUN_FINISHED;
  runId: string;
  threadId?: string;
  result?: unknown;
}

export interface RunErrorEvent extends BaseEvent {
  type: EventType.RUN_ERROR;
  message: string;
  code?: string;
}

// ============================================================
// Step Events
// ============================================================

export interface StepStartedEvent extends BaseEvent {
  type: EventType.STEP_STARTED;
  stepName: string;
}

export interface StepFinishedEvent extends BaseEvent {
  type: EventType.STEP_FINISHED;
  stepName: string;
}

// ============================================================
// Text Message Events
// ============================================================

export interface TextMessageStartEvent extends BaseEvent {
  type: EventType.TEXT_MESSAGE_START;
  messageId: string;
  role?: "assistant";
}

export interface TextMessageContentEvent extends BaseEvent {
  type: EventType.TEXT_MESSAGE_CONTENT;
  messageId: string;
  content: string;
}

export interface TextMessageEndEvent extends BaseEvent {
  type: EventType.TEXT_MESSAGE_END;
  messageId: string;
}

// ============================================================
// Tool Call Events
// ============================================================

export interface ToolCallStartEvent extends BaseEvent {
  type: EventType.TOOL_CALL_START;
  toolCallId: string;
  toolCallName: string;
  parentMessageId?: string;
}

export interface ToolCallArgsEvent extends BaseEvent {
  type: EventType.TOOL_CALL_ARGS;
  toolCallId: string;
  delta: string; // partial JSON streamed
}

export interface ToolCallEndEvent extends BaseEvent {
  type: EventType.TOOL_CALL_END;
  toolCallId: string;
}

// ============================================================
// State Management Events (JSON Patch RFC 6902)
// ============================================================

export interface StateSnapshotEvent extends BaseEvent {
  type: EventType.STATE_SNAPSHOT;
  snapshot: Record<string, unknown>;
}

export interface JsonPatchOp {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
}

export interface StateDeltaEvent extends BaseEvent {
  type: EventType.STATE_DELTA;
  delta: JsonPatchOp[];
}

// ============================================================
// Custom Events
// ============================================================

export interface CustomEvent extends BaseEvent {
  type: EventType.CUSTOM;
  name: string;
  value: unknown;
}

// ============================================================
// Union type for all events
// ============================================================

export type AGUIEvent =
  | RunStartedEvent
  | RunFinishedEvent
  | RunErrorEvent
  | StepStartedEvent
  | StepFinishedEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | ToolCallStartEvent
  | ToolCallArgsEvent
  | ToolCallEndEvent
  | StateSnapshotEvent
  | StateDeltaEvent
  | CustomEvent;

// ============================================================
// Tool Definition (frontend-defined, sent to agent)
// ============================================================

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description?: string; enum?: string[] }>;
    required?: string[];
  };
}

// ============================================================
// RunAgentInput — request body for AG-UI endpoint
// ============================================================

export interface RunAgentInput {
  text: string;
  user?: string;
  userId?: string;
  roomId?: string;
  threadId?: string;
  tools?: ToolDefinition[];
  context?: Record<string, unknown>;
}

// ============================================================
// Family-specific custom event names
// ============================================================

export const FamilyEvents = {
  BOND_SCORE_UPDATE: "family.bond_score_update",
  PAYOUT_PROPOSED: "family.payout_proposed",
  GOAL_SUGGESTED: "family.goal_suggested",
  ACTIVITY_SUGGESTED: "family.activity_suggested",
  MILESTONE_REACHED: "family.milestone_reached",
} as const;
