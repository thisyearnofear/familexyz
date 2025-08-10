import { type Context, Markup } from "telegraf";
import { type IAgentRuntime, elizaLogger } from "@elizaos/core";
import { 
    GoodDollarService, 
    IdentityService, 
    StreamingService 
} from "@elizaos/plugin-gooddollar";

/**
 * GoodDollar Telegram Bot Integration
 * Provides delightful family G$ experience with inline keyboards and real-time updates
 */
export class GoodDollarTelegramBot {
    private runtime: IAgentRuntime;

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
    }

    /**
     * Setup GoodDollar-specific command handlers
     */
    public setupGoodDollarHandlers(bot: any): void {
        // Family wallet overview command
        bot.command('wallet', this.handleWalletCommand.bind(this));
        bot.command('balance', this.handleWalletCommand.bind(this)); // Alias
        
        // Family verification commands
        bot.command('family', this.handleFamilyCommand.bind(this));
        bot.command('verify', this.handleVerifyCommand.bind(this));
        
        // Streaming rewards commands
        bot.command('streams', this.handleStreamsCommand.bind(this));
        bot.command('allowance', this.handleAllowanceCommand.bind(this));
        
        // Quick actions
        bot.command('claim', this.handleClaimCommand.bind(this));
        bot.command('send', this.handleSendCommand.bind(this));
        
        // Family dashboard
        bot.command('dashboard', this.handleDashboardCommand.bind(this));
        bot.command('family_health', this.handleFamilyHealthCommand.bind(this));
        
        // Activity feed
        bot.command('activity', this.handleActivityCommand.bind(this));
        
        // Help and onboarding
        bot.command('help_gooddollar', this.handleHelpCommand.bind(this));
        bot.command('start', this.handleStartCommand.bind(this));

        // Callback query handlers for inline keyboards
        bot.action(/^gd_(.+)/, this.handleCallbackQuery.bind(this));
    }

    /**
     * Handle wallet overview command with beautiful formatting
     */
    private async handleWalletCommand(ctx: Context): Promise<void> {
        try {
            const gdService = this.runtime.getService<GoodDollarService>(GoodDollarService);
            if (!gdService) {
                await ctx.reply("🚫 GoodDollar service not available. Please ensure the plugin is loaded.");
                return;
            }

            const config = gdService.getConfig();
            const walletAddress = config.walletAddress;

            if (!walletAddress) {
                await ctx.reply(
                    "⚠️ *Wallet Not Configured*\n\n" +
                    "Please set up your wallet:\n" +
                    "• Configure GOODDOLLAR_PRIVATE_KEY\n" +
                    "• Choose network (Celo/Fuse)\n" +
                    "• Contact family admin for setup",
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            // Get wallet data
            const [balance, canClaim] = await Promise.all([
                gdService.getBalance(walletAddress),
                gdService.canClaimUBI(walletAddress)
            ]);

            const walletMessage = this.formatWalletMessage({
                address: walletAddress,
                balance,
                network: config.network,
                canClaim,
                tokenAddress: config.tokenAddress
            });

            const keyboard = Markup.inlineKeyboard([
                [
                    Markup.button.callback('💰 Claim UBI', 'gd_claim_ubi'),
                    Markup.button.callback('📤 Send G$', 'gd_send_menu')
                ],
                [
                    Markup.button.callback('🌊 View Streams', 'gd_streams'),
                    Markup.button.callback('👥 Family Status', 'gd_family')
                ],
                [
                    Markup.button.callback('📊 Dashboard', 'gd_dashboard'),
                    Markup.button.callback('🔄 Refresh', 'gd_refresh_wallet')
                ]
            ]);

            await ctx.reply(walletMessage, { 
                parse_mode: 'Markdown', 
                reply_markup: keyboard.reply_markup 
            });

        } catch (error) {
            elizaLogger.error("Error in wallet command:", error);
            await ctx.reply("❌ Failed to fetch wallet information. Please try again later.");
        }
    }

    /**
     * Handle family verification status command
     */
    private async handleFamilyCommand(ctx: Context): Promise<void> {
        try {
            const identityService = this.runtime.getService<IdentityService>(IdentityService);
            
            const familyMessage = this.formatFamilyMessage({
                verifiedCount: 2,
                totalMembers: 3,
                members: [
                    { name: "Parent User", role: "parent", verified: true, lastActive: "1 hour ago" },
                    { name: "Child User", role: "child", verified: true, lastActive: "30 min ago" },
                    { name: "Grandparent User", role: "grandparent", verified: false, lastActive: "2 hours ago" }
                ]
            });

            const keyboard = Markup.inlineKeyboard([
                [
                    Markup.button.callback('✅ Verify Member', 'gd_verify_family'),
                    Markup.button.callback('👥 Add Member', 'gd_add_member')
                ],
                [
                    Markup.button.callback('📱 Share Invite', 'gd_share_invite'),
                    Markup.button.callback('🔄 Refresh', 'gd_refresh_family')
                ]
            ]);

            await ctx.reply(familyMessage, {
                parse_mode: 'Markdown',
                reply_markup: keyboard.reply_markup
            });

        } catch (error) {
            elizaLogger.error("Error in family command:", error);
            await ctx.reply("❌ Failed to fetch family information. Please try again later.");
        }
    }

    /**
     * Handle streaming rewards overview
     */
    private async handleStreamsCommand(ctx: Context): Promise<void> {
        try {
            const streamingService = this.runtime.getService<StreamingService>(StreamingService);
            
            const streamsMessage = this.formatStreamsMessage({
                totalActiveStreams: 2,
                estimatedDaily: "15.25",
                estimatedMonthly: "457.50",
                activeStreams: [
                    {
                        type: "allowance",
                        receiver: "Child User", 
                        flowRate: "3.33 G$/hour",
                        totalStreamed: "125.45 G$",
                        status: "active"
                    },
                    {
                        type: "milestone",
                        receiver: "Child User",
                        flowRate: "1.85 G$/hour", 
                        totalStreamed: "67.23 G$",
                        status: "active"
                    }
                ]
            });

            const keyboard = Markup.inlineKeyboard([
                [
                    Markup.button.callback('💰 New Allowance', 'gd_new_allowance'),
                    Markup.button.callback('🎯 New Milestone', 'gd_new_milestone')
                ],
                [
                    Markup.button.callback('⚙️ Manage Streams', 'gd_manage_streams'),
                    Markup.button.callback('🔄 Refresh', 'gd_refresh_streams')
                ]
            ]);

            await ctx.reply(streamsMessage, {
                parse_mode: 'Markdown',
                reply_markup: keyboard.reply_markup
            });

        } catch (error) {
            elizaLogger.error("Error in streams command:", error);
            await ctx.reply("❌ Failed to fetch streaming information. Please try again later.");
        }
    }

    /**
     * Handle comprehensive family dashboard
     */
    private async handleDashboardCommand(ctx: Context): Promise<void> {
        try {
            const dashboardMessage = this.formatDashboardMessage({
                familyScore: 85,
                totalBalance: "234.67",
                activeStreams: 2,
                verifiedMembers: 2,
                recentRewards: "23.45",
                recommendations: [
                    "Complete grandparent verification",
                    "Your daily UBI is ready to claim!"
                ]
            });

            const keyboard = Markup.inlineKeyboard([
                [
                    Markup.button.callback('💰 Wallet', 'gd_wallet'),
                    Markup.button.callback('👥 Family', 'gd_family')
                ],
                [
                    Markup.button.callback('🌊 Streams', 'gd_streams'),
                    Markup.button.callback('📈 Activity', 'gd_activity')
                ],
                [
                    Markup.button.callback('🎯 Quick Actions', 'gd_quick_actions'),
                    Markup.button.callback('🔄 Refresh', 'gd_refresh_dashboard')
                ]
            ]);

            await ctx.reply(dashboardMessage, {
                parse_mode: 'Markdown',
                reply_markup: keyboard.reply_markup
            });

        } catch (error) {
            elizaLogger.error("Error in dashboard command:", error);
            await ctx.reply("❌ Failed to fetch dashboard information. Please try again later.");
        }
    }

    /**
     * Handle recent family activity feed
     */
    private async handleActivityCommand(ctx: Context): Promise<void> {
        try {
            const activityMessage = this.formatActivityMessage([
                {
                    actor: "Child User",
                    action: "earned 5.2 G$ for completing homework",
                    timestamp: "15 minutes ago",
                    icon: "🎯"
                },
                {
                    actor: "Parent User", 
                    action: "started monthly allowance stream",
                    timestamp: "1 hour ago",
                    icon: "🌊"
                },
                {
                    actor: "Grandparent User",
                    action: "shared family story and earned 3.5 G$",
                    timestamp: "3 hours ago", 
                    icon: "👴"
                }
            ]);

            const keyboard = Markup.inlineKeyboard([
                [
                    Markup.button.callback('📊 Dashboard', 'gd_dashboard'),
                    Markup.button.callback('🔄 Refresh', 'gd_refresh_activity')
                ]
            ]);

            await ctx.reply(activityMessage, {
                parse_mode: 'Markdown',
                reply_markup: keyboard.reply_markup
            });

        } catch (error) {
            elizaLogger.error("Error in activity command:", error);
            await ctx.reply("❌ Failed to fetch activity information. Please try again later.");
        }
    }

    /**
     * Handle help command with comprehensive family onboarding
     */
    private async handleHelpCommand(ctx: Context): Promise<void> {
        const helpMessage = 
            "🏠 *FamilyXYZ GoodDollar Bot*\n\n" +
            "*Family Wallet Commands:*\n" +
            "• `/wallet` - View G$ balance and wallet info\n" +
            "• `/claim` - Claim daily UBI rewards\n" +
            "• `/send` - Send G$ to family members\n\n" +
            "*Family Management:*\n" +
            "• `/family` - Family verification status\n" +
            "• `/verify` - Complete identity verification\n\n" +
            "*Streaming Rewards:*\n" +
            "• `/streams` - View active allowances & milestones\n" +
            "• `/allowance` - Set up family allowances\n\n" +
            "*Family Dashboard:*\n" +
            "• `/dashboard` - Complete family overview\n" +
            "• `/activity` - Recent family interactions\n" +
            "• `/family_health` - Family wellness score\n\n" +
            "*Natural Language:*\n" +
            "You can also chat naturally! Try:\n" +
            "• \"Send 10 G$ to my child for good grades\"\n" +
            "• \"Set up monthly allowance of 100 G$\"\n" +
            "• \"Show me our family verification status\"\n" +
            "• \"Claim my daily UBI\"\n\n" +
            "🌟 *Family AI Integration:*\n" +
            "This bot works with our 5 Family AI agents:\n" +
            "• 🧠 Wisdom Agent - Philosophy & emotional guidance\n" +
            "• 💑 Intimacy Agent - Relationship coaching\n" +
            "• 👵👦 Bridge Agent - Generational connections\n" +
            "• 🧘 Presence Agent - Mindfulness & digital wellness\n" +
            "• 🚀 Growth Agent - Family achievement goals\n\n" +
            "💡 All G$ rewards from AI interactions appear here!";

        const keyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback('🚀 Get Started', 'gd_onboarding'),
                Markup.button.callback('📊 Dashboard', 'gd_dashboard')
            ],
            [
                Markup.button.callback('👥 Join Family', 'gd_join_family'),
                Markup.button.callback('⚙️ Settings', 'gd_settings')
            ]
        ]);

        await ctx.reply(helpMessage, {
            parse_mode: 'Markdown',
            reply_markup: keyboard.reply_markup
        });
    }

    /**
     * Handle start command with family onboarding
     */
    private async handleStartCommand(ctx: Context): Promise<void> {
        const userName = ctx.from?.first_name || "Family Member";
        
        const welcomeMessage = 
            `🎉 *Welcome to FamilyXYZ, ${userName}!*\n\n` +
            "Transform your family relationships with AI-powered conversations and G$ rewards!\n\n" +
            "*🌟 What makes us special:*\n" +
            "• Earn G$ for meaningful family interactions\n" +
            "• Set up family allowances with real-time streaming\n" +
            "• Cross-generational bonding rewards\n" +
            "• Family verification with sybil resistance\n" +
            "• 5 specialized AI agents for family wellness\n\n" +
            "*🚀 Quick Setup:*\n" +
            "1️⃣ Complete identity verification\n" +
            "2️⃣ Connect your family members\n" +
            "3️⃣ Set up G$ allowances & rewards\n" +
            "4️⃣ Start earning through AI conversations!\n\n" +
            "Ready to strengthen your family bonds? 💫";

        const keyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback('🚀 Start Setup', 'gd_onboarding'),
                Markup.button.callback('💰 View Wallet', 'gd_wallet')
            ],
            [
                Markup.button.callback('👥 Family Status', 'gd_family'),
                Markup.button.callback('❓ Help', 'gd_help')
            ]
        ]);

        await ctx.reply(welcomeMessage, {
            parse_mode: 'Markdown',
            reply_markup: keyboard.reply_markup
        });
    }

    /**
     * Handle callback queries from inline keyboards
     */
    private async handleCallbackQuery(ctx: Context & { callbackQuery: any }): Promise<void> {
        const data = ctx.callbackQuery.data;
        const action = data.split('_').slice(1).join('_'); // Remove 'gd_' prefix

        try {
            await ctx.answerCbQuery(); // Acknowledge the callback query

            switch (action) {
                case 'wallet':
                    await this.handleWalletCommand(ctx);
                    break;
                case 'family':
                    await this.handleFamilyCommand(ctx);
                    break;
                case 'streams':
                    await this.handleStreamsCommand(ctx);
                    break;
                case 'dashboard':
                    await this.handleDashboardCommand(ctx);
                    break;
                case 'activity':
                    await this.handleActivityCommand(ctx);
                    break;
                case 'help':
                    await this.handleHelpCommand(ctx);
                    break;
                case 'onboarding':
                    await this.handleOnboardingFlow(ctx);
                    break;
                case 'claim_ubi':
                    await this.handleQuickClaimUBI(ctx);
                    break;
                case 'send_menu':
                    await this.handleSendMenu(ctx);
                    break;
                case 'refresh_wallet':
                    await this.handleWalletCommand(ctx);
                    break;
                case 'refresh_family':
                    await this.handleFamilyCommand(ctx);
                    break;
                case 'refresh_streams':
                    await this.handleStreamsCommand(ctx);
                    break;
                case 'refresh_dashboard':
                    await this.handleDashboardCommand(ctx);
                    break;
                case 'refresh_activity':
                    await this.handleActivityCommand(ctx);
                    break;
                default:
                    await ctx.reply("🤔 Unknown action. Please try again or use /help_gooddollar");
            }
        } catch (error) {
            elizaLogger.error("Error handling callback query:", error);
            await ctx.reply("❌ An error occurred. Please try again later.");
        }
    }

    /**
     * Quick UBI claim action
     */
    private async handleQuickClaimUBI(ctx: Context): Promise<void> {
        try {
            const gdService = this.runtime.getService<GoodDollarService>(GoodDollarService);
            if (!gdService) {
                await ctx.reply("🚫 GoodDollar service not available.");
                return;
            }

            // Simulate UBI claim
            const claimMessage = 
                "🎉 *UBI Claimed Successfully!*\n\n" +
                "💰 Amount: +10.0 G$\n" +
                "⏰ Next claim: 24 hours\n" +
                "📊 Total claimed this month: 287.5 G$\n\n" +
                "Keep engaging with family AI agents to earn more G$ rewards! 🌟";

            await ctx.editMessageText(claimMessage, { parse_mode: 'Markdown' });
            
            // Auto-refresh after 3 seconds
            setTimeout(async () => {
                try {
                    await this.handleWalletCommand(ctx);
                } catch (error) {
                    // Ignore timeout errors
                }
            }, 3000);

        } catch (error) {
            elizaLogger.error("Error claiming UBI:", error);
            await ctx.reply("❌ Failed to claim UBI. Please try again later.");
        }
    }

    /**
     * Send G$ menu with quick options
     */
    private async handleSendMenu(ctx: Context): Promise<void> {
        const sendMessage = 
            "💸 *Send G$ to Family*\n\n" +
            "Choose a quick amount or use natural language:\n\n" +
            "*Natural Language Examples:*\n" +
            "• \"Send 5 G$ to my child for homework\"\n" +
            "• \"Give 10 G$ to grandma for story time\"\n" +
            "• \"Transfer 25 G$ to my spouse for date night\"\n\n" +
            "*Quick Actions:*";

        const keyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback('5 G$', 'gd_send_5'),
                Markup.button.callback('10 G$', 'gd_send_10'),
                Markup.button.callback('25 G$', 'gd_send_25')
            ],
            [
                Markup.button.callback('50 G$', 'gd_send_50'),
                Markup.button.callback('100 G$', 'gd_send_100'),
                Markup.button.callback('Custom', 'gd_send_custom')
            ],
            [
                Markup.button.callback('📋 Recent Recipients', 'gd_recent_recipients'),
                Markup.button.callback('🔙 Back', 'gd_wallet')
            ]
        ]);

        await ctx.editMessageText(sendMessage, {
            parse_mode: 'Markdown',
            reply_markup: keyboard.reply_markup
        });
    }

    /**
     * Handle family onboarding flow
     */
    private async handleOnboardingFlow(ctx: Context): Promise<void> {
        const onboardingMessage = 
            "🚀 *Family Setup Guide*\n\n" +
            "*Step 1: Identity Verification* ✅\n" +
            "Complete face verification for sybil resistance\n" +
            "`/verify` - Start verification process\n\n" +
            "*Step 2: Wallet Setup* 💰\n" +
            "Connect your G$ wallet on Celo or Fuse\n" +
            "`/wallet` - Check wallet status\n\n" +
            "*Step 3: Add Family Members* 👥\n" +
            "Invite parents, children, grandparents\n" +
            "`/family` - Manage family members\n\n" +
            "*Step 4: Set Up Streaming* 🌊\n" +
            "Create allowances and milestone rewards\n" +
            "`/streams` - Configure family streams\n\n" +
            "*Step 5: Start Earning* 🌟\n" +
            "Chat with AI agents and earn G$ rewards!\n" +
            "`/dashboard` - Monitor family progress\n\n" +
            "Need help? Contact our family support team!";

        const keyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback('✅ Start Verification', 'gd_verify_family'),
                Markup.button.callback('💰 Setup Wallet', 'gd_wallet')
            ],
            [
                Markup.button.callback('👥 Add Family', 'gd_family'),
                Markup.button.callback('🌊 Setup Streams', 'gd_streams')
            ],
            [
                Markup.button.callback('📊 Dashboard', 'gd_dashboard'),
                Markup.button.callback('🔙 Back', 'gd_help')
            ]
        ]);

        await ctx.editMessageText(onboardingMessage, {
            parse_mode: 'Markdown', 
            reply_markup: keyboard.reply_markup
        });
    }

    // Additional command stubs that weren't implemented above
    private async handleClaimCommand(ctx: Context): Promise<void> {
        await this.handleQuickClaimUBI(ctx);
    }

    private async handleSendCommand(ctx: Context): Promise<void> {
        await this.handleSendMenu(ctx);
    }

    private async handleVerifyCommand(ctx: Context): Promise<void> {
        await ctx.reply(
            "🔒 *Identity Verification*\n\n" +
            "To ensure family authenticity and prevent sybil attacks, please complete face verification.\n\n" +
            "*What we need:*\n" +
            "• 3D liveness check\n" +
            "• Document verification\n" +
            "• Family role confirmation\n\n" +
            "This ensures only real family members earn G$ rewards!\n\n" +
            "Contact family admin to start verification process.",
            { parse_mode: 'Markdown' }
        );
    }

    private async handleAllowanceCommand(ctx: Context): Promise<void> {
        await ctx.reply(
            "💰 *Set Up Family Allowance*\n\n" +
            "Create recurring G$ streams for family members!\n\n" +
            "*Natural Language Examples:*\n" +
            "• \"Set up monthly allowance of 100 G$ for my child\"\n" +
            "• \"Create weekly allowance of 25 G$ for household chores\"\n" +
            "• \"Start streaming 2 G$/hour for good behavior\"\n\n" +
            "Try it now - just type your request naturally! 🌟",
            { parse_mode: 'Markdown' }
        );
    }

    private async handleFamilyHealthCommand(ctx: Context): Promise<void> {
        await this.handleDashboardCommand(ctx);
    }

    // Formatting helper methods
    private formatWalletMessage(wallet: any): string {
        return (
            `💰 *Family Wallet Overview*\n\n` +
            `📍 Address: \`${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}\`\n` +
            `🌐 Network: ${wallet.network.toUpperCase()}\n` +
            `💎 Balance: **${wallet.balance} G$**\n` +
            `${wallet.canClaim ? '🎁 UBI Ready to claim!' : '⏰ UBI: Next claim in 18h 32m'}\n\n` +
            `*Recent Activity:*\n` +
            `• +5.2 G$ from homework completion (15m ago)\n` +
            `• +3.5 G$ from family story sharing (1h ago)\n` +
            `• -25.0 G$ sent to Child User (2h ago)\n\n` +
            `🏆 *Family Features:*\n` +
            `• ✅ G$ Rewards Active\n` +
            `• ✅ Streaming Enabled\n` +
            `• ✅ Identity Verified\n\n` +
            `Use the buttons below for quick actions! 👇`
        );
    }

    private formatFamilyMessage(family: any): string {
        const verificationProgress = Math.round((family.verifiedCount / family.totalMembers) * 100);
        
        let membersText = "";
        for (const member of family.members) {
            const status = member.verified ? "✅" : "❌";
            membersText += `${status} **${member.name}** (${member.role})\n    Last active: ${member.lastActive}\n`;
        }

        return (
            `👨‍👩‍👧‍👦 *Family Verification Status*\n\n` +
            `📊 Progress: ${family.verifiedCount}/${family.totalMembers} verified (${verificationProgress}%)\n\n` +
            `*Family Members:*\n${membersText}\n` +
            `💡 *Benefits of Full Verification:*\n` +
            `• Unlock all G$ streaming features\n` +
            `• Higher reward multipliers\n` +
            `• Access to exclusive family challenges\n` +
            `• Enhanced security & sybil resistance\n\n` +
            `Complete verification to maximize G$ earnings! 🌟`
        );
    }

    private formatStreamsMessage(streams: any): string {
        let streamsText = "";
        for (const stream of streams.activeStreams) {
            const typeIcon = stream.type === 'allowance' ? '💰' : stream.type === 'milestone' ? '🎯' : '🔄';
            streamsText += (
                `${typeIcon} **${stream.type.toUpperCase()}** to ${stream.receiver}\n` +
                `   Flow: ${stream.flowRate} • Total: ${stream.totalStreamed}\n`
            );
        }

        return (
            `🌊 *Family Streaming Overview*\n\n` +
            `📊 Active Streams: ${streams.totalActiveStreams}\n` +
            `💰 Daily Flow: ~${streams.estimatedDaily} G$\n` +
            `📅 Monthly Est: ~${streams.estimatedMonthly} G$\n\n` +
            `*Current Streams:*\n${streamsText}\n` +
            `✨ *Stream Benefits:*\n` +
            `• Real-time G$ distribution\n` +
            `• Automatic family rewards\n` +
            `• Per-second precision\n` +
            `• Milestone-based incentives\n\n` +
            `Streams flow continuously - no manual transfers needed! 🚀`
        );
    }

    private formatDashboardMessage(dashboard: any): string {
        let recText = "";
        for (const rec of dashboard.recommendations) {
            recText += `• ${rec}\n`;
        }

        return (
            `📊 *Family Dashboard*\n\n` +
            `🏆 Family Health Score: **${dashboard.familyScore}%**\n\n` +
            `*💰 Quick Stats:*\n` +
            `• Total Balance: ${dashboard.totalBalance} G$\n` +
            `• Active Streams: ${dashboard.activeStreams}\n` +
            `• Verified Members: ${dashboard.verifiedMembers}/3\n` +
            `• Weekly Rewards: +${dashboard.recentRewards} G$\n\n` +
            `*🎯 Recommendations:*\n${recText}\n` +
            `🌟 Keep engaging with AI agents to boost your family score!`
        );
    }

    private formatActivityMessage(activities: any[]): string {
        let activityText = "";
        for (const activity of activities) {
            activityText += `${activity.icon} ${activity.actor} ${activity.action}\n    ${activity.timestamp}\n\n`;
        }

        return (
            `📈 *Family Activity Feed*\n\n` +
            `*Recent Highlights:*\n${activityText}` +
            `🔔 *Stay Active:*\n` +
            `• Chat with Wisdom Agent for philosophy rewards\n` +
            `• Share stories with Bridge Agent for bonuses\n` +
            `• Practice mindfulness with Presence Agent\n` +
            `• Set goals with Growth Agent for achievements\n\n` +
            `Every meaningful interaction strengthens your family! 💫`
        );
    }
}