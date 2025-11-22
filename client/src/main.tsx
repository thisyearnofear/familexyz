import { Buffer } from "buffer";
globalThis.Buffer = Buffer;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

import { HederaAuthProvider } from "@elizaos/hedera-wallet/react";
import { HederaAuthConfig } from "@elizaos/hedera-wallet/types";

const hederaConfig: HederaAuthConfig = {
    wallet: {
        // Use WalletConnect v2 projectId (required for HashConnect v3)
        // Get from https://cloud.walletconnect.com/
        projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "",
        name: "FamilyXYZ",
        description: "Family Connection Dashboard",
        url: import.meta.env.VITE_URL || "http://localhost:5173",
        icons: ["https://avatars.githubusercontent.com/u/37784886"],
        network: (import.meta.env.VITE_HEDERA_NETWORK || "testnet") as "testnet" | "mainnet" | "previewnet",
        debug: import.meta.env.DEV
    },
    session: {
        ttl: 86400,
        refreshThreshold: 300,
        maxConcurrentSessions: 1
    },
    family: {
        inviteCodeLength: 6,
        inviteExpirationDays: 7,
        maxMembersPerFamily: 10
    },
    cache: {
        ttl: 300,
        maxEntries: 100,
        cleanupInterval: 60
    },
    security: {
        requireSignature: false
    }
};

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <HederaAuthProvider config={hederaConfig}>
            <App />
        </HederaAuthProvider>
    </StrictMode>
);
