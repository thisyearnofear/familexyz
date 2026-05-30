/**
 * Telegram Client for FamilyXYZ
 *
 * Real implementation using grammy framework
 * Implements FamilyMessagingAdapter interface
 */

export {
    TelegramFamilyClient,
    createTelegramClient,
    type TelegramChannelConfig,
} from "./TelegramFamilyClient.js";

export {
    persistentKeyboard,
    agentSelectorKeyboard,
    moodKeyboard,
    checkinFollowUpKeyboard,
    challengeKeyboard,
    challengeCategoryKeyboard,
    onboardingKeyboard,
    bondScoreKeyboard,
    savingsKeyboard,
    helpKeyboard,
    formatBondScore,
    AGENT_PROFILES,
    REPLY_KEYBOARD_ACTIONS,
} from "./keyboards.js";

export {
    type SessionData,
    initialSession,
    handleCheckIn,
    handleBondScore,
    handleAgents,
    handleChallenge,
    handleSavings,
    handleHelp,
    handleMoodSelection,
    handleGratitude,
    handleCheckInComplete,
    handleAgentSelection,
    handleOnboardCallback,
} from "./handlers.js";

export {
    type FamilyMember,
    type Interaction,
    handleFamilyCommand,
    handleFamilyAdd,
    handleFamilyNameInput,
    handleRelationshipSelect,
    handleCadenceSelect,
    handleInteractionLog,
    handleViewMember,
    checkForMemberMention,
    generateNudge,
    getPostCheckinSuggestion,
} from "./relationships.js";

export {
    handleMe,
    handlePrivacy,
    handleExport,
    handleDeleteConfirm,
    handleDeleteFinal,
    handlePrivacyCancel,
    handlePrivacyAccept,
    showPrivacyDisclosureIfNeeded,
} from "./privacy.js";

export {
    getDb,
    ensureUser,
    getUser,
    updateUser,
    deleteUser,
    saveCheckin,
    getCheckins,
    getUserStats,
    exportUserData,
    addFamilyMember,
    getFamilyMembers,
    logInteraction,
} from "./userStore.js";
