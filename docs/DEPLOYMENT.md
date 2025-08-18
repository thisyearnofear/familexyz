# FamilyXYZ Production Deployment Guide

This guide will help you deploy the FamilyXYZ project with the backend on Hetzner and frontend on Netlify, with automatic GitHub deployments.

## Overview

- **Backend**: Deployed on Hetzner server using PM2 and automated GitHub Actions
- **Frontend**: Deployed on Netlify with automatic builds from GitHub
- **Database**: SQLite or PostgreSQL on Hetzner server
- **Cache**: Redis on Hetzner server

## Prerequisites

- Hetzner server (Ubuntu 20.04+ recommended)
- GitHub repository
- Netlify account
- Domain name (optional but recommended)

## Step 1: Hetzner Server Setup

### 1.1 Initial Server Setup

1. Connect to your Hetzner server:
   ```bash
   ssh root@your-server-ip
   ```

2. Run the setup script:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/your-username/familexyz/main/scripts/setup-hetzner.sh | bash
   ```

   Or manually download and run:
   ```bash
   wget https://raw.githubusercontent.com/your-username/familexyz/main/scripts/setup-hetzner.sh
chmod +x setup-hetzner.sh
./setup-hetzner.sh
   ```

### 1.2 Configure Environment Variables

1. Edit the environment file:
   ```bash
   nano /opt/familexyz/.env
   ```

2. Fill in your API keys and configuration based on the template provided.

### 1.3 Optional: Setup PostgreSQL (Recommended for Production)

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE familexyz;
CREATE USER familexyz WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE familexyz TO familexyz;
\q

# Update .env file
echo "DATABASE_URL=postgresql://familexyz:your_secure_password@localhost:5432/familexyz" >> /opt/familexyz/.env
```

## Step 2: GitHub Repository Setup

### 2.1 Add Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

- `HETZNER_HOST`: Your server IP address
- `HETZNER_USERNAME`: Your server username (usually `root`)
- `HETZNER_SSH_KEY`: Your private SSH key for server access
- `HETZNER_PORT`: SSH port (usually `22`)

### 2.2 Generate SSH Key (if needed)

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions@familexyz"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@your-server-ip

# Copy private key content for GitHub secret
cat ~/.ssh/id_ed25519
```

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