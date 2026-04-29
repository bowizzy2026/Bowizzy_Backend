module.exports = {
  apps: [
    {
      name: 'interview-reminder-cron',
      script: './interviewReminderScheduler.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        API_BASE_URL: 'http://localhost:3000'
      },
      env_production: {
        NODE_ENV: 'production',
        API_BASE_URL: 'https://api.bowizzy.com'
      },
      // Logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/cron-error.log',
      out_file: './logs/cron-out.log',
      log_file: './logs/cron-combined.log',
      
      // Restart policies
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      max_memory_restart: '500M',
      
      // Process Management
      max_restarts: 10,
      min_uptime: '10s',
      autorestart: true,
      
      // Graceful shutdown
      kill_timeout: 5000,
      
      // Environment
      dotenv: '.env',
      
      // Cron-specific settings
      cron_restart: '0 0 * * *' // Restart cron job daily at midnight (optional)
    }
  ],

  // Global deployment config
  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git+https://github.com/kishor2121/bowizzy-backend.git',
      path: '/var/www/bowizzy-backend',
      'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js --env production'
    },
    staging: {
      user: 'root',
      host: 'your-staging-ip',
      ref: 'origin/develop',
      repo: 'git+https://github.com/kishor2121/bowizzy-backend.git',
      path: '/var/www/bowizzy-backend-staging',
      'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js'
    }
  }
};
