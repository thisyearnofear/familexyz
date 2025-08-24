# FamilyXYZ Production Deployment Guide

This guide provides two modern deployment approaches for the FamilyXYZ project: Docker-based CI/CD (recommended) and simple Docker Compose setup.

## Overview

- **Backend**: Deployed on Hetzner server using Docker containers
- **Frontend**: Deployed on Netlify with automatic builds from GitHub
- **Database**: SQLite (containerized) or PostgreSQL
- **Deployment**: GitHub Actions with Docker images (no server-side builds)

## 🔄 Key Improvements

### Before (Old Setup)

- ❌ Server-side builds with `pnpm install` and `pnpm build`
- ❌ Massive node_modules directories on server
- ❌ PM2 with direct Node.js execution
- ❌ Potential disk space and memory issues
- ❌ Complex dependency management on server

### After (New Setup)

- ✅ **Docker images built in GitHub Actions** (clean environment)
- ✅ **Server only pulls and runs pre-built images**
- ✅ **No more server-side builds or node_modules**
- ✅ **Better resource isolation and management**
- ✅ **Zero-downtime deployments**
- ✅ **Automatic health checks and monitoring**

## Deployment Options

### Option A: Docker CI/CD (Recommended)

**Best for production environments**

- ✅ GitHub Actions builds Docker images
- ✅ Server only pulls and runs pre-built images
- ✅ No server-side builds or massive node_modules
- ✅ Better resource management and isolation
- ✅ Zero-downtime deployments

### Option B: Simple Docker Compose

**Best for quick setup or development**

- ✅ Quick setup with git clone + docker compose
- ✅ Manual deployment control
- ✅ Good for development/testing environments

## Prerequisites

- Hetzner server (Ubuntu 20.04+ recommended)
- GitHub repository
- Netlify account
- Domain name (optional but recommended)

## Option A: Docker CI/CD Setup (Recommended)

### Step 1: Hetzner Server Setup

1. Connect to your Hetzner server:

    ```bash
    ssh root@your-server-ip
    ```

2. Run the consolidated Docker setup script:

    ```bash
    curl -fsSL https://raw.githubusercontent.com/thisyearnofear/familexyz/develop/scripts/setup-hetzner-docker.sh | bash
    ```

    Or manually download and run:

    ```bash
    wget https://raw.githubusercontent.com/thisyearnofear/familexyz/develop/scripts/setup-hetzner-docker.sh
    chmod +x setup-hetzner-docker.sh
    ./setup-hetzner-docker.sh
    ```

    This single script now includes:

    - Docker and Docker Compose installation
    - Server security configuration (firewall, fail2ban)
    - Systemd service for auto-start
    - Management scripts (status, logs, restart, update, backup)
    - Monitoring and backup automation

### Step 2: Configure Environment

1. Edit the environment file:

    ```bash
    nano /opt/familexyz/.env
    ```

2. Fill in your API keys and configuration:

    ```bash
    # Required API Keys
    OPENAI_API_KEY=your_actual_openai_key
    ANTHROPIC_API_KEY=your_actual_anthropic_key

    # Optional: Add other API keys as needed
    GOOGLE_GENERATIVE_AI_API_KEY=your_google_key
    GROQ_API_KEY=your_groq_key
    ```

### Step 3: GitHub Repository Setup

The updated GitHub Actions workflow will build Docker images and deploy them automatically.

1. **Add Repository Secrets**

    Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

    - `HETZNER_HOST`: Your server IP address
    - `HETZNER_USERNAME`: Your server username (usually `root`)
    - `HETZNER_SSH_KEY`: Your private SSH key for server access
    - `HETZNER_PORT`: SSH port (usually `22`)

2. **Generate SSH Key (if needed)**

    ```bash
    # On your local machine
    ssh-keygen -t ed25519 -C "github-actions@familexyz"

    # Copy public key to server
    ssh-copy-id -i ~/.ssh/id_ed25519.pub root@your-server-ip

    # Copy private key content for GitHub secret
    cat ~/.ssh/id_ed25519
    ```

### Step 4: Deploy and Test

1. Push your code to trigger deployment:

    ```bash
    git add .
    git commit -m "Set up Docker-based deployment"
    git push origin develop  # or main
    ```

2. Monitor the deployment in GitHub Actions tab

3. Verify deployment:

    ```bash
    # Check container status
    ssh root@your-server-ip "cd /opt/familexyz && docker compose ps"

    # Check health
    curl http://your-server-ip:3000/health
    ```

---

## Option B: Simple Docker Compose Setup

For a quicker setup without CI/CD automation:

### Step 1: Server Setup

1. Connect to your server and run the same consolidated Docker setup:

    ```bash
    ssh root@your-server-ip
    curl -fsSL https://raw.githubusercontent.com/thisyearnofear/familexyz/develop/scripts/setup-hetzner-docker.sh | bash
    ```

    **Note**: This is the same comprehensive setup script as Option A, providing all the management tools and automation.

### Step 2: Manual Deployment

1. Clone the repository:

    ```bash
    cd /opt/familexyz
    git clone https://github.com/thisyearnofear/familexyz.git current
    cd current
    ```

2. Copy environment file:

    ```bash
    cp /opt/familexyz/.env .env
    ```

3. Build and start:

    ```bash
    docker compose build
    docker compose up -d
    ```

### Step 3: Management

Use the provided scripts for easy management:

```bash
# Check status
/opt/familexyz/status.sh

# View logs
/opt/familexyz/logs.sh

# Restart service
/opt/familexyz/restart.sh

# Update deployment
/opt/familexyz/update.sh

# Test deployment
/opt/familexyz/test-deployment.sh
```

---

## Management & Monitoring

### Server Management Scripts

The consolidated setup script creates several management scripts in `/opt/familexyz/`:

- **`status.sh`** - Check container status and resource usage
- **`logs.sh`** - View real-time logs
- **`restart.sh`** - Restart containers gracefully
- **`update.sh`** - Pull latest images and restart
- **`backup.sh`** - Backup data and configuration
- **`monitor.sh`** - System monitoring (runs via cron)
- **`deploy.sh`** - Manual deployment script

Plus the test script from the repository:

- **`scripts/test-deployment.sh`** - Comprehensive deployment testing

### Docker Commands

```bash
# View container status
docker compose ps

# View logs
docker compose logs -f

# Restart containers
docker compose restart

# Stop containers
docker compose down

# Update and restart
docker compose pull && docker compose up -d
```

### Resource Benefits

- **Memory**: Containerized with 1GB limit (vs unlimited before)
- **Disk**: No more massive node_modules directories
- **CPU**: Controlled resource usage with limits
- **Monitoring**: Automatic health checks and restart

## File Structure

The deployment setup uses a clean, consolidated structure:

```
familexyz/
├── Dockerfile                           # Optimized multi-stage Docker build
├── docker-compose.yml                   # Production Docker Compose config
├── .github/workflows/deploy-backend.yml # Docker-based CI/CD pipeline
├── docs/DEPLOYMENT.md                   # This comprehensive guide
├── scripts/
│   ├── setup-hetzner-docker.sh         # Single consolidated setup script
│   └── test-deployment.sh              # Deployment validation
└── ecosystem.config.js                 # Legacy PM2 config (deprecated)
```

**Key Changes Made:**

- ✅ Consolidated duplicate Docker configurations
- ✅ Removed obsolete PM2-based setup scripts
- ✅ Enhanced single setup script with all features
- ✅ Merged deployment documentation
- ✅ Streamlined file structure following DRY principles

---

## Step 3: Netlify Frontend Setup

### 3.1 Connect Repository to Netlify

1. Log in to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Choose GitHub and select your repository
4. Configure build settings:
    - **Base directory**: `client`
    - **Build command**: `cd .. && pnpm install --no-frozen-lockfile && pnpm build:client`
    - **Publish directory**: `client/dist`

### 3.2 Environment Variables

In Netlify dashboard → Site settings → Environment variables, add:

- `VITE_SERVER_PORT`: `3000`
- `VITE_API_URL`: `https://your-server-domain.com` (or `http://your-server-ip:3000`)

### 3.3 Custom Domain (Optional)

1. In Netlify dashboard → Domain settings
2. Add your custom domain
3. Configure DNS records as instructed

## Step 4: Domain and SSL Setup (Optional)

### 4.1 Configure Domain for Backend

1. Point your domain to your Hetzner server IP
2. Install Nginx as reverse proxy:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/familexyz << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/familexyz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Step 5: Deploy and Test

### 5.1 First Deployment

1. Push your code to the main branch:

    ```bash
    git add .
    git commit -m "Add production deployment configuration"
    git push origin main
    ```

2. Monitor the GitHub Actions deployment in your repository's Actions tab

3. Check Netlify deployment in your Netlify dashboard

### 5.2 Verify Deployment

1. Check backend health:

    ```bash
    curl http://your-server-ip:3000/health
    # or
    curl https://your-domain.com/health
    ```

2. Check frontend:
    - Visit your Netlify URL or custom domain
    - Verify it can connect to the backend

## Step 6: Monitoring and Maintenance

### 6.1 Monitor Backend

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs familexyz-backend

# Restart if needed
pm2 restart familexyz-backend
```

### 6.2 Monitor System Resources

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
```

### 6.3 Backup Database

```bash
# For SQLite
cp /opt/familexyz/data/db.sqlite /opt/familexyz/backups/db-$(date +%Y%m%d).sqlite

# For PostgreSQL
pg_dump -U familexyz familexyz > /opt/familexyz/backups/db-$(date +%Y%m%d).sql
```

## Troubleshooting

### Common Issues

1. **Deployment fails**: Check GitHub Actions logs and server logs
2. **Frontend can't connect to backend**: Verify CORS settings and API URL
3. **Database connection issues**: Check database credentials and connectivity
4. **Memory issues**: Monitor server resources and adjust PM2 configuration

### Useful Commands

```bash
# Check server status
sudo systemctl status nginx redis-server

# Check application logs
pm2 logs familexyz-backend --lines 100

# Check system logs
sudo journalctl -u nginx -f

# Test API endpoints
curl -X GET http://localhost:3000/health
curl -X GET http://localhost:3000/family/stats
```

## Security Considerations

1. **Firewall**: Only open necessary ports (22, 80, 443, 3000)
2. **SSH**: Use key-based authentication, disable password login
3. **SSL**: Always use HTTPS in production
4. **Environment Variables**: Never commit secrets to Git
5. **Updates**: Regularly update system packages and dependencies

## Performance Optimization

1. **Database**: Use PostgreSQL for better performance
2. **Caching**: Ensure Redis is properly configured
3. **CDN**: Consider using a CDN for static assets
4. **Monitoring**: Set up monitoring and alerting

For additional help or issues, please check the project documentation or create an issue in the GitHub repository.
