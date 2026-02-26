import { type Plugin } from "@elizaos/core";
import { savingsAction } from "./actions";

/**
 * Savings Plugin - Integration with Bonzo Finance for family financial growth
 */
export const savingsPlugin: Plugin = {
    name: "savings",
    description: "Family savings and Bonzo Finance integration plugin",
    actions: [savingsAction],
    evaluators: [],
    providers: [],
};

export default savingsPlugin;
