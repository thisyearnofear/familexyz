# Production Deployment - Simple & Lean

## Why Not Docker?

For a Netlify frontend + simple Node.js backend, Docker adds ~500MB-1GB overhead with no benefit.

**Our approach:**
- ✅ **Direct Node.js** - Run source code directly with PM2
- ✅ **No build step** - Use `tsx` to run TypeScript directly
- ✅ **pnpm --prod** - Only production dependencies
- ✅ **Shared state** - `.env`, `data/`, `logs/` outside code

**Space Savings:**
| Method | Disk Usage | Components |
|--------|------------|------------|
| Docker | ~800MB | Image + layers + volumes + logs |
| **Direct** | **~300MB** | Source + node_modules only |
| **Savings** | **~500MB (62% less)** | ✅ |

---

## Quick Deploy

```bash
./scripts/deploy.sh
```

That's it. The script:
1. Creates directory structure on VPS
2. Syncs source code (rsync, excludes node_modules)
3. Runs `pnpm install --prod` on server
4. Starts PM2 process
5. Verifies health endpoint

---

## Directory Structure

```
/opt/familexyz/
├── current/                       # Source code (rsynced)
│   ├── agent/src/
│   ├── packages/
│   ├── package.json
│   └── ecosystem.config.js        # PM2 config (auto-created)
│
└── shared/                        # Persistent state
    ├── .env                       # Environment variables
    ├── data/                      # SQLite database
    ├── logs/                      # PM2 logs
    └── characters/                # Character configs
```

---

## Manual Steps

### 1. Configure Environment

On VPS:
```bash
ssh snel-bot
nano /opt/familexyz/shared/.env
```

Required:
```bash
NODE_ENV=production
VENICE_API_KEY=your-venice-key
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=your-hedera-key
SERVER_PORT=3000
HEALTH_PORT=3001
```

### 2. Deploy

```bash
./scripts/deploy.sh
```

### 3. Verify

```bash
curl https://api.famile.xyz/health
```

---

## PM2 Commands

```bash
pm2 status              # View status
pm2 logs familexyz-agent # View logs
pm2 restart familexyz-agent # Restart
pm2 stop familexyz-agent # Stop
pm2 delete familexyz-agent # Remove
```

---

## How It Works

**Deploy Flow:**
```bash
# 1. rsync source (excludes node_modules, dist, etc.)
rsync -avz --exclude 'node_modules' --exclude 'dist' ./ snel-bot:/opt/familexyz/current/

# 2. Install production deps only
ssh snel-bot "cd /opt/familexyz/current && pnpm install --prod"

# 3. Start with PM2 (runs via tsx)
ssh snel-bot "pm2 start ecosystem.config.js"
```

**Why tsx?**
- Runs TypeScript directly (no build step)
- Faster deploys (no compile wait)
- Easier debugging (source maps)

---

## Space Savings Breakdown

**What we save:**
1. **No Docker daemon** - ~100MB
2. **No Docker images** - ~400-600MB
3. **No container layers** - ~200MB
4. **No Docker volumes** - ~100MB

**What we keep:**
- Source code: ~50MB
- node_modules (prod only): ~200-250MB
- Logs: ~10-50MB
- **Total: ~300MB**

---

## Rollback

Manual rollback:
```bash
ssh snel-bot
cd /opt/familexyz/current
git checkout <previous-commit>
pnpm install --prod
pm2 restart familexyz-agent
```

Or use git-based rollback:
```bash
# If using git on server
cd /opt/familexyz/current
git log --oneline -5  # Find commit
git revert HEAD       # Or git reset --hard <commit>
pnpm install --prod
pm2 restart familexyz-agent
```

---

## Core Principles

| Principle | How We Honor It |
|-----------|-----------------|
| **PREVENT BLOAT** | 62% less disk vs Docker |
| **CONSOLIDATION** | Single deploy script, no artifacts |
| **CLEAN** | Source + shared state separated |
| **MODULAR** | PM2 manages process independently |
| **PERFORMANT** | Direct execution, no container layer |
| **ORGANIZED** | Predictable structure |

---

**Status**: ✅ Ready  
**Date**: 2026-02-26  
**Method**: Direct deploy with PM2 + tsx
