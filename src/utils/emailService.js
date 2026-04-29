const mailServiceUrl = "https://bowizzy-mail-service-mzkf9n5p4-bowizzys-projects.vercel.app/api/send-email";
const bypassHeader = "clRAc3bjRwnrpqGZgac1fy7zaDUmwp7u";

// Send email to candidate about upcoming interview
const sendCandidateInterviewEmail = async (candidateEmail, interviewData) => {
  const {
    startTime,
    endTime,
    interviewerName,
    meetingLink,
    jobRole,
    experience,
    interviewMode
  } = interviewData;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          font-size: 28px;
          margin-bottom: 10px;
          font-weight: 700;
        }
        .header p {
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
          color: #333;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #667eea;
        }
        .interview-details {
          background-color: #f8f9ff;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 30px 0;
          border-radius: 4px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin: 12px 0;
          font-size: 14px;
        }
        .detail-label {
          font-weight: 600;
          color: #667eea;
          min-width: 120px;
        }
        .detail-value {
          color: #555;
          text-align: right;
          flex-grow: 1;
        }
        .meeting-link-section {
          text-align: center;
          margin: 30px 0;
        }
        .meeting-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 14px 40px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.3s;
        }
        .meeting-button:hover {
          transform: translateY(-2px);
        }
        .tips {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 13px;
          color: #856404;
        }
        .tips-title {
          font-weight: 600;
          margin-bottom: 8px;
        }
        .tips ul {
          margin-left: 20px;
        }
        .tips li {
          margin: 6px 0;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e0e0e0;
          font-size: 12px;
          color: #666;
        }
        .footer-text {
          margin: 8px 0;
        }
        .social-links {
          margin-top: 15px;
        }
        .social-links a {
          color: #667eea;
          text-decoration: none;
          margin: 0 10px;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Interview Scheduled</h1>
          <p>Your interview is coming up soon!</p>
        </div>

        <div class="content">
          <div class="greeting">Hello,</div>

          <p style="line-height: 1.6; margin-bottom: 20px;">
            Congratulations! Your interview with Bowizzy has been confirmed. Here are the details:
          </p>

          <div class="interview-details">
            <div class="detail-row">
              <span class="detail-label">📅 Date & Time:</span>
              <span class="detail-value">${startTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">⏱️ Duration:</span>
              <span class="detail-value">${endTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">👤 Interviewer:</span>
              <span class="detail-value">${interviewerName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">💼 Position:</span>
              <span class="detail-value">${jobRole || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🌐 Interview Mode:</span>
              <span class="detail-value">${interviewMode}</span>
            </div>
          </div>

          <div class="meeting-link-section">
            <p style="margin-bottom: 15px; font-size: 14px; color: #666;">
              Join the interview at:
            </p>
            <a href="${meetingLink}" class="meeting-button">Join Meeting</a>
          </div>

          <div class="tips">
            <div class="tips-title">📋 Interview Tips:</div>
            <ul>
              <li>Join 5 minutes early to test your audio and video</li>
              <li>Use a quiet, well-lit room for the interview</li>
              <li>Dress professionally</li>
              <li>Keep your resume and notepad handy</li>
              <li>Have a backup internet connection ready</li>
            </ul>
          </div>

          <p style="line-height: 1.6; margin-top: 30px; color: #666; font-size: 14px;">
            If you have any questions or need to reschedule, please contact our support team. Best of luck with your interview!
          </p>

          <p style="margin-top: 20px; font-weight: 600; color: #667eea;">
            Best regards,<br>
            The Bowizzy Team
          </p>
        </div>

        <div class="footer">
          <div class="footer-text">This is an automated message from Bowizzy. Please do not reply to this email.</div>
          <div class="footer-text">&copy; 2026 Bowizzy. All rights reserved.</div>
          <div class="social-links">
            <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a> | <a href="#">Contact Us</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch(mailServiceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-vercel-protection-bypass": bypassHeader,
      },
      body: JSON.stringify({
        to: candidateEmail,
        subject: "[Bowizzy] Your Interview is Confirmed ✓",
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mail service error: ${response.statusText}`);
    }

    return true;
  } catch (err) {
    console.error("Error sending candidate interview email:", err);
    throw err;
  }
};

// Send email to interviewer about upcoming interview
const sendInterviewerInterviewEmail = async (interviewerEmail, interviewData) => {
  const {
    startTime,
    endTime,
    candidateName,
    candidateEmail,
    meetingLink,
    jobRole,
    experience,
    interviewMode,
    resumeUrl
  } = interviewData;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        .header {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          font-size: 28px;
          margin-bottom: 10px;
          font-weight: 700;
        }
        .header p {
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
          color: #333;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #f5576c;
        }
        .interview-details {
          background-color: #fff5f7;
          border-left: 4px solid #f5576c;
          padding: 20px;
          margin: 30px 0;
          border-radius: 4px;
        }
        .candidate-info {
          background-color: #f9f9f9;
          border: 1px solid #e0e0e0;
          padding: 15px;
          margin: 20px 0;
          border-radius: 6px;
        }
        .candidate-info h3 {
          color: #f5576c;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          font-size: 13px;
        }
        .detail-label {
          font-weight: 600;
          color: #f5576c;
          min-width: 100px;
        }
        .detail-value {
          color: #555;
          text-align: right;
          flex-grow: 1;
        }
        .meeting-link-section {
          text-align: center;
          margin: 25px 0;
        }
        .meeting-button {
          display: inline-block;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 12px 35px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          transition: transform 0.3s;
        }
        .meeting-button:hover {
          transform: translateY(-2px);
        }
        .checklist {
          background-color: #e8f5e9;
          border-left: 4px solid #4caf50;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 13px;
          color: #2e7d32;
        }
        .checklist-title {
          font-weight: 600;
          margin-bottom: 8px;
        }
        .checklist ul {
          margin-left: 20px;
        }
        .checklist li {
          margin: 6px 0;
        }
        .resume-link {
          display: inline-block;
          background-color: #f0f0f0;
          padding: 10px 15px;
          border-radius: 4px;
          text-decoration: none;
          color: #f5576c;
          font-weight: 600;
          margin: 10px 0;
          font-size: 13px;
          border: 1px solid #e0e0e0;
        }
        .resume-link:hover {
          background-color: #e0e0e0;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e0e0e0;
          font-size: 12px;
          color: #666;
        }
        .footer-text {
          margin: 8px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📞 Interview Reminder</h1>
          <p>You have an upcoming interview scheduled</p>
        </div>

        <div class="content">
          <div class="greeting">Hello,</div>

          <p style="line-height: 1.6; margin-bottom: 20px;">
            This is a reminder that you have an interview scheduled. Please review the details below:
          </p>

          <div class="interview-details">
            <div class="detail-row">
              <span class="detail-label">📅 Date & Time:</span>
              <span class="detail-value">${startTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">⏱️ Duration:</span>
              <span class="detail-value">${endTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🌐 Mode:</span>
              <span class="detail-value">${interviewMode}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">💼 Position:</span>
              <span class="detail-value">${jobRole || 'N/A'}</span>
            </div>
          </div>

          <div class="candidate-info">
            <h3>👥 Candidate Information</h3>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${candidateName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${candidateEmail}</span>
            </div>
            ${experience ? `
            <div class="detail-row">
              <span class="detail-label">Experience:</span>
              <span class="detail-value">${experience}</span>
            </div>
            ` : ''}
            ${resumeUrl ? `
            <div style="margin-top: 12px;">
              <a href="${resumeUrl}" class="resume-link">📄 View Resume</a>
            </div>
            ` : ''}
          </div>

          <div class="meeting-link-section">
            <p style="margin-bottom: 15px; font-size: 14px; color: #666;">
              Meeting Link:
            </p>
            <a href="${meetingLink}" class="meeting-button">Join Meeting</a>
          </div>

          <div class="checklist">
            <div class="checklist-title">✅ Pre-Interview Checklist:</div>
            <ul>
              <li>Review candidate's resume and background</li>
              <li>Prepare interview questions</li>
              <li>Test your audio and video setup</li>
              <li>Join 5 minutes before the scheduled time</li>
              <li>Have candidate's details handy</li>
              <li>Ensure good lighting and professional background</li>
            </ul>
          </div>

          <p style="line-height: 1.6; margin-top: 30px; color: #666; font-size: 14px;">
            Thank you for being part of the Bowizzy interviewer community. Your professionalism helps us maintain the highest standards of recruitment.
          </p>

          <p style="margin-top: 20px; font-weight: 600; color: #f5576c;">
            Best regards,<br>
            The Bowizzy Team
          </p>
        </div>

        <div class="footer">
          <div class="footer-text">This is an automated message from Bowizzy. Please do not reply to this email.</div>
          <div class="footer-text">&copy; 2026 Bowizzy. All rights reserved.</div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch(mailServiceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-vercel-protection-bypass": bypassHeader,
      },
      body: JSON.stringify({
        to: interviewerEmail,
        subject: "[Bowizzy] Interview Reminder - Scheduled Today",
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mail service error: ${response.statusText}`);
    }

    return true;
  } catch (err) {
    console.error("Error sending interviewer interview email:", err);
    throw err;
  }
};

module.exports = {
  sendCandidateInterviewEmail,
  sendInterviewerInterviewEmail
};
