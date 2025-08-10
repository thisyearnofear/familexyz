import type { Plugin } from "@elizaos/core";

// Services
import { GoodDollarService } from "./services/gooddollar.js";
import { IdentityService } from "./services/identity.js";
import { StreamingService } from "./services/streaming.js";

// Actions
import { transferGDollarAction } from "./actions/transfer.js";
import { claimUBIAction } from "./actions/claim.js";
import { verifyFamilyMemberAction } from "./actions/verify.js";
import { familyStatusAction } from "./actions/family-status.js";
import { createStreamAction } from "./actions/stream.js";
import { manageStreamsAction } from "./actions/manage-streams.js";

// Providers
import { gdollarWalletProvider } from "./providers/wallet.js";
import { identityProvider } from "./providers/identity.js";
import { streamingProvider } from "./providers/streaming.js";

// Types
export * from "./types.js";
export * from "./environment.js";

// Services
export { GoodDollarService, IdentityService, StreamingService };

// Actions
export { 
  transferGDollarAction, 
  claimUBIAction, 
  verifyFamilyMemberAction, 
  familyStatusAction, 
  createStreamAction, 
  manageStreamsAction 
};

// Providers
export { gdollarWalletProvider, identityProvider, streamingProvider };

export const gooddollarPlugin: Plugin = {
  name: "gooddollar",
  description: "GoodDollar G$ integration plugin for FamilyXYZ - Complete UBI ecosystem with streaming rewards, identity verification, and family incentives",
  actions: [
    transferGDollarAction, 
    claimUBIAction, 
    verifyFamilyMemberAction, 
    familyStatusAction, 
    createStreamAction, 
    manageStreamsAction
  ],
  evaluators: [],
  providers: [gdollarWalletProvider, identityProvider, streamingProvider],
  services: [GoodDollarService, IdentityService, StreamingService],
};

export default gooddollarPlugin;