// ⚠️  LEGACY: PM2 Configuration (Deprecated)
//
// This PM2 configuration is deprecated in favor of Docker-based deployment.
// The new deployment uses Docker containers with better resource management,
// health checks, and zero-downtime deployments.
//
// For new deployments, use:
// - Docker Compose: docker compose up -d
// - GitHub Actions: Automatic Docker-based CI/CD
//
// This file is kept for backward compatibility and local development only.
// For production, use the Docker setup in scripts/setup-hetzner-docker.sh

module.exports = {
  apps: [
    {
      name: 'familexyz-backend',
      script: 'pnpm',
      args: 'start',
      cwd: '/opt/familexyz/current',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/opt/familexyz/logs/err.log',
      out_file: '/opt/familexyz/logs/out.log',
      log_file: '/opt/familexyz/logs/combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};