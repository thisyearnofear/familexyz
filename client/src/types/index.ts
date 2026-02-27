export interface IAttachment {
    url: string;
    contentType: string;
    title: string;
}

// Domain-specific types
export * from './bondScoring';
export * from './family';
export * from './social';
export * from './integrations';

// Re-export for convenience
export type {
    FamilyMember as SocialFamilyMember,
    Comment,
    Achievement,
    FamilyChallenge,
    CreateChallengeData,
    FamilyPost
} from './social';