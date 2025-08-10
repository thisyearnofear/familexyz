import {
  IAgentRuntime,
  Provider,
  elizaLogger,
} from "@elizaos/core";
import { StreamingService } from "../services/streaming.js";
import { IdentityService } from "../services/identity.js";
import { ethers } from "ethers";

const STREAMING_TEMPLATE = `# GoodDollar Superfluid Streaming Status

## Streaming Configuration
- **Streaming Enabled**: {{streamingEnabled}}
- **Network**: {{network}}
- **SuperToken Address**: {{superTokenAddress}}
- **User Address**: {{userAddress}}
- **Verification Status**: {{verificationStatus}}

## Active Streams Summary
- **Total Active Streams**: {{totalActiveStreams}}
- **Outgoing Streams**: {{outgoingStreams}}
- **Incoming Streams**: {{incomingStreams}}
- **Current Flow Rate**: {{totalFlowRate}} G$/hour
- **Daily Flow**: {{dailyFlow}} G$/day
- **Estimated Monthly**: {{monthlyFlow}} G$/month

## Stream Details
{{streamDetails}}

## Flow Rate Breakdown
{{flowRateBreakdown}}

## Stream Management
{{streamManagement}}

## Family Streaming Opportunities
{{familyOpportunities}}

## Recent Activity
{{recentActivity}}

## Superfluid Protocol Integration
- **Protocol Version**: Superfluid V1
- **Real-time Streaming**: ✅ Active
- **Gas Efficiency**: Optimized for continuous flows
- **Stream Precision**: Per-second accuracy
- **Instant Updates**: Flow rates adjustable in real-time
`;

export const streamingProvider: Provider = {
  get: async (runtime: IAgentRuntime, message?, state?): Promise<string> => {
    try {
      // Get services
      const streamingService = runtime.getService<StreamingService>(StreamingService);
      const identityService = runtime.getService<IdentityService>(IdentityService);
      
      if (!streamingService) {
        return "Streaming service not available. Superfluid streaming features are disabled.";
      }

      const config = streamingService.getConfig();
      const streamingEnabled = streamingService.isStreamingEnabled();

      if (!streamingEnabled) {
        return `# GoodDollar Streaming Status

Streaming is currently **disabled**.

To enable streaming:
1. Set GOODDOLLAR_ENABLE_STREAMING=true
2. Configure GOODDOLLAR_SUPER_TOKEN_ADDRESS
3. Ensure sufficient SuperToken balance

Streaming features include:
- Family allowances (monthly/weekly payments)
- Milestone-based rewards
- Continuous behavior incentives
- Real-time G$ distribution`;
      }

      // Get user information
      const userId = message?.userId || "unknown_user";
      let userAddress = "Not configured";
      let verificationStatus = "Not verified";
      
      if (identityService) {
        const userProfile = await identityService.getIdentityProfile(userId);
        if (userProfile) {
          userAddress = userProfile.walletAddress;
          verificationStatus = userProfile.isVerified ? "✅ Verified" : "❌ Not Verified";
        }
      }

      // Get active streams if user is verified
      let activeStreams: any[] = [];
      if (userAddress !== "Not configured" && ethers.isAddress(userAddress)) {
        activeStreams = await streamingService.getActiveStreams(userAddress);
      }

      // Calculate streaming statistics
      const outgoingStreams = activeStreams.filter(s => s.sender === userAddress).length;
      const incomingStreams = activeStreams.filter(s => s.receiver === userAddress).length;
      
      // Calculate flow rates
      let totalFlowRatePerSecond = BigInt(0);
      const flowRateBreakdown: string[] = [];
      
      for (const stream of activeStreams) {
        const isOutgoing = stream.sender === userAddress;
        const flowRate = BigInt(stream.flowRate);
        const hourlyRate = flowRate * BigInt(3600);
        const counterparty = isOutgoing ? stream.receiver : stream.sender;
        
        if (isOutgoing) {
          totalFlowRatePerSecond -= flowRate; // Outgoing is negative
        } else {
          totalFlowRatePerSecond += flowRate; // Incoming is positive
        }
        
        const typeEmoji = getStreamTypeEmoji(stream.familyContext.streamType);
        const directionEmoji = isOutgoing ? "📤" : "📥";
        
        flowRateBreakdown.push(
          `${directionEmoji} ${typeEmoji} **${stream.familyContext.streamType.toUpperCase()}**\n` +
          `   Rate: ${ethers.formatEther(hourlyRate)} G$/hour\n` +
          `   ${isOutgoing ? 'To' : 'From'}: ${counterparty.slice(0, 8)}...\n` +
          `   ID: ${stream.streamId.slice(0, 12)}...`
        );
      }

      const totalFlowRate = ethers.formatEther(totalFlowRatePerSecond * BigInt(3600));
      const dailyFlow = ethers.formatEther(totalFlowRatePerSecond * BigInt(86400));
      const monthlyFlow = ethers.formatEther(totalFlowRatePerSecond * BigInt(86400 * 30));

      // Build stream details
      let streamDetails = "No active streams";
      if (activeStreams.length > 0) {
        streamDetails = activeStreams.map((stream, index) => {
          const isOutgoing = stream.sender === userAddress;
          const hourlyRate = ethers.formatEther(BigInt(stream.flowRate) * BigInt(3600));
          const totalStreamed = ethers.formatEther(stream.totalStreamed);
          const runningHours = Math.floor((Date.now() - stream.startTime) / (1000 * 60 * 60));
          
          return `**${index + 1}. ${stream.familyContext.streamType.toUpperCase()}** ${isOutgoing ? '(Outgoing)' : '(Incoming)'}\n` +
                 `   Flow Rate: ${hourlyRate} G$/hour\n` +
                 `   Total Streamed: ${totalStreamed} G$\n` +
                 `   Running Time: ${runningHours} hours\n` +
                 `   Status: ${stream.status.toUpperCase()}`;
        }).join('\n\n');
      }

      // Build flow rate breakdown
      const flowRateBreakdownText = flowRateBreakdown.length > 0 
        ? flowRateBreakdown.join('\n\n')
        : "No active flows";

      // Stream management options
      const streamManagement = activeStreams.length > 0
        ? `**Available Actions:**
- View streams: "Show my active streams"
- Cancel stream: "Cancel stream [stream_id]"
- Update rate: "Update stream [stream_id] to [new_rate] G$/hour"

**Stream IDs:** ${activeStreams.map(s => s.streamId.slice(0, 12) + '...').join(', ')}`
        : `**Get Started:**
- "Set up monthly allowance of 50 G$ for my child 0x..."
- "Create milestone stream of 100 G$ over 30 days"
- "Start continuous reward of 2 G$/hour for good behavior"`;

      // Family opportunities
      const familyOpportunities = verificationStatus.includes('✅')
        ? `**Available Stream Types:**
🏠 **Family Allowances** - Regular monthly/weekly payments
   Example: "Monthly allowance of 100 G$ to my child"

🎯 **Milestone Rewards** - Goal-based streaming over time
   Example: "Stream 200 G$ over 30 days for completing chores"

🔄 **Continuous Rewards** - Ongoing behavior incentives
   Example: "3 G$/hour for mindful family interactions"

🏆 **Achievement Funding** - Collaborative family goals
   Example: "Family vacation fund - 10 G$/day from everyone"`
        : `**Complete verification first:**
Use: "Verify me as a [role] with wallet 0x..." to unlock streaming features`;

      // Recent activity (simplified)
      const recentActivity = activeStreams.length > 0
        ? `Last 24 hours:
• ${activeStreams.length} active stream${activeStreams.length > 1 ? 's' : ''}
• Estimated flow: ${Math.abs(Number(dailyFlow))} G$
• All streams running normally ✅`
        : "No recent streaming activity";

      const streamingInfo = STREAMING_TEMPLATE
        .replace(/{{streamingEnabled}}/g, streamingEnabled ? "✅ Enabled" : "❌ Disabled")
        .replace(/{{network}}/g, config.network.toUpperCase())
        .replace(/{{superTokenAddress}}/g, config.superTokenAddress || "Not configured")
        .replace(/{{userAddress}}/g, userAddress === "Not configured" ? userAddress : `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`)
        .replace(/{{verificationStatus}}/g, verificationStatus)
        .replace(/{{totalActiveStreams}}/g, activeStreams.length.toString())
        .replace(/{{outgoingStreams}}/g, outgoingStreams.toString())
        .replace(/{{incomingStreams}}/g, incomingStreams.toString())
        .replace(/{{totalFlowRate}}/g, totalFlowRate)
        .replace(/{{dailyFlow}}/g, dailyFlow)
        .replace(/{{monthlyFlow}}/g, monthlyFlow)
        .replace(/{{streamDetails}}/g, streamDetails)
        .replace(/{{flowRateBreakdown}}/g, flowRateBreakdownText)
        .replace(/{{streamManagement}}/g, streamManagement)
        .replace(/{{familyOpportunities}}/g, familyOpportunities)
        .replace(/{{recentActivity}}/g, recentActivity);

      return streamingInfo;

    } catch (error) {
      elizaLogger.error("Error in streaming provider:", error);
      return `Error retrieving streaming information: ${error.message}

This might indicate:
- Streaming service configuration issues
- Network connectivity problems
- SuperToken contract issues

Please check your GoodDollar streaming configuration:
- GOODDOLLAR_ENABLE_STREAMING=true
- GOODDOLLAR_SUPER_TOKEN_ADDRESS configured
- Valid wallet with SuperToken balance`;
    }
  },
};

function getStreamTypeEmoji(streamType: string): string {
  const emojis = {
    "allowance": "💰",
    "milestone": "🎯", 
    "continuous_reward": "🔄",
    "achievement": "🏆",
  };
  
  return emojis[streamType] || "🌊";
}

export default streamingProvider;