/**
 * Lightweight JWT implementation using Node.js crypto.
 * No external dependencies — uses HMAC-SHA256.
 */

import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || process.env.HEDERA_OPERATOR_PRIVATE_KEY || "familexyz-dev-secret-change-in-production";
const TOKEN_EXPIRY = "30d";

function base64url(data: Buffer | string): string {
    const buf = typeof data === "string" ? Buffer.from(data) : data;
    return buf.toString("base64url");
}

function parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 30 * 24 * 60 * 60;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
        case "s": return value;
        case "m": return value * 60;
        case "h": return value * 3600;
        case "d": return value * 86400;
        default: return 30 * 24 * 60 * 60;
    }
}

export interface JwtPayload {
    sub: string;
    accountId?: string;
    familyId?: string;
    role?: string;
    iat?: number;
    exp?: number;
}

export function signToken(payload: Omit<JwtPayload, "iat" | "exp">, expiry = TOKEN_EXPIRY): string {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JwtPayload = {
        ...payload,
        iat: now,
        exp: now + parseExpiry(expiry),
    };

    const headerB64 = base64url(JSON.stringify(header));
    const payloadB64 = base64url(JSON.stringify(fullPayload));
    const signature = crypto
        .createHmac("sha256", JWT_SECRET)
        .update(`${headerB64}.${payloadB64}`)
        .digest("base64url");

    return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyToken(token: string): JwtPayload | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signature] = parts;

    const expectedSig = crypto
        .createHmac("sha256", JWT_SECRET)
        .update(`${headerB64}.${payloadB64}`)
        .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        return null;
    }

    try {
        const payload: JwtPayload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}

export function getUserId(payload: JwtPayload): string {
    return payload.sub;
}
