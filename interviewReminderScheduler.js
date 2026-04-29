/**
 * Interview Reminder Cron Job Scheduler
 * Scheduled to run every hour using native setInterval
 * Start with: pm2 start ecosystem.config.js --only interview-reminder-cron
 */

require('dotenv').config();
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const runInterviewReminderCron = require('./src/jobs/interviewReminderCron');

// Function to calculate milliseconds until next hour
function msUntilNextHour() {
  const now = dayjs().tz('Asia/Kolkata');
  const nextHour = now.clone().add(1, 'hour').startOf('hour');
  return nextHour.diff(now);
}

// Start the cron job
console.log('🚀 Interview Reminder Cron Job Scheduler Started');
console.log(`⏰ Scheduled to run every hour at minute 0`);
console.log(`📍 Timezone: Asia/Kolkata`);
console.log(`⏳ Engine: Native Node.js (no external cron package)\n`);

// Schedule the cron job to run at the start of each hour
let cronTimeout;

async function scheduleCronJob() {
  const now = dayjs().tz('Asia/Kolkata');
  const nextHour = now.clone().add(1, 'hour').startOf('hour');
  const msToWait = nextHour.diff(now);

  console.log(`⏱️  Next cron execution at: ${nextHour.format('YYYY-MM-DD HH:mm:ss')}`);

  cronTimeout = setTimeout(async () => {
    const timestamp = dayjs().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
    console.log(`\n────────────────────────────────────────────────────`);
    console.log(`Cron execution triggered at: ${timestamp}`);
    console.log(`────────────────────────────────────────────────────`);
    
    try {
      await runInterviewReminderCron();
    } catch (err) {
      console.error('Error running cron job:', err);
    }

    // Schedule next execution
    scheduleCronJob();
  }, msToWait);
}

// Start scheduling
scheduleCronJob();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping Interview Reminder Cron Job');
  if (cronTimeout) clearTimeout(cronTimeout);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Stopping Interview Reminder Cron Job');
  if (cronTimeout) clearTimeout(cronTimeout);
  process.exit(0);
});

// Keep process alive
setInterval(() => {}, 1000);
