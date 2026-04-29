/**
 * Interview Reminder Cron Job Scheduler
 * Scheduled to run every hour
 * Start with: pm2 start ecosystem.config.js --only interview-reminder-cron
 */

require('dotenv').config();
const cron = require('node-cron');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const runInterviewReminderCron = require('./interviewReminderCron');

// Start the cron job
console.log('🚀 Interview Reminder Cron Job Scheduler Started');
console.log(`⏰ Scheduled to run every hour at minute 0`);
console.log(`📍 Timezone: Asia/Kolkata`);

// Run every hour at minute 0 (00:00, 01:00, 02:00, etc.)
const cronJob = cron.schedule('0 * * * *', async () => {
  const timestamp = dayjs().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
  console.log(`\n────────────────────────────────────────────────────`);
  console.log(`Cron execution triggered at: ${timestamp}`);
  console.log(`────────────────────────────────────────────────────`);
  
  await runInterviewReminderCron();
}, {
  scheduled: true,
  timezone: 'Asia/Kolkata'
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping Interview Reminder Cron Job');
  cronJob.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Stopping Interview Reminder Cron Job');
  cronJob.stop();
  process.exit(0);
});

// Keep process alive
setInterval(() => {}, 1000);
