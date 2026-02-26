import { type Action, type Plugin, type IAgentRuntime } from "@elizaos/core";
import { growthAction } from "./actions";

/**
 * Growth Plugin - Custom actions for family development and resilience
 */
export const growthPlugin: Plugin = {
    name: "growth",
    description: "Family growth and resilience plugin",
    actions: [growthAction],
    evaluators: [],
    providers: [],
};

export default growthPlugin;