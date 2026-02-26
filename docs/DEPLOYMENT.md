# Production Deployment Guide - Hetzner VPS

This guide walks you through deploying the FamilyXYZ backend to your Hetzner VPS with TLS termination via nginx and Let's Encrypt.

## Architecture

```
┌─────────────────────┐
│  api.famile.xyz     │
│  (Cloudflare DNS)   │
└──────────┬──────────┘
           │ HTTPS :443
           ▼
┌─────────────────────┐
│  Hetzner VPS        │
│  ┌───────────────┐  │
│  │    nginx      │  │  ← TLS termination, rate limiting
│  │  (port 80/443)│  │
│  └───────┬───────┘  │
│          │          │
│          ▼          │
│  ┌───────────────┐  │
│  │   Backend     │  │  ← Internal only (port 3000/3001)
│  │   Container   │  │
│  └───────────────┘  │
└─────────────────────┘
```

## Prerequisites

- Hetzner VPS with public IP
- Domain `api.famile.xyz` pointing to your VPS IP
- Docker & Docker Compose installed on VPS
- SSH access to VPS

## Quick Deploy

### 1. Copy Deployment Files to VPS

```bash
# From your local machine
cd /path/to/familexyz

# Copy deployment configs
scp docker-compose.production.yml snel-bot:/tmp/
scp docker/nginx/nginx.conf snel-bot:/tmp/
scp scripts/deploy-to-hetzner.sh snel-bot:/tmp/
```

### 2. Run Deployment Script

```bash
# SSH into VPS
ssh snel-bot

# Make script executable and run
chmod +x /tmp/deploy-to-hetzner.sh
sudo /tmp/deploy-to-hetzner.sh
```

The script will:
- Create project directory `/opt/familexyz`
- Obtain Let's Encrypt certificate
- Start backend and nginx containers
- Verify deployment

### 3. Verify Deployment

```bash
# Check services
docker compose -f /opt/familexyz/docker-compose.production.yml ps

# Test health endpoint
curl https://api.famile.xyz/health

# Check logs
docker logs familexyz-backend
docker logs familexyz-nginx
```

## Manual Deployment (Alternative)

If you prefer manual steps:

### Step 1: Create Directory Structure

```bash
sudo mkdir -p /opt/familexyz/docker/nginx/certbot/{www,conf}
cd /opt/familexyz
```

### Step 2: Copy Config Files

```bash
# Copy from your local machine
scp docker-compose.production.yml snel-bot:/opt/familexyz/
scp docker/nginx/nginx.conf snel-bot:/opt/familexyz/docker/nginx/
```

### Step 3: Obtain SSL Certificate

```bash
docker run --rm \
  -v /opt/familexyz/docker/nginx/certbot/www:/var/www/certbot \
  -v /opt/familexyz/docker/nginx/certbot/conf:/etc/letsencrypt \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@famile.xyz \
  --domain api.famile.xyz \
  --non-interactive \
  --agree-tos
```

### Step 4: Start Services

```bash
docker compose -f docker-compose.production.yml up -d
```

### Step 5: Verify

```bash
curl https://api.famile.xyz/health
```

## Configuration

### Environment Variables

Create `/opt/familexyz/.env` with your configuration:

```bash
# Hedera
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=your-private-key

# API
NODE_ENV=production
HEALTH_PORT=3001

# Model
MODEL_PROVIDER=venice
VENICE_API_KEY=your-venice-key
```

### Nginx Configuration

Edit `docker/nginx/nginx.conf` to:
- Adjust rate limits (`limit_req_zone`)
- Add security headers
- Configure caching

### DNS Setup

Ensure `api.famile.xyz` points to your Hetzner VPS:

```bash
# Check DNS
dig api.famile.xyz

# Should return your VPS IP
```

## Monitoring

### Check Service Status

```bash
docker compose -f docker-compose.production.yml ps
```

### View Logs

```bash
# All services
docker compose -f docker-compose.production.yml logs -f

# Backend only
docker logs -f familexyz-backend

# Nginx only
docker logs -f familexyz-nginx
```

### Health Checks

```bash
# Health endpoint
curl https://api.famile.xyz/health

# Readiness endpoint
curl https://api.famile.xyz/ready
```

## Maintenance

### Update Backend

```bash
cd /opt/familexyz
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

### Renew Certificate

Certbot auto-renews, but to manually renew:

```bash
docker run --rm \
  -v /opt/familexyz/docker/nginx/certbot/conf:/etc/letsencrypt \
  -v /opt/familexyz/docker/nginx/certbot/www:/var/www/certbot \
  certbot/certbot renew --force-renewal
```

### Backup Data

```bash
# Backup Docker volumes
docker run --rm \
  -v familexyz-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/familexyz-data-backup.tar.gz /data
```

## Troubleshooting

### Certificate Issues

```bash
# Check certificate files
ls -la /opt/familexyz/docker/nginx/certbot/conf/live/api.famile.xyz/

# View certbot logs
docker logs familexyz-certbot
```

### Backend Not Starting

```bash
# Check logs
docker logs familexyz-backend

# Check .env file
cat /opt/familexyz/.env
```

### Nginx Errors

```bash
# Check nginx config
docker exec familexyz-nginx nginx -t

# View nginx logs
docker logs familexyz-nginx
tail -f /opt/familexyz/docker/nginx/logs/error.log
```

## Security Notes

- Backend is **not** exposed directly (only via nginx)
- Rate limiting: 10 requests/second with burst of 20
- CORS restricted to allowed origins only
- HTTPS enforced with HSTS (after uncommenting in nginx.conf)
- Regular certificate auto-renewal configured

## Next Steps

1. **Update Frontend:** Set `VITE_API_BASE_URL=https://api.famile.xyz` in Netlify
2. **Test Integration:** Verify frontend can reach backend
3. **Monitor:** Set up uptime monitoring for `/health`
4. **Backup:** Configure automated backups for Docker volumes
