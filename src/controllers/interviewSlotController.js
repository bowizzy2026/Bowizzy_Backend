// controllers/interviewSlotController.js
const InterviewSlot = require("../models/interviewSlot");
const UserCredits = require("../models/UserCredits");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);
const { google } = require("googleapis");
const auth = new google.auth.GoogleAuth({
  keyFile: "bowizzy-489805-fd2e496ca7f0.json",
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

exports.createMeet = async (req, res) => {
  try {
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: "v3", auth: authClient });
    const event = {
      summary: "Mock Interview with Bowizzy",
      description: "This is a scheduled mock interview session.",
      start: {
        dateTime: "2026-03-12T10:00:00",
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: "2026-03-12T11:00:00",
        timeZone: "Asia/Kolkata",
      },
      conferenceData: {
        createRequest: {
          requestId: "meet-" + Date.now(),
          conferenceSolutionKey: {
            type: "googleMeet",
          },
        },
      },
    }
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });
    // Defensive: check for conferenceData and entryPoints
    let meetLink = null;
    if (
      response.data.conferenceData &&
      Array.isArray(response.data.conferenceData.entryPoints) &&
      response.data.conferenceData.entryPoints.length > 0
    ) {
      meetLink = response.data.conferenceData.entryPoints[0].uri;
    }
    return res.status(200).json({
      message: "Google Calendar event created successfully",
      eventLink: response.data.htmlLink,
      meetLink,
    });
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    return res.status(500).json({ message: "Error creating Google Calendar event" });
  }
}
// statuses considered blocking
const ACTIVE_STATUSES = ['open', 'confirmed'];

const MONTH_MAP = {
  1: 'JN', 2: 'FB', 3: 'MR', 4: 'AP', 5: 'MY', 6: 'JU',
  7: 'JY', 8: 'AG', 9: 'ST', 10: 'OT', 11: 'NV', 12: 'DC',
};

const COMPANY_PREFIX = 'BOWIZZY';

const generateInterviewCodePrefix = (jobRole, candidateDate, userCreatedAt, userDob) => {
  // Use user's personal date_of_birth (YYYY-MM-DD) for MMDD if present, otherwise fallback to candidateDate (YYYY-MM-DD)
  const sourceDate = userDob || candidateDate;
  const [year, month, day] = sourceDate.split('-');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');

  // Use user's created_at if available, otherwise fallback to now (IST)
  const created = userCreatedAt ? dayjs(userCreatedAt).tz('Asia/Kolkata') : dayjs().tz('Asia/Kolkata');
  const createdDDMMYY = created.format('DDMMYY');

  // Format: BOWIZZY + <personal-MMDD> + <userCreated-DDMMYY>
  return `${COMPANY_PREFIX}${mm}${dd}${createdDDMMYY}`;
}

// Returns { conflict: true, reason, rows } or { conflict: false }
async function checkCandidateConflictFull(trx, candidateId, startTimeUtc, endTimeUtc) {
  // normalize to minute precision and ISO strings
  const startISO = dayjs(startTimeUtc).startOf('minute').toISOString();
  const endISO = dayjs(endTimeUtc).startOf('minute').toISOString();

  // return true if any row has an active (blocking) status
  const hasActive = (rows) => {
    if (!rows) return false;
    if (!Array.isArray(rows)) rows = [rows];
    return rows.some(r => ACTIVE_STATUSES.includes(String(r.interview_status)));
  };

  // OVERLAP: any candidate-created slot that overlaps the proposed range
  // Query ALL overlapping rows (no status filter), then decide by status
  const slotOverlaps = await trx('interview_slots')
    .select('*')
    .where('candidate_id', candidateId)
    .andWhere(function () {
      this.whereRaw('ts_range && tstzrange(?, ?, \'[)\')', [startISO, endISO]);
    });

  if (slotOverlaps && slotOverlaps.length > 0) {
    if (hasActive(slotOverlaps)) {
      return { conflict: true, reason: 'slot_overlap', rows: slotOverlaps };
    }
    // else all overlapping slots are non-blocking (cancelled/expired/completed) -> allow
  }

  // OVERLAP: any schedule that overlaps the proposed range
  const scheduleOverlaps = await trx('interview_schedules')
    .select('*')
    .where('candidate_id', candidateId)
    .andWhere(function () {
      this.whereRaw('ts_range && tstzrange(?, ?, \'[)\')', [startISO, endISO]);
    });

  if (scheduleOverlaps && scheduleOverlaps.length > 0) {
    if (hasActive(scheduleOverlaps)) {
      return { conflict: true, reason: 'schedule_overlap', rows: scheduleOverlaps };
    }
    // else all overlapping schedules are non-blocking -> allow
  }

  // SAME-DAY + SAME-START-TIME (IST local day)
  const localStart = dayjs(startTimeUtc).tz('Asia/Kolkata');
  const dayStartUtcISO = localStart.startOf('day').utc().toISOString();
  const dayEndUtcISO = localStart.endOf('day').utc().toISOString();
  const startISOeq = dayjs(startTimeUtc).startOf('minute').toISOString();

  // slots with exact same start_time_utc within same local day
  const slotSameDayRows = await trx('interview_slots')
    .select('*')
    .where('candidate_id', candidateId)
    .andWhere('start_time_utc', startISOeq)
    .andWhereBetween('start_time_utc', [dayStartUtcISO, dayEndUtcISO]);

  if (slotSameDayRows && slotSameDayRows.length > 0) {
    if (hasActive(slotSameDayRows)) {
      return { conflict: true, reason: 'slot_same_day_time', rows: slotSameDayRows };
    }
  }

  // schedules with exact same start_time_utc within same local day
  const scheduleSameDayRows = await trx('interview_schedules')
    .select('*')
    .where('candidate_id', candidateId)
    .andWhere('start_time_utc', startISOeq)
    .andWhereBetween('start_time_utc', [dayStartUtcISO, dayEndUtcISO]);

  if (scheduleSameDayRows && scheduleSameDayRows.length > 0) {
    if (hasActive(scheduleSameDayRows)) {
      return { conflict: true, reason: 'schedule_same_day_time', rows: scheduleSameDayRows };
    }
  }

  return { conflict: false };
}

// Function to create new interview slot
exports.create = async (req, res) => {
  try {
    const user_id = req.user && req.user.user_id;
    const data = req.body || {};
    const { mode } = req.query;

    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    if (!data.raw_date_string || !data.raw_time_string || !data.job_role || !mode || !data.experience || !data.skills) {
      return res.status(400).json({ message: 'Interview informations like date, time, job role, interview mode,.... are required' });
    }

    // validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.raw_date_string)) {
      return res.status(400).json({ message: 'raw_date_string must be YYYY-MM-DD' });
    }

    // validate time format HH:mm (24-hour)
    if (!/^[0-2]\d:[0-5]\d$/.test(data.raw_time_string)) {
      return res.status(400).json({ message: 'raw_time_string must be HH:mm (24-hour)' });
    }

    // Date time parsing format: "YYYY-MM-DD HH:mm"
    const localDateTime = `${data.raw_date_string} ${data.raw_time_string}`;
    const local = dayjs.tz(localDateTime, 'YYYY-MM-DD HH:mm', 'Asia/Kolkata').startOf('minute');
    if (!local.isValid()) {
      return res.status(400).json({ message: 'Invalid date/time. Expected YYYY-MM-DD and HH:mm (24-hour)' });
    }

    // Convert to JS Date (UTC) for DB
    const start_time_utc = local.toDate();
    const end_time_utc = local.add(1, 'hour').toDate();

    let skills = null;
    if (data.skills) {
      if (Array.isArray(data.skills)) skills = data.skills;
      else if (typeof data.skills === 'string') {
        skills = data.skills.includes(',') ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [data.skills.trim()];
      }
    }

    const jobrole = data.job_role;

    const knex = InterviewSlot.knex();

    const created = await knex.transaction(async trx => {
      // Acquire a transaction-scoped advisory lock for this candidate id to avoid races.
      // This serializes concurrent slot-creation attempts for the same candidate.
      // pg_advisory_xact_lock accepts a signed 64-bit integer; candidate ids (int) are fine.
      await trx.raw('SELECT pg_advisory_xact_lock(?);', [user_id]);

      // fetch user's created_at and personal date_of_birth from relevant tables (within transaction, after acquiring lock)
      const userRow = await trx('users').select('created_at').where('user_id', user_id).first();
      const personalRow = await trx('personal_details').select('date_of_birth').where('user_id', user_id).first();

      // generate interviewCodePrefix from personal date_of_birth DDMM (fallback to candidate date) + user's created_at
      const interviewCodePrefix = generateInterviewCodePrefix(jobrole, data.raw_date_string, userRow && userRow.created_at, personalRow && personalRow.date_of_birth);

      // run conflict checks under the same transaction
      const conflict = await checkCandidateConflictFull(trx, user_id, start_time_utc, end_time_utc);
      if (conflict.conflict) {
        const e = new Error('Candidate conflict: ' + conflict.reason);
        e.status = 409;
        throw e;
      }

      const insertPayload = {
        interview_code_prefix: interviewCodePrefix,
        candidate_id: user_id,
        job_role: data.job_role,
        interview_mode: mode,
        experience: data.experience,
        skills,
        resume_url: data.resume_url || null,
        start_time_utc,
        end_time_utc,
      };

      // plain insert; any database constraint failures (unique, not null, etc.) will surface as errors
      const inserted = await trx('interview_slots').insert(insertPayload).returning('*');
      const createdRow = inserted && (inserted.rows ? inserted.rows[0] : inserted[0] || inserted);
      return createdRow;
    });

    return res.status(201).json(created);
  } catch (err) {
    if (err && err.status === 409) return res.status(409).json({ message: err.message });
    return res.status(500).json({ message: 'Error creating interview slot' });
  }
};


exports.updatePaymentInfo = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { slot_id } = req.params;
    const { paid_amount } = req.body;

    if (!paid_amount) {
      return res.status(400).json({ message: "paid_amount is required" });
    }

    const patchPayload = {
      is_payment_done: true,
      paid_amount: parseFloat(paid_amount),
      updated_at: InterviewSlot.knex().raw("now()")
    };
    console.log(patchPayload)
    const updated = await InterviewSlot.query()
      .patch(patchPayload)
      .where({
        interview_slot_id: slot_id,
        candidate_id: user_id
      })
      .returning('*');
    console.log(updated)
    // If successfully updates, returns array of updated object else undefined
    const updatedRow = Array.isArray(updated) ? updated[0] : updated;

    if (!updatedRow) {
      return res.status(404).json({ message: "Interview slot not found" });
    }

    return res.status(200).json(updatedRow);

  } catch (err) {
    return res.status(500).json({ message: "Error updating interview slot payment info" });
  }
};



exports.getAll = async (req, res) => {
  try {
    const list = await InterviewSlot.query()
      .orderBy("start_time_utc", "asc");

    return res.status(200).json(list);

  } catch (err) {
    return res.status(500).json({ message: "Error fetching interview slots" });
  }
};

exports.getByUser = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const list = await InterviewSlot.query()
      .where({ candidate_id: user_id })
      .orderBy("start_time_utc", "asc");

    return res.status(200).json(list);

  } catch (err) {
    return res.status(500).json({ message: "Error fetching interview slots" });
  }
};


exports.getById = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;

    const record = await InterviewSlot.query().findOne({
      candidate_id: user_id,
      interview_slot_id: id
    });

    if (!record) {
      return res.status(404).json({ message: "Interview slot not found" });
    }

    // Check if interview is confirmed and has a schedule with meeting_link
    let schedule = null;
    if (record.interview_status === 'confirmed') {
      schedule = await InterviewSlot.query()
        .knex()('interview_schedules')
        .where({
          interview_slot_id: id,
          candidate_id: user_id
        })
        .first();
    }

    return res.status(200).json({
      ...record,
      meeting_link: schedule ? schedule.meeting_link : null,
      meeting_type: schedule ? schedule.meeting_type : null,
      interview_schedule_id: schedule ? schedule.interview_schedule_id : null
    });

  } catch (err) {
    return res.status(500).json({ message: "Error fetching interview slot" });
  }
};

exports.cancel = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;

    const slot = await InterviewSlot.query().findOne({
      candidate_id: user_id,
      interview_slot_id: id
    });

    if (!slot) {
      return res.status(404).json({ message: "Interview slot not found" });
    }

    const knex = InterviewSlot.knex();
    const status = String(slot.interview_status);

    // Calculate refund based on cancellation timing and paid_amount
    // Get the time difference between now and slot creation
    const now = dayjs();
    const createdAt = dayjs(slot.created_at);
    const hoursDifference = now.diff(createdAt, 'hour', true);

    // Determine refund percentage
    let refundPercentage = 0;
    if (hoursDifference <= 3) {
      // Within 3 hours: Full refund (100%)
      refundPercentage = 100;
    } else {
      // After 3 hours: Half refund (50%)
      refundPercentage = 50;
    }

    // Calculate credits to refund from paid_amount
    // Exchange rate: 1 RS = 2 credits
    const paidAmount = slot.paid_amount || 0;
    const creditsFromPayment = Math.floor(paidAmount * 2); // Convert rupees to credits
    const creditsToRefund = Math.floor((creditsFromPayment * refundPercentage) / 100);

    if (status === "open") {
      let updated_slot;
      let refundInfo = null;

      await knex.transaction(async (trx) => {
        // Cancel in interview_slot
        updated_slot = await trx("interview_slots")
          .where({
            interview_slot_id: slot.interview_slot_id,
            candidate_id: user_id
          })
          .update({
            interview_status: "cancelled",
            updated_at: knex.raw("now()")
          });

        // Refund credits to user if amount was paid
        if (creditsToRefund > 0) {
          // Update user_credits balance
          const userCredits = await trx('user_credits')
            .where('user_id', user_id)
            .first();

          if (userCredits) {
            // User already has credits, increment them
            await trx('user_credits')
              .where('user_id', user_id)
              .increment('credits', creditsToRefund);
          } else {
            // Create new credit record for user
            await trx('user_credits').insert({
              user_id,
              credits: creditsToRefund
            });
          }

          // Create credit transaction history record
          await trx('credit_transactions').insert({
            user_id,
            credits: creditsToRefund,
            transaction_type: 'interview_slot_cancellation',
            reference_id: slot.interview_slot_id,
            description: `Credits refunded for cancelled interview slot (${refundPercentage}% refund) - ${slot.job_role}`,
            created_at: knex.raw('now()'),
            updated_at: knex.raw('now()')
          });

          refundInfo = {
            paid_amount_rupees: paidAmount,
            credits_from_payment: creditsFromPayment,
            refund_percentage: refundPercentage,
            credits_refunded: creditsToRefund,
            hours_from_creation: Math.round(hoursDifference * 100) / 100
          };
        }

        // Remove all saved_slots entries for this slot
        await trx("saved_slots")
          .where({ interview_slot_id: slot.interview_slot_id })
          .del();
      });

      return res.status(200).json({
        message: "Interview got cancelled successfully",
        updated_slot: updated_slot,
        refund_info: refundInfo
      });
    }

    else if (status === "confirmed") {
      let updated_slot;
      let updated_schedule;
      let refundInfo = null;

      await knex.transaction(async (trx) => {
        // Cancel in interview_slots
        updated_slot = await trx("interview_slots")
          .where({
            interview_slot_id: slot.interview_slot_id,
            candidate_id: user_id
          })
          .update({
            interview_status: "cancelled",
            updated_at: knex.raw("now()")
          });

        // Cancel in interview_schedules
        updated_schedule = await trx("interview_schedules")
          .where({
            interview_slot_id: slot.interview_slot_id,
            candidate_id: user_id
          })
          .update({
            interview_status: "cancelled",
            updated_at: knex.raw("now()")
          });

        // Refund credits to user if amount was paid
        if (creditsToRefund > 0) {
          // Update user_credits balance
          const userCredits = await trx('user_credits')
            .where('user_id', user_id)
            .first();

          if (userCredits) {
            // User already has credits, increment them
            await trx('user_credits')
              .where('user_id', user_id)
              .increment('credits', creditsToRefund);
          } else {
            // Create new credit record for user
            await trx('user_credits').insert({
              user_id,
              credits: creditsToRefund
            });
          }

          // Create credit transaction history record
          await trx('credit_transactions').insert({
            user_id,
            credits: creditsToRefund,
            transaction_type: 'interview_slot_cancellation',
            reference_id: slot.interview_slot_id,
            description: `Credits refunded for cancelled confirmed interview (${refundPercentage}% refund) - ${slot.job_role}`,
            created_at: knex.raw('now()'),
            updated_at: knex.raw('now()')
          });

          refundInfo = {
            paid_amount_rupees: paidAmount,
            credits_from_payment: creditsFromPayment,
            refund_percentage: refundPercentage,
            credits_refunded: creditsToRefund,
            hours_from_creation: Math.round(hoursDifference * 100) / 100
          };
        }
      });

      return res.status(200).json({
        message: "Interview got cancelled successfully",
        Updated_interview_slot: updated_slot,
        Updated_interview_schedule: updated_schedule,
        refund_info: refundInfo
      });
    }

    else {
      return res.status(400).json({
        message: "Only open or confirmed slots can be cancelled"
      });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error updating interview slot" });
  }
};



