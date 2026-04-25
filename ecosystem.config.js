'use strict';

const path = require('path');

const appDir = __dirname;
const logDir = path.join(appDir, '.pm2', 'logs');

module.exports = {
  apps: [
    {
      name: 'arbitration-backend',
      script: 'src/index.js',
      cwd: appDir,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART || '220M',
      restart_delay: 5000,
      exp_backoff_restart_delay: 200,
      kill_timeout: 5000,
      listen_timeout: 10000,
      min_uptime: 5000,
      merge_logs: true,
      time: true,
      out_file: path.join(logDir, 'arbitration-backend-out.log'),
      error_file: path.join(logDir, 'arbitration-backend-error.log'),
      env: {
        NODE_ENV: 'production',
        PORT: '3000'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: '3000'
      }
    }
  ]
};
