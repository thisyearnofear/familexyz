# Production Deployment Guide

This guide covers deploying Family-Connection AI Agents to production environments with enterprise-grade security, scalability, and reliability.

## Prerequisites

### Infrastructure Requirements

- **Server**: Minimum 4 CPU cores, 8GB RAM, 50GB SSD
- **Database**: PostgreSQL 13+ or managed database service
- **Redis**: For caching and session management
- **SSL Certificate**: For HTTPS encryption
- **Domain**: Custom domain with DNS management
- **Monitoring**: Log aggregation and alerting system

### Security Requirements

- **Firewall**: Properly configured network security
- **VPC/Private Network**: Isolated network environment
- **Secrets Management**: Secure API key and certificate storage
- **Backup Strategy**: Regular automated backups
- **Compliance**: GDPR, COPPA compliance for family data

## Deployment Options

### Option 1: Docker Container (Recommended)

#### 1. Prepare Production Environment

```bash
# Create production directory
mkdir family-agents-prod
cd family-agents-prod

# Clone repository
git clone https://github.com/your-org/familexyz.git .
git checkout main
```

#### 2. Configure Production Environment

```bash
# Copy production environment template
cp environments/production/.env.production .env

# Edit with production values
nano .env
```

**Critical Production Settings:**

```env
# =============================================================================
# PRODUCTION ENVIRONMENT
# =============================================================================
NODE_ENV=production
VERBOSE=false
DEFAULT_LOG_LEVEL=info

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
# Strong JWT secret (generate with: openssl rand -base64 64)
JWT_SECRET=your_production_jwt_secret_64_characters_minimum

# Encryption key (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=your_32_character_encryption_key

# HTTPS enforcement
FORCE_HTTPS=true
SECURE_COOKIES=true

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
# Production PostgreSQL
DATABASE_URL=postgresql://username:password@db-host:5432/family_agents_prod
DATABASE_SSL=require
CONNECTION_POOL_SIZE=20

# Redis for caching
REDIS_URL=redis://redis-host:6379
REDIS_PASSWORD=your_redis_password

# =============================================================================
# API KEYS (Use environment-specific keys)
# =============================================================================
OPENAI_API_KEY=prod_openai_api_key
DISCORD_API_TOKEN=prod_discord_bot_token
TELEGRAM_BOT_TOKEN=prod_telegram_bot_token

# =============================================================================
# FAMILY SAFETY (Maximum Security)
# =============================================================================
PRIVACY_MODE=strict
CONTENT_MODERATION_ENABLED=true
PARENTAL_CONTROLS_ENABLED=true
SAFE_MODE=true
DATA_RETENTION_DAYS=90
FAMILY_DATA_ENCRYPTION=true

# =============================================================================
# PERFORMANCE OPTIMIZATION
# =============================================================================
RATE_LIMIT_REQUESTS_PER_MINUTE=60
MAX_CONCURRENT_CONVERSATIONS=5
RESPONSE_TIMEOUT_MS=15000
ENABLE_CACHING=true

# =============================================================================
# MONITORING & LOGGING
# =============================================================================
LOG_LEVEL=info
LOG_FORMAT=json
ENABLE_METRICS=true
SENTRY_DSN=your_sentry_dsn_for_error_tracking

# =============================================================================
# DOMAIN CONFIGURATION
# =============================================================================
DOMAIN=your-family-agents.com
CLIENT_URL=https://your-family-agents.com
API_BASE_URL=https://api.your-family-agents.com
```

#### 3. Build and Deploy with Docker

```bash
# Build production image
docker build -f docker/Dockerfile -t family-agents:prod .

# Create network for services
docker network create family-network

# Start PostgreSQL (or use managed service)
docker run -d \
  --name family-postgres \
  --network family-network \
  -e POSTGRES_DB=family_agents_prod \
  -e POSTGRES_USER=family_user \
  -e POSTGRES_PASSWORD=secure_password \
  -v family_db_data:/var/lib/postgresql/data \
  postgres:15

# Start Redis
docker run -d \
  --name family-redis \
  --network family-network \
  -e REDIS_PASSWORD=secure_redis_password \
  redis:7-alpine redis-server --requirepass secure_redis_password

# Start the application
docker run -d \
  --name family-agents \
  --network family-network \
  -p 3000:3000 \
  --env-file .env \
  -v family_logs:/app/logs \
  -v family_data:/app/data \
  --restart unless-stopped \
  family-agents:prod
```

#### 4. Set Up Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/family-agents`:

```nginx
server {
    listen 80;
    server_name your-family-agents.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-family-agents.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;
    limit_req zone=api burst=20 nodelay;

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
        
        # Timeouts
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

### Option 2: Kubernetes Deployment

#### 1. Create Kubernetes Manifests

**Namespace:**
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: family-agents
```

**ConfigMap:**
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: family-agents-config
  namespace: family-agents
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  PRIVACY_MODE: "strict"
  CONTENT_MODERATION_ENABLED: "true"
```

**Secret:**
```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: family-agents-secrets
  namespace: family-agents
type: Opaque
stringData:
  JWT_SECRET: "your_jwt_secret"
  ENCRYPTION_KEY: "your_encryption_key"
  OPENAI_API_KEY: "your_openai_key"
  DATABASE_URL: "postgresql://user:pass@host:5432/db"
```

**Deployment:**
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: family-agents
  namespace: family-agents
spec:
  replicas: 3
  selector:
    matchLabels:
      app: family-agents
  template:
    metadata:
      labels:
        app: family-agents
    spec:
      containers:
      - name: family-agents
        image: family-agents:prod
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: family-agents-config
              key: NODE_ENV
        envFrom:
        - secretRef:
            name: family-agents-secrets
        - configMapRef:
            name: family-agents-config
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### 2. Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n family-agents
kubectl logs -f deployment/family-agents -n family-agents
```

### Option 3: Cloud Platform Deployment

#### AWS ECS with Fargate

```json
{
  "family": "family-agents",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/familyAgentsTaskRole",
  "containerDefinitions": [
    {
      "name": "family-agents",
      "image": "your-ecr-repo/family-agents:prod",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:family-agents/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/family-agents",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## Database Setup

### PostgreSQL Production Configuration

#### 1. Create Production Database

```sql
-- Connect as superuser
CREATE DATABASE family_agents_prod;
CREATE USER family_agent WITH PASSWORD 'secure_production_password';
GRANT ALL PRIVILEGES ON DATABASE family_agents_prod TO family_agent;

-- Security settings
ALTER USER family_agent SET default_transaction_isolation TO 'read committed';
ALTER USER family_agent SET timezone TO 'UTC';
```

#### 2. Database Optimizations

```sql
-- Performance tuning (adjust based on your server specs)
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';

-- Security settings
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET password_encryption = 'scram-sha-256';

-- Reload configuration
SELECT pg_reload_conf();
```

#### 3. Backup Strategy

```bash
#!/bin/bash
# daily-backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/family-agents"
DB_NAME="family_agents_prod"

# Create backup
pg_dump -h localhost -U family_agent -d $DB_NAME > "$BACKUP_DIR/backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" s3://your-backup-bucket/database/
```

## Security Hardening

### 1. Server Security

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 2. Application Security

**Security Headers Middleware:**
```javascript
// security-middleware.js
const helmet = require('helmet');

module.exports = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "wss:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});
```

### 3. API Security

**Rate Limiting:**
```javascript
// rate-limiting.js
const rateLimit = require('express-rate-limit');

const familyApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP for family API',
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit each IP to 5 login attempts per windowMs
  skipSuccessfulRequests: true
});

module.exports = { familyApiLimiter, authLimiter };
```

## Monitoring and Logging

### 1. Application Monitoring

**Health Check Endpoint:**
```javascript
// health-check.js
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      ai_models: 'unknown'
    }
  };

  try {
    // Check database
    await db.query('SELECT 1');
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'unhealthy';
  }

  try {
    // Check Redis
    await redis.ping();
    health.services.redis = 'healthy';
  } catch (error) {
    health.services.redis = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### 2. Logging Configuration

**Production Logger:**
```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'family-agents' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 10
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### 3. Metrics and Alerting

**Prometheus Metrics:**
```javascript
// metrics.js
const prometheus = require('prom-client');

const register = new prometheus.Registry();

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const familyAgentInteractions = new prometheus.Counter({
  name: 'family_agent_interactions_total',
  help: 'Total number of family agent interactions',
  labelNames: ['agent_type', 'platform'],
  registers: [register]
});

module.exports = { register, httpRequestDuration, familyAgentInteractions };
```

## Performance Optimization

### 1. Caching Strategy

```javascript
// caching.js
const Redis = require('redis');
const client = Redis.createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD
});

const cache = {
  // Cache family agent responses for 5 minutes
  setAgentResponse: async (key, response) => {
    await client.setEx(`agent:${key}`, 300, JSON.stringify(response));
  },
  
  getAgentResponse: async (key) => {
    const cached = await client.get(`agent:${key}`);
    return cached ? JSON.parse(cached) : null;
  },

  // Cache user preferences for 1 hour
  setUserPreferences: async (userId, preferences) => {
    await client.setEx(`user:${userId}:prefs`, 3600, JSON.stringify(preferences));
  }
};

module.exports = cache;
```

### 2. Database Connection Pooling

```javascript
// database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
```

## Deployment Checklist

### Pre-Deployment

- [ ] Environment configuration reviewed and secured
- [ ] SSL certificates installed and configured
- [ ] Database backup and restore tested
- [ ] Security headers implemented
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up
- [ ] Log rotation configured
- [ ] Health checks implemented

### Deployment

- [ ] Application builds successfully
- [ ] Database migrations run successfully
- [ ] All services start without errors
- [ ] Health checks pass
- [ ] SSL certificate validation
- [ ] DNS configuration verified
- [ ] Load balancer configuration (if applicable)

### Post-Deployment

- [ ] Smoke tests pass
- [ ] Family agent interactions working
- [ ] Platform integrations functional
- [ ] Monitoring dashboards active
- [ ] Log aggregation working
- [ ] Backup procedures verified
- [ ] Performance metrics baseline established

## Maintenance

### 1. Regular Updates

```bash
#!/bin/bash
# update-production.sh

# Backup current deployment
docker tag family-agents:prod family-agents:backup-$(date +%Y%m%d)

# Pull latest changes
git pull origin main

# Build new image
docker build -f docker/Dockerfile -t family-agents:prod .

# Restart services (zero-downtime with load balancer)
docker-compose -f docker-compose.prod.yml up -d --no-deps family-agents

# Verify deployment
curl -f http://localhost:3000/health || exit 1

echo "Deployment successful"
```

### 2. Performance Monitoring

Set up regular performance reviews:

- **Weekly**: Review error rates and response times
- **Monthly**: Analyze usage patterns and resource utilization
- **Quarterly**: Capacity planning and scaling decisions

### 3. Security Audits

- **Monthly**: Review access logs and security alerts
- **Quarterly**: Update dependencies and security patches
- **Annually**: Full security audit and penetration testing

This production deployment guide ensures your Family-Connection AI Agents run securely, reliably, and efficiently in production environments while maintaining the highest standards for family data protection.