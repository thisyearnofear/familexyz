export interface IAttachment {
    url: string;
    contentType: string;
    title: string;
}

// Domain-specific types
export * from './bondScoring';
export * from './family';
export * from './integrations';

// Social types (explicit exports to avoid FamilyMember conflict with family.ts)
export type {
    SocialFamilyMember,
    Comment,
    Achievement,
    FamilyChallenge,
    CreateChallengeData,
    FamilyPost
} from './social';