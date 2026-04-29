const axios = require('axios');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const CRON_API_ENDPOINT = `${API_BASE_URL}/mock-interview/interviews-starting-in-2-hours`;

/**
 * Cron job to fetch interviews starting in 2 hours and send notifications
 * Runs every hour
 */
const runInterviewReminderCron = async () => {
  const timestamp = dayjs().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
  
  try {
    console.log(`\n[${timestamp}] ⏰ Interview Reminder Cron Job Started`);
    
    const response = await axios.get(CRON_API_ENDPOINT, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const { success, count, message, data } = response.data;

    if (success) {
      console.log(`[${timestamp}] ✅ Cron Job Completed Successfully`);
      console.log(`[${timestamp}] 📊 Details: ${message}`);
      
      if (data && data.length > 0) {
        console.log(`[${timestamp}] 📋 Interview(s) Found:`);
        data.forEach((interview, index) => {
          console.log(`  ${index + 1}. ID: ${interview.interview_schedule_id} | Candidate: ${interview.candidate_email} | Interviewer: ${interview.interviewer_email}`);
          console.log(`     Time: ${interview.formatted_start_time}`);
          console.log(`     Status: Emails Sent ✓`);
        });
      } else {
        console.log(`[${timestamp}] ℹ️  No interviews found in the next 2 hours`);
      }
    } else {
      console.error(`[${timestamp}] ❌ Cron Job Failed`);
      console.error(`[${timestamp}] Error: ${response.data.message}`);
    }

  } catch (error) {
    const timestamp = dayjs().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
    console.error(`[${timestamp}] ❌ Cron Job Error:`);
    
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error(`  No response received: ${error.message}`);
      console.error(`  Endpoint: ${CRON_API_ENDPOINT}`);
    } else {
      console.error(`  Error: ${error.message}`);
    }
  }
};

module.exports = runInterviewReminderCron;
