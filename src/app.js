const express = require("express");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;

const cors = require("cors");
const morgan = require("morgan");
const db = require("./db/knex");

app.disable("etag");
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Middlewares
app.use(cors({ origin: ["https://api.bowizzy.com", "http://localhost:5173", "https://bowizzy.com"] }));
app.use(express.json());
app.use(morgan("dev"));

// Routes
const authRouter = require("./routes/auth");
const personalDetailsRouter = require("./routes/personalDetails");
const educationRouter = require("./routes/education");
const workExperienceRouter = require("./routes/workExperience");
const projectRouter = require("./routes/projects");
const skillsRouter = require("./routes/skills");
const linksRouter = require("./routes/links");
const certificatesRouter = require("./routes/certificates");
const resumeTemplatesRouter = require("./routes/resumeTemplates");
const locationRouter = require("./routes/location");
const dashboardRouter = require("./routes/dashboard");
const interviewSlotRouter = require("./routes/interviewSlot");
const interviewScheduleRouter = require("./routes/interviewSchedule");
const technicalSummaryRouter = require("./routes/technicalSummary");
const userSubscriptionRouter = require("./routes/userSubscription");
const resumeRouter = require("./routes/resume");
const candidateReviewRouter = require("./routes/candidateReview");
const interviewerReviewRouter = require("./routes/interviewerReview");
const userVerificationRequest = require("./routes/userVerificationRequest");
const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");
const creditsRouter = require("./routes/credits");
app.use("/payment", require("./routes/payment"));
app.use("/api/terms", require("./routes/termsConditionRoutes"));

app.use("/", adminRouter);
app.use("/", userRouter);
app.use("/", creditsRouter);
app.use("/auth", authRouter);
app.use("/", personalDetailsRouter);
app.use("/", educationRouter);
app.use("/", workExperienceRouter);
app.use("/", projectRouter);
app.use("/", skillsRouter);
app.use("/", linksRouter);
app.use("/", certificatesRouter);
app.use("/", resumeTemplatesRouter);
app.use("/", locationRouter);
app.use("/", dashboardRouter);
app.use("/", interviewSlotRouter);
app.use("/", interviewScheduleRouter);
app.use("/", technicalSummaryRouter);
app.use("/", userSubscriptionRouter);
app.use("/", resumeRouter);
app.use("/", candidateReviewRouter);
app.use("/", interviewerReviewRouter);
app.use("/", userVerificationRequest);

app.get("/", (req, res) => {
  res.send("Node backend is working!");
});

app.get("/test", async (req, res) => {
  try {
    const { google } = require("googleapis");
    const fs = require("fs");
    const path = require("path");

    // The real Workspace user the service account will impersonate
    const IMPERSONATE_USER = "contactus@wizzybox.com";

    // Load service account credentials
    const serviceAccountPath = path.join(
      __dirname,
      "..",
      "bowizzy-ai-assistant-84d029637a02.json"
    );
    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf8")
    );

    // Create JWT client with domain-wide delegation (subject = impersonated user)
    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/meetings.space.created",
      ],
      subject: IMPERSONATE_USER, // 👈 impersonate a real Workspace user
    });

    const calendar = google.calendar({ version: "v3", auth });
    const meet = google.meet({ version: "v2", auth });

    // Generate date as today at 6 PM to 6:30 PM
    const now = new Date();
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0, 0).toISOString();
    const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 30, 0, 0).toISOString();

    // Create a Google Meet space
    const meetSpace = await meet.spaces.create({
      requestBody: {},
    });

    const meetUri = meetSpace.data.meetingUri;

    const eventBody = {
      summary: "Google Meet - Bowizzy Interview",
      description: "Interview scheduled via Bowizzy",
      start: {
        dateTime: startTime,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endTime,
        timeZone: "Asia/Kolkata",
      },
      conferenceData: {
        entryPoints: [
          {
            entryPointType: "video",
            uri: meetUri,
            label: "Google Meet",
          },
        ],
        conferenceSolution: {
          key: {
            type: "hangoutsMeet", // 👈 fixed: was "key", should be "type"
          },
          name: "Google Meet",
        },
      },
    };

    // Create calendar event under the impersonated user's calendar
    const event = await calendar.events.insert({
      calendarId: IMPERSONATE_USER, // 👈 use the impersonated user's calendar, not service account email
      conferenceDataVersion: 1,     // 👈 required to attach conferenceData
      resource: eventBody,
    });

    res.json({
      message: "Google Meet scheduled successfully",
      eventId: event.data.id,
      eventSummary: event.data.summary,
      startTime: event.data.start.dateTime,
      endTime: event.data.end.dateTime,
      meetLink: meetUri,
      calendarLink: event.data.htmlLink,
    });
  } catch (error) {
    console.error("Error scheduling Google Meet:", error.message);
    console.error("Full error:", error);
    res.status(500).json({
      error: "Failed to schedule Google Meet",
      message: error.message,
      details: error.errors ? error.errors[0]?.message : null,
    });
  }
});

db.raw("SELECT 1")
  .then(() => {
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });