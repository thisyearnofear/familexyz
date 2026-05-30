/**
 * User Store — SQLite-backed persistence for Telegram user data.
 *
 * Telegram user ID is the auth key (cryptographically verified by Telegram).
 * All user data (profile, check-ins, family members, interactions) lives here.
 */

import Database from "better-sqlite3";
import path from "node:path";
import { elizaLogger } from "@elizaos/core";
import type { FamilyMember, Interaction } from "./relationships.js";

let db: Database.Database | null = null;

function getDbPath(): string {
    return process.env.SQLITE_FILE
        ?? path.resolve(process.cwd(), "data", "db.sqlite");
}

export function getDb(): Database.Database {
    if (!db) {
        const dbPath = getDbPath();
        elizaLogger.info(`[UserStore] Opening database: ${dbPath}`);
        db = new Database(dbPath);
        db.pragma("journal_mode = WAL");
        runMigrations(db);
    }
    return db;
}

function runMigrations(database: Database.Database): void {
    database.exec(`
        CREATE TABLE IF NOT EXISTS telegram_users (
            telegram_id TEXT PRIMARY KEY,
            username TEXT,
            first_name TEXT,
            joined_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
            last_seen_at INTEGER,
            onboarding_complete INTEGER NOT NULL DEFAULT 0,
            preferred_agent TEXT,
            checkin_streak INTEGER NOT NULL DEFAULT 0,
            last_checkin_at INTEGER,
            nudge_paused INTEGER NOT NULL DEFAULT 0,
            privacy_accepted INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS checkins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id TEXT NOT NULL,
            mood TEXT,
            gratitude TEXT,
            story TEXT,
            created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
            FOREIGN KEY (telegram_id) REFERENCES telegram_users(telegram_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS family_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id TEXT NOT NULL,
            name TEXT NOT NULL,
            relationship TEXT NOT NULL,
            cadence_goal TEXT DEFAULT 'no_goal',
            added_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
            opted_in INTEGER NOT NULL DEFAULT 1,
            nudges_enabled INTEGER NOT NULL DEFAULT 0,
            mention_count INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (telegram_id) REFERENCES telegram_users(telegram_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS family_interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            note TEXT,
            created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
            FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS mention_counts (
            telegram_id TEXT NOT NULL,
            word TEXT NOT NULL,
            count INTEGER NOT NULL DEFAULT 0,
            dismissed INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (telegram_id, word),
            FOREIGN KEY (telegram_id) REFERENCES telegram_users(telegram_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_checkins_user ON checkins(telegram_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(telegram_id);
        CREATE INDEX IF NOT EXISTS idx_interactions_member ON family_interactions(member_id, created_at);
    `);
    elizaLogger.info("[UserStore] Migrations complete");
}

// --- User CRUD ---

export interface UserRecord {
    telegram_id: string;
    username: string | null;
    first_name: string | null;
    joined_at: number;
    last_seen_at: number | null;
    onboarding_complete: number;
    preferred_agent: string | null;
    checkin_streak: number;
    last_checkin_at: number | null;
    nudge_paused: number;
    privacy_accepted: number;
}

export function ensureUser(telegramId: string, username?: string, firstName?: string): UserRecord {
    const database = getDb();
    const existing = database.prepare("SELECT * FROM telegram_users WHERE telegram_id = ?").get(telegramId) as UserRecord | undefined;

    if (existing) {
        database.prepare(
            "UPDATE telegram_users SET last_seen_at = ?, username = COALESCE(?, username), first_name = COALESCE(?, first_name) WHERE telegram_id = ?"
        ).run(Date.now(), username || null, firstName || null, telegramId);
        return { ...existing, last_seen_at: Date.now() };
    }

    database.prepare(
        "INSERT INTO telegram_users (telegram_id, username, first_name, joined_at, last_seen_at) VALUES (?, ?, ?, ?, ?)"
    ).run(telegramId, username || null, firstName || null, Date.now(), Date.now());

    return database.prepare("SELECT * FROM telegram_users WHERE telegram_id = ?").get(telegramId) as UserRecord;
}

export function getUser(telegramId: string): UserRecord | null {
    const database = getDb();
    return (database.prepare("SELECT * FROM telegram_users WHERE telegram_id = ?").get(telegramId) as UserRecord) || null;
}

export function updateUser(telegramId: string, fields: Partial<Omit<UserRecord, "telegram_id">>): void {
    const database = getDb();
    const sets: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(fields)) {
        sets.push(`${key} = ?`);
        values.push(value);
    }

    if (sets.length === 0) return;
    values.push(telegramId);
    database.prepare(`UPDATE telegram_users SET ${sets.join(", ")} WHERE telegram_id = ?`).run(...values);
}

export function deleteUser(telegramId: string): void {
    const database = getDb();
    database.prepare("DELETE FROM telegram_users WHERE telegram_id = ?").run(telegramId);
}

// --- Check-ins ---

export interface CheckinRecord {
    id: number;
    telegram_id: string;
    mood: string | null;
    gratitude: string | null;
    story: string | null;
    created_at: number;
}

export function saveCheckin(telegramId: string, mood: string, gratitude?: string, story?: string): void {
    const database = getDb();
    database.prepare(
        "INSERT INTO checkins (telegram_id, mood, gratitude, story, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(telegramId, mood, gratitude || null, story || null, Date.now());

    // Update streak
    const user = getUser(telegramId);
    if (!user) return;

    const today = new Date().toDateString();
    const lastDay = user.last_checkin_at ? new Date(user.last_checkin_at).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let newStreak = user.checkin_streak;
    if (lastDay === yesterday) {
        newStreak += 1;
    } else if (lastDay !== today) {
        newStreak = 1;
    }

    updateUser(telegramId, { checkin_streak: newStreak, last_checkin_at: Date.now() });
}

export function getCheckins(telegramId: string, limit = 30): CheckinRecord[] {
    const database = getDb();
    return database.prepare(
        "SELECT * FROM checkins WHERE telegram_id = ? ORDER BY created_at DESC LIMIT ?"
    ).all(telegramId, limit) as CheckinRecord[];
}

export function getCheckinCount(telegramId: string): number {
    const database = getDb();
    const row = database.prepare("SELECT COUNT(*) as count FROM checkins WHERE telegram_id = ?").get(telegramId) as { count: number };
    return row.count;
}

// --- Family Members ---

export interface FamilyMemberRecord {
    id: number;
    telegram_id: string;
    name: string;
    relationship: string;
    cadence_goal: string;
    added_at: number;
    opted_in: number;
    nudges_enabled: number;
    mention_count: number;
}

export function addFamilyMember(telegramId: string, name: string, relationship: string): FamilyMemberRecord {
    const database = getDb();
    database.prepare(
        "INSERT INTO family_members (telegram_id, name, relationship, added_at) VALUES (?, ?, ?, ?)"
    ).run(telegramId, name, relationship, Date.now());

    return database.prepare(
        "SELECT * FROM family_members WHERE telegram_id = ? AND name = ? ORDER BY id DESC LIMIT 1"
    ).get(telegramId, name) as FamilyMemberRecord;
}

export function getFamilyMembers(telegramId: string): FamilyMemberRecord[] {
    const database = getDb();
    return database.prepare(
        "SELECT * FROM family_members WHERE telegram_id = ? ORDER BY added_at"
    ).all(telegramId) as FamilyMemberRecord[];
}

export function updateFamilyMember(memberId: number, fields: Partial<Omit<FamilyMemberRecord, "id" | "telegram_id">>): void {
    const database = getDb();
    const sets: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(fields)) {
        sets.push(`${key} = ?`);
        values.push(value);
    }

    if (sets.length === 0) return;
    values.push(memberId);
    database.prepare(`UPDATE family_members SET ${sets.join(", ")} WHERE id = ?`).run(...values);
}

export function findFamilyMember(telegramId: string, name: string): FamilyMemberRecord | null {
    const database = getDb();
    return (database.prepare(
        "SELECT * FROM family_members WHERE telegram_id = ? AND LOWER(name) = LOWER(?)"
    ).get(telegramId, name) as FamilyMemberRecord) || null;
}

// --- Interactions ---

export interface InteractionRecord {
    id: number;
    member_id: number;
    type: string;
    note: string | null;
    created_at: number;
}

export function logInteraction(memberId: number, type: string, note?: string): void {
    const database = getDb();
    database.prepare(
        "INSERT INTO family_interactions (member_id, type, note, created_at) VALUES (?, ?, ?, ?)"
    ).run(memberId, type, note || null, Date.now());
}

export function getInteractions(memberId: number, limit = 20): InteractionRecord[] {
    const database = getDb();
    return database.prepare(
        "SELECT * FROM family_interactions WHERE member_id = ? ORDER BY created_at DESC LIMIT ?"
    ).all(memberId, limit) as InteractionRecord[];
}

export function getInteractionCount(memberId: number): number {
    const database = getDb();
    const row = database.prepare("SELECT COUNT(*) as count FROM family_interactions WHERE member_id = ?").get(memberId) as { count: number };
    return row.count;
}

export function getRecentInteractionCount(memberId: number, daysBack = 30): number {
    const database = getDb();
    const since = Date.now() - (daysBack * 86400000);
    const row = database.prepare(
        "SELECT COUNT(*) as count FROM family_interactions WHERE member_id = ? AND created_at > ?"
    ).get(memberId, since) as { count: number };
    return row.count;
}

export function getLastInteraction(memberId: number): InteractionRecord | null {
    const database = getDb();
    return (database.prepare(
        "SELECT * FROM family_interactions WHERE member_id = ? ORDER BY created_at DESC LIMIT 1"
    ).get(memberId) as InteractionRecord) || null;
}

// --- Mention tracking ---

export function incrementMention(telegramId: string, word: string): number {
    const database = getDb();
    database.prepare(
        "INSERT INTO mention_counts (telegram_id, word, count) VALUES (?, ?, 1) ON CONFLICT(telegram_id, word) DO UPDATE SET count = count + 1"
    ).run(telegramId, word);

    const row = database.prepare(
        "SELECT count FROM mention_counts WHERE telegram_id = ? AND word = ?"
    ).get(telegramId, word) as { count: number };
    return row.count;
}

export function isMentionDismissed(telegramId: string, word: string): boolean {
    const database = getDb();
    const row = database.prepare(
        "SELECT dismissed FROM mention_counts WHERE telegram_id = ? AND word = ?"
    ).get(telegramId, word) as { dismissed: number } | undefined;
    return row?.dismissed === 1;
}

export function dismissMention(telegramId: string, word: string): void {
    const database = getDb();
    database.prepare(
        "UPDATE mention_counts SET dismissed = 1 WHERE telegram_id = ? AND word = ?"
    ).run(telegramId, word);
}

// --- Export all data for a user ---

export interface UserDataExport {
    user: UserRecord;
    checkins: CheckinRecord[];
    familyMembers: Array<FamilyMemberRecord & { interactions: InteractionRecord[] }>;
    mentionCounts: Array<{ word: string; count: number }>;
}

export function exportUserData(telegramId: string): UserDataExport | null {
    const user = getUser(telegramId);
    if (!user) return null;

    const checkins = getCheckins(telegramId, 1000);
    const members = getFamilyMembers(telegramId);
    const membersWithInteractions = members.map(m => ({
        ...m,
        interactions: getInteractions(m.id, 1000),
    }));

    const database = getDb();
    const mentions = database.prepare(
        "SELECT word, count FROM mention_counts WHERE telegram_id = ?"
    ).all(telegramId) as Array<{ word: string; count: number }>;

    return {
        user,
        checkins,
        familyMembers: membersWithInteractions,
        mentionCounts: mentions,
    };
}

// --- Stats for /me ---

export interface UserStats {
    totalCheckins: number;
    currentStreak: number;
    familyMembersCount: number;
    totalInteractions: number;
    joinedAt: number;
    lastSeen: number | null;
    moodBreakdown: Record<string, number>;
}

export function getUserStats(telegramId: string): UserStats | null {
    const user = getUser(telegramId);
    if (!user) return null;

    const database = getDb();
    const totalCheckins = getCheckinCount(telegramId);
    const members = getFamilyMembers(telegramId);

    let totalInteractions = 0;
    for (const m of members) {
        totalInteractions += getInteractionCount(m.id);
    }

    const moods = database.prepare(
        "SELECT mood, COUNT(*) as count FROM checkins WHERE telegram_id = ? AND mood IS NOT NULL GROUP BY mood"
    ).all(telegramId) as Array<{ mood: string; count: number }>;

    const moodBreakdown: Record<string, number> = {};
    for (const row of moods) {
        moodBreakdown[row.mood] = row.count;
    }

    return {
        totalCheckins,
        currentStreak: user.checkin_streak,
        familyMembersCount: members.length,
        totalInteractions,
        joinedAt: user.joined_at,
        lastSeen: user.last_seen_at,
        moodBreakdown,
    };
}
