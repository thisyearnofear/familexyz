// PM2 Configuration for rsync-based deployment (scripts/deploy.sh)
// App lives at /home/deploy/familexyz/current, env via shared/env/.env symlink
module.exports = {
  apps: [
    {
      name: 'familexyz-agent',
      script: 'pnpm',
      args: 'start',
      cwd: '/home/deploy/familexyz/current/agent',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/home/deploy/familexyz/logs/err.log',
      out_file: '/home/deploy/familexyz/logs/out.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
