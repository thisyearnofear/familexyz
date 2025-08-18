# FamilyXYZ Quick Deployment Guide

## 🚀 Quick Setup Summary

This guide will get your FamilyXYZ project deployed with backend on Hetzner and frontend on Netlify in under 30 minutes.

## Prerequisites

✅ Hetzner server (Ubuntu 20.04+)  
✅ GitHub repository  
✅ Netlify account  

## Step 1: Server Setup (5 minutes)

```bash
# Connect to your Hetzner server
ssh root@YOUR_SERVER_IP

# Run the automated setup script
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/familexyz/main/scripts/setup-hetzner.sh | bash
```

## Step 2: Configure Environment (5 minutes)

```bash
# Edit the environment file
nano /opt/familexyz/.env

# Add your API keys (minimum required):
# OPENAI_API_KEY=your_key_here
# ANTHROPIC_API_KEY=your_key_here
```

## Step 3: GitHub Secrets (5 minutes)

In your GitHub repository → Settings → Secrets and variables → Actions:

- `HETZNER_HOST`: Your server IP
- `HETZNER_USERNAME`: `root` (or your username)
- `HETZNER_SSH_KEY`: Your private SSH key
- `HETZNER_PORT`: `22`

## Step 4: Netlify Setup (10 minutes)

1. Go to [Netlify](https://netlify.com) → New site from Git
2. Connect your GitHub repository
3. Build settings:
   - **Base directory**: `client`
   - **Build command**: `cd .. && pnpm install --no-frozen-lockfile && pnpm build:client`
   - **Publish directory**: `client/dist`
4. Add environment variable:
   - `VITE_SERVER_PORT`: `3000`

## Step 5: Deploy (5 minutes)

```bash
# Push to trigger deployment
git add .
git commit -m "Deploy to production"
git push origin main
```

## ✅ Verify Deployment

```bash
# Check backend health
curl http://YOUR_SERVER_IP:3000/health

# Check frontend
# Visit your Netlify URL
```

## 🔧 Quick Commands

```bash
# Check backend status
ssh root@YOUR_SERVER_IP "pm2 status"

# View backend logs
ssh root@YOUR_SERVER_IP "pm2 logs familexyz-backend"

# Restart backend
ssh root@YOUR_SERVER_IP "pm2 restart familexyz-backend"
```

## 🆘 Need Help?

- **Detailed guide**: See `DEPLOYMENT.md`
- **Backend issues**: Check `/opt/familexyz/logs/`
- **Frontend issues**: Check Netlify deploy logs
- **API issues**: Verify environment variables in `/opt/familexyz/.env`

## 🔒 Security Notes

- Never commit `.env` files to Git
- Use strong passwords for database
- Consider setting up a domain with SSL
- Regularly update server packages

---

**That's it!** Your FamilyXYZ platform should now be live with automatic deployments from GitHub.