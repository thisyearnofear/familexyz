/**
 * Hono authentication middleware.
 * Extracts JWT from Authorization header, verifies, and attaches user to context.
 */

import type { Context, Next } from "hono";
import { verifyToken } from "./jwt.js";

export async function authMiddleware(c: Context, next: Next) {
    const header = c.req.header("Authorization");

    if (!header || !header.startsWith("Bearer ")) {
        c.set("user", null);
        return next();
    }

    const token = header.slice(7);
    const payload = verifyToken(token);

    if (!payload) {
        c.set("user", null);
        return next();
    }

    c.set("user", payload);
    return next();
}

export function requireAuth(c: Context): { sub: string; accountId?: string; familyId?: string } | null {
    return c.get("user") ?? null;
}
