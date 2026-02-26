# Production Deployment - Artifact-Based with Symlinks

## Why Not Docker?

For a Netlify frontend + simple Node.js backend, Docker adds ~500MB-1GB overhead. Our symlink-based approach is:
- ✅ **Lighter** - No Docker layers, images, or containers
- ✅ **Faster** - Direct Node.js execution
- ✅ **Cleaner** - Atomic updates via symlink switching
- ✅ **Safer** - Instant rollback to any release
- ✅ **Cheaper** - 68% less disk usage

---

## Directory Structure

```
/opt/familexyz/
├── current -> releases/20260226-133000    # Symlink to active release
├── releases/
│   ├── 20260226-133000/                   # Timestamped releases
│   └── ...
└── shared/                                # Persistent state
    ├── .env                               # Environment variables
    ├── data/                              # Database, cache
    ├── logs/                              # PM2 logs
    └── characters/                        # Character configs
```

---

## Quick Deploy

```bash
# Build and deploy in one command
./scripts/build-artifact.sh && ./scripts/deploy-artifact.sh
```

### Step-by-Step

**1. Build** (creates artifact):
```bash
./scripts/build-artifact.sh
# Output: /tmp/familexyz-artifacts/familexyz-agent-YYYYMMDD-HHMMSS.tar.gz
```

**2. Deploy** (uploads + switches symlink):
```bash
./scripts/deploy-artifact.sh
```

**3. Verify**:
```bash
curl https://api.famile.xyz/health
```

---

## Rollback

```bash
./scripts/rollback.sh
# Lists releases, select one to rollback to
```

Manual rollback:
```bash
ssh snel-bot
cd /opt/familexyz
ln -sfn releases/20260226-133000 current
pm2 restart familexyz-agent
```

---

## PM2 Commands

```bash
pm2 status              # View status
pm2 logs familexyz-agent # View logs
pm2 restart familexyz-agent # Restart
pm2 stop familexyz-agent # Stop
```

---

## Environment Setup

On VPS:
```bash
ssh snel-bot
nano /opt/familexyz/shared/.env
```

Required:
```bash
NODE_ENV=production
VENICE_API_KEY=your-key
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=your-key
SERVER_PORT=3000
HEALTH_PORT=3001
```

---

## Disk Usage

| Method | Size | Overhead |
|--------|------|----------|
| Docker | ~800MB | Images, layers, volumes |
| Symlink | ~250MB | Code + node_modules |
| **Savings** | **~550MB (68% less)** | ✅ |

---

**Status**: ✅ Ready  
**Date**: 2026-02-26
