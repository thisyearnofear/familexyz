# Security Audit & Recommendations

## 🔍 Current Security Status

### ✅ What's Secure (Properly Handled)

1. **GitHub Workflows** - Uses `${{ secrets.* }}` for sensitive data:
   - `HETZNER_HOST`, `HETZNER_USERNAME`, `HETZNER_SSH_KEY`, `HETZNER_PORT`
   - `GITHUB_TOKEN` for container registry

2. **Environment Files** - Most `.env` files are in `.gitignore`:
   - `.env` (root)
   - `.env.local`
   - `environments/**/.env*`

3. **Code References** - Secrets accessed via `process.env`, not hardcoded:
   ```typescript
   // ✅ Good: Runtime env access
   process.env.HEDERA_OPERATOR_ID
   process.env.VENICE_API_KEY
   ```

---

## ⚠️ Security Concerns (Action Required)

### 1. Server Hostname in Code (`snel-bot`)

**Files Affected:**
- `scripts/deploy-venice-config.sh`
- `scripts/deploy-nginx.sh` (NEW)
- Various deployment scripts

**Risk:** LOW-MEDIUM
- Exposes internal server nickname
- Could help attackers map infrastructure if repo is public

**Recommendation:** 
- ✅ **Keep as-is** if repo is PRIVATE
- 🚨 **Move to env file** if repo becomes PUBLIC
  ```bash
  # Instead of hardcoding:
  ssh snel-bot
  
  # Use env variable:
  ssh ${VPS_HOSTNAME:-snel-bot}
  ```

---

### 2. Deployment Scripts Commit to Git

**Files:**
- `scripts/setup-hetzner-docker.sh` (449 lines)
- `scripts/deploy-venice-config.sh`
- `scripts/test-deployment.sh`

**Risk:** LOW
- These are deployment automation, not secrets
- No hardcoded credentials found

**Recommendation:** ✅ **Safe to keep** - these are infrastructure-as-code

---

### 3. Client Environment File Committed

**File:** `client/.env.production`

**Current Contents:**
```bash
VITE_API_BASE_URL=https://api.famile.xyz
VITE_APP_VERSION=1.0.0-beta
# ... (all public config, no secrets)
```

**Risk:** ✅ **NONE** - Contains only public configuration
- No API keys
- No secrets
- All values are build-time config

**Recommendation:** ✅ **Safe to keep** - rename to `client/.env.production.example` for clarity

---

### 4. IP Address References

**Found:** `157.180.36.156` (Hetzner VPS IP)
- Previously in `client/netlify.toml` (✅ REMOVED in recent commit)
- May appear in old commits/history

**Risk:** LOW
- Public IP anyway (DNS resolves to it)
- Historical reference only

**Recommendation:** ✅ **Already fixed** - no action needed

---

### 5. New Deployment Files (Recent Commits)

**Files Added:**
- `docker/api.famile.xyz.nginx.conf` ✅
- `scripts/deploy-nginx.sh` ✅
- `.env.production.template` ✅

**Risk Assessment:**
- ✅ **nginx.conf** - No secrets, just routing config
- ✅ **deploy-nginx.sh** - Uses `snel-bot` hostname (see #1)
- ✅ **.env.production.template** - Template only, no real values

**Recommendation:** ✅ **All safe** - no sensitive data exposed

---

## 🛡️ Recommended Security Improvements

### Priority 1: Environment Variable for Hostname

If you plan to make the repo PUBLIC:

```bash
# Add to .env (local, not committed)
VPS_HOSTNAME=snel-bot

# Update scripts/deploy-nginx.sh
ssh ${VPS_HOSTNAME:-snel-bot} "..."
```

**Why:** Makes scripts portable and removes hardcoded hostnames.

---

### Priority 2: Add `.env.production` to `.gitignore`

Currently:
```
# .env.production is NOT ignored (used for client)
```

**Recommendation:** Keep it, but ensure it contains NO secrets:
```bash
# client/.env.production - SAFE (public config only)
VITE_API_BASE_URL=https://api.famile.xyz
```

✅ Already safe - no changes needed.

---

### Priority 3: Document Required Secrets

Create `SECURITY.md` or add to README:

```markdown
## Required Secrets (Not Committed)

### GitHub Secrets (for CI/CD)
- `HETZNER_HOST` - VPS IP or hostname
- `HETZNER_USERNAME` - SSH username
- `HETZNER_SSH_KEY` - Private SSH key
- `HETZNER_PORT` - SSH port (default: 22)

### Environment Variables (.env - not committed)
- `VENICE_API_KEY` - Venice AI API key
- `HEDERA_OPERATOR_ID` - Hedera account ID
- `HEDERA_OPERATOR_KEY` - Hedera private key
- `OPENAI_API_KEY` - OpenAI API key (if using)
```

---

### Priority 4: Audit Git History for Leaks

Check if secrets were ever committed:

```bash
# Scan git history for potential leaks
git log --all --full-history --source -- '*secret*' '*key*' '*.pem' '*.env'
```

**Tool:** Use [git-secrets](https://github.com/awslabs/git-secrets) or [truffleHog](https://github.com/trufflesecurity/trufflehog):
```bash
# Install and run truffleHog
docker run --rm -it -v "$PWD:/repo" trufflesecurity/trufflehog github --repo https://github.com/your-org/familexyz
```

---

## 📋 Current `.gitignore` Coverage

### ✅ Well Covered
- [x] `.env` files
- [x] API keys and secrets
- [x] Wallet/private keys
- [x] Database files
- [x] Hedera-specific files (`hedera-keys/`)
- [x] Family data (`family-data/`, `conversations/`)

### ⚠️ Potential Gaps
- [ ] Server hostnames (low risk)
- [ ] Deployment scripts (low risk, but consider making configurable)

---

## 🚨 Immediate Actions Required

### If Repo is PRIVATE (Current State)
✅ **No urgent action needed** - current setup is secure

### If Repo Becomes PUBLIC
1. **Remove or parameterize `snel-bot` hostname**
2. **Run truffleHog to scan history**
3. **Rotate any potentially exposed secrets**
4. **Add SECURITY.md with setup instructions**

---

## 🔐 Best Practices Summary

### What You're Doing Right ✅
1. Using GitHub Secrets for CI/CD
2. `.env` files properly ignored
3. No hardcoded API keys in code
4. Secrets accessed via `process.env`
5. Deployment scripts use SSH keys (not passwords)

### What to Watch Out For ⚠️
1. **Hardcoded hostnames** - Use env variables
2. **Git history** - Scan for accidental commits
3. **Client-side env** - Ensure no server secrets leak
4. **Error messages** - Don't log sensitive data

---

## 📝 Quick Security Checklist

- [x] `.env` files in `.gitignore`
- [x] GitHub Secrets for CI/CD credentials
- [x] No hardcoded API keys in source
- [x] Private keys not committed
- [ ] Hostnames parameterized (optional)
- [ ] Git history scanned (recommended)
- [ ] SECURITY.md documented (recommended)

---

**Overall Security Rating:** 🟢 **GOOD** (for private repo)  
**Public Repo Ready:** 🟡 **Needs minor cleanup** (hostname parameterization)

---

**Date:** 2026-02-26  
**Audited By:** Production readiness review
