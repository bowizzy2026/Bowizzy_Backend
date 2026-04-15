const PersonalDetails = require("../models/PersonalDetails");
const Project = require("../models/Project");
const WorkExperience = require("../models/WorkExperience");
const JobRole = require("../models/JobRole");
const Certificate = require("../models/Certificate");
const Link = require("../models/Link");
const TechnicalSummary = require("../models/TechnicalSummary");
const Education = require("../models/Education");
const AiSession = require("../models/AiSession");

const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// ── Groq helper ───────────────────────────────────────────────────────────────

async function callGroq(systemPrompt, userPrompt) {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function parseGroqJSON(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

// ── Context builder ───────────────────────────────────────────────────────────

function buildContext(resumeData, chatAnswers) {
  const { personal_details, projects, work_experience, certificates, education, technical_summary } = resumeData;
  const pd = personal_details || {};
  const lines = [];

  lines.push("=== PERSONAL DETAILS ===");
  lines.push(`Name: ${[pd.first_name, pd.middle_name, pd.last_name].filter(Boolean).join(" ")}`);
  if (pd.email) lines.push(`Email: ${pd.email}`);
  if (pd.mobile_number) lines.push(`Phone: ${pd.mobile_number}`);
  if (pd.city || pd.state || pd.country) lines.push(`Location: ${[pd.city, pd.state, pd.country].filter(Boolean).join(", ")}`);
  if (pd.linkedin_url) lines.push(`LinkedIn: ${pd.linkedin_url}`);
  if (pd.about) lines.push(`About: ${pd.about}`);
  if (pd.languages_known?.length) lines.push(`Languages: ${pd.languages_known.join(", ")}`);

  if (chatAnswers && Object.keys(chatAnswers).length > 0) {
    lines.push("\n=== USER-PROVIDED INFORMATION (from chat) ===");
    if (chatAnswers.about_yourself) lines.push(`About Yourself: ${chatAnswers.about_yourself}`);
    if (chatAnswers.additional_projects) lines.push(`Additional Projects Mentioned: ${chatAnswers.additional_projects}`);
    if (chatAnswers.additional_experience) lines.push(`Additional Experience Mentioned: ${chatAnswers.additional_experience}`);
    if (chatAnswers.additional_education) lines.push(`Additional Education/Certifications Mentioned: ${chatAnswers.additional_education}`);
  }

  if (projects?.length) {
    lines.push("\n=== PROJECTS ===");
    projects.forEach((p, i) => {
      lines.push(`Project ${i + 1}: ${p.project_title} (${p.project_type})`);
      lines.push(`  Duration: ${p.start_date} to ${p.currently_working ? "Present" : p.end_date}`);
      if (p.description) lines.push(`  Description: ${p.description.replace(/<[^>]+>/g, "")}`);
      if (p.roles_responsibilities) lines.push(`  Roles & Responsibilities: ${p.roles_responsibilities.replace(/<[^>]+>/g, "")}`);
    });
  }

  if (work_experience?.experiences?.length) {
    lines.push("\n=== WORK EXPERIENCE ===");
    if (work_experience.job_role) lines.push(`Job Role: ${work_experience.job_role}`);
    work_experience.experiences.forEach((e, i) => {
      lines.push(`Experience ${i + 1}: ${e.job_title} at ${e.company_name}`);
      lines.push(`  Type: ${e.employment_type}, Mode: ${e.work_mode}, Location: ${e.location}`);
      lines.push(`  Duration: ${e.start_date} to ${e.currently_working_here ? "Present" : e.end_date}`);
      if (e.description) lines.push(`  Description: ${e.description.replace(/<[^>]+>/g, "")}`);
    });
  }

  if (education?.length) {
    lines.push("\n=== EDUCATION ===");
    education.forEach((e, i) => {
      const label = e.degree ? `${e.degree} in ${e.field_of_study}` : e.education_type.toUpperCase();
      lines.push(`Education ${i + 1}: ${label} at ${e.institution_name}`);
      if (e.university_name) lines.push(`  University: ${e.university_name}`);
      if (e.end_year) lines.push(`  Completed: ${e.end_year}`);
      if (e.result) lines.push(`  Result: ${e.result} (${e.result_format})`);
    });
  }

  if (certificates?.length) {
    lines.push("\n=== CERTIFICATES ===");
    certificates.forEach((c, i) => {
      lines.push(`Certificate ${i + 1}: ${c.certificate_title} (${c.certificate_type})`);
      lines.push(`  Provided by: ${c.certificate_provided_by}, Domain: ${c.domain}`);
      if (c.date) lines.push(`  Date: ${c.date}`);
    });
  }

  if (technical_summary?.summary) {
    lines.push("\n=== EXISTING TECHNICAL SUMMARY ===");
    lines.push(technical_summary.summary);
  }

  return lines.join("\n");
}

// ── Controller ────────────────────────────────────────────────────────────────

/**
 * POST /generate-resume
 *
 * Body (all optional):
 * {
 *   "chat_answers": {
 *     "about_yourself": "...",
 *     "additional_projects": "...",
 *     "additional_experience": "...",
 *     "additional_education": "..."
 *   }
 * }
 *
 * - Parses chat_answers via Groq into structured records (in-memory only, no DB insert)
 * - Generates technical summary, enhanced descriptions for all projects & experiences
 * - Returns full resume-data shape with AI-generated fields merged in
 */
exports.generateResume = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { chat_answers = {}, session_id } = req.body;

    // ── 1. Fetch all existing resume data in parallel ─────────────────────────
    const [
      personalDetails,
      projects,
      workExperiences,
      jobRole,
      certificates,
      links,
      technicalSummary,
      education,
    ] = await Promise.allSettled([
      PersonalDetails.query().findOne({ user_id }),
      Project.query().where({ user_id }).orderBy("project_id", "asc"),
      WorkExperience.query().where({ user_id }).orderBy("experience_id", "asc"),
      JobRole.query().findOne({ user_id }),
      Certificate.query().where({ user_id }),
      Link.query().where({ user_id }).orderBy("link_id", "asc"),
      TechnicalSummary.query().findOne({ user_id }),
      Education.query().where({ user_id }).orderBy("education_id", "asc"),
    ]);

    const getValue = (result, fallback = null) =>
      result.status === "fulfilled" ? result.value ?? fallback : fallback;

    const resumeData = {
      personal_details: getValue(personalDetails),
      projects: getValue(projects, []),
      work_experience: {
        job_role: getValue(jobRole)?.job_role ?? null,
        experiences: getValue(workExperiences, []),
      },
      certificates: getValue(certificates, []),
      links: getValue(links, []),
      technical_summary: getValue(technicalSummary),
      education: getValue(education, []),
    };

    // ── 2. Parse chat_answers into structured DB records via Groq ─────────────
    // Only run if the user mentioned additional items
    const hasAdditional =
      chat_answers.additional_projects ||
      chat_answers.additional_experience ||
      chat_answers.additional_education;

    let newlyInsertedProjects = [];
    let newlyInsertedExperiences = [];
    let newlyInsertedEducation = [];

    if (hasAdditional) {
      const parseSystemPrompt = `You are a data extraction assistant.
Extract structured data from free-form user text and return valid JSON only.
No markdown, no explanation, no extra text.
If a field is not mentioned or unclear, set it to null.
Dates must be in YYYY-MM-DD format if a full date is given, or YYYY-MM if only month/year, or null if not mentioned.`;

      const parsePrompt = `Extract structured resume data from the user's free-form descriptions below.

Additional Projects: "${chat_answers.additional_projects || ""}"
Additional Work Experience: "${chat_answers.additional_experience || ""}"
Additional Education/Certifications: "${chat_answers.additional_education || ""}"

Return JSON in this exact format:
{
  "new_projects": [
    {
      "project_title": "<string or null>",
      "project_type": "<Professional|Academic|Personal or null>",
      "start_date": "<YYYY-MM-DD or null>",
      "end_date": "<YYYY-MM-DD or null>",
      "currently_working": false,
      "description": "<string or null>",
      "roles_responsibilities": "<string or null>"
    }
  ],
  "new_experiences": [
    {
      "company_name": "<string or null>",
      "job_title": "<string or null>",
      "employment_type": "<Full-time|Part-time|Contract|Internship or null>",
      "location": "<string or null>",
      "work_mode": "<On-site|Remote|Hybrid or null>",
      "start_date": "<YYYY-MM-DD or null>",
      "end_date": "<YYYY-MM-DD or null>",
      "currently_working_here": false,
      "description": "<string or null>"
    }
  ],
  "new_education": [
    {
      "education_type": "<sslc|puc|higher|diploma|certification or null>",
      "institution_name": "<string or null>",
      "board_type": "<string or null>",
      "degree": "<string or null>",
      "field_of_study": "<string or null>",
      "university_name": "<string or null>",
      "start_year": "<YYYY-MM or null>",
      "end_year": "<YYYY-MM or null>",
      "currently_pursuing": false,
      "result_format": "<cgpa|percentage or null>",
      "result": "<string or null>"
    }
  ]
}

Only include entries where the user actually mentioned something. Return empty arrays [] if nothing was mentioned for that category.`;

      const parseResult = await callGroq(parseSystemPrompt, parsePrompt);

      let parsed = { new_projects: [], new_experiences: [], new_education: [] };
      try {
        parsed = parseGroqJSON(parseResult);
      } catch (err) {
        console.error("Failed to parse additional data from Groq:", err);
      }

      // Collect parsed records (no DB insert — returned in response only)
      newlyInsertedProjects = (parsed.new_projects || []).filter((p) => p.project_title);
      newlyInsertedExperiences = (parsed.new_experiences || []).filter((e) => e.company_name || e.job_title);
      newlyInsertedEducation = (parsed.new_education || []).filter((e) => e.institution_name || e.education_type);

      // Merge into resumeData so Groq enhancement has full context
      resumeData.projects = [...resumeData.projects, ...newlyInsertedProjects];
      resumeData.work_experience.experiences = [
        ...resumeData.work_experience.experiences,
        ...newlyInsertedExperiences,
      ];
      resumeData.education = [...resumeData.education, ...newlyInsertedEducation];
    }

    // ── 3. Build shared context string (now includes newly inserted records) ──
    const context = buildContext(resumeData, chat_answers);

    const systemPrompt = `You are an expert resume writer and career coach.
Your task is to enhance resume content based on the candidate's information.
Always respond with valid JSON only — no markdown, no explanation, no extra text.
Write professionally, concisely, and in first person where appropriate.`;

    // ── 4. Define all 4 Groq enhancement prompts ─────────────────────────────

    const technicalSummaryPrompt = `Based on the following candidate information, write a compelling technical summary in a single paragraph (4-6 sentences).
It should highlight their key skills, experience level, domain expertise, and career objective.
Respond with JSON in this exact format: { "technical_summary_generated": "your paragraph here" }

CANDIDATE INFO:
${context}`;

    const projectsPrompt = `Based on the following candidate information, enhance the description for each project into professional bullet points (3-5 bullets per project).
Each bullet should start with a strong action verb and highlight impact and technologies used.
Include ALL projects listed in the candidate info.
Respond with JSON in this exact format:
{
  "projects_generated": [
    {
      "project_id": <number>,
      "project_title": "<title>",
      "enhanced_description": ["bullet 1", "bullet 2", "bullet 3"]
    }
  ]
}

CANDIDATE INFO:
${context}`;

    const workExpPrompt = `Based on the following candidate information, enhance the description for each work experience into professional bullet points (3-5 bullets per experience).
Each bullet should start with a strong action verb and highlight responsibilities, achievements, and technologies.
Include ALL experiences listed in the candidate info.
Respond with JSON in this exact format:
{
  "work_experience_generated": [
    {
      "experience_id": <number>,
      "job_title": "<title>",
      "company_name": "<company>",
      "enhanced_description": ["bullet 1", "bullet 2", "bullet 3"]
    }
  ]
}

CANDIDATE INFO:
${context}`;

    const enhancedSummaryPrompt = `Based on the following candidate information, write an enhanced and more detailed technical summary in a single paragraph (5-7 sentences).
This should be more comprehensive — include specific technologies, domains, soft skills, and career trajectory.
Respond with JSON in this exact format: { "enhanced_technical_summary": "your paragraph here" }

CANDIDATE INFO:
${context}`;

    // ── 5. Fire all 4 Groq enhancement calls in parallel ──────────────────────
    const [
      technicalSummaryResult,
      projectsResult,
      workExpResult,
      enhancedSummaryResult,
    ] = await Promise.allSettled([
      callGroq(systemPrompt, technicalSummaryPrompt),
      callGroq(systemPrompt, projectsPrompt),
      callGroq(systemPrompt, workExpPrompt),
      callGroq(systemPrompt, enhancedSummaryPrompt),
    ]);

    const safeparse = (result, fallback, label) => {
      if (result.status !== "fulfilled") {
        console.error(`[${label}] Groq call failed:`, result.reason);
        return fallback;
      }
      try {
        return parseGroqJSON(result.value);
      } catch (err) {
        console.error(`[${label}] JSON parse failed. Raw:`, result.value);
        return fallback;
      }
    };

    const summaryData  = safeparse(technicalSummaryResult, { technical_summary_generated: null }, "technicalSummary");
    const projectsData = safeparse(projectsResult,         { projects_generated: [] },            "projects");
    const workExpData  = safeparse(workExpResult,           { work_experience_generated: [] },     "workExp");
    const enhancedData = safeparse(enhancedSummaryResult,  { enhanced_technical_summary: null },  "enhancedSummary");

    // ── 6. Merge enhanced_description onto every project (existing + new) ─────
    const projectsWithGenerated = resumeData.projects.map((p) => {
      const match = (projectsData.projects_generated || []).find((g) =>
        p.project_id ? g.project_id === p.project_id : g.project_title?.toLowerCase() === p.project_title?.toLowerCase()
      );
      return {
        ...p,
        enhanced_description: match?.enhanced_description ?? null,
      };
    });

    // ── 7. Merge enhanced_description onto every experience (existing + new) ──
    const experiencesWithGenerated = resumeData.work_experience.experiences.map((e) => {
      const match = (workExpData.work_experience_generated || []).find((g) =>
        e.experience_id ? g.experience_id === e.experience_id
          : g.company_name?.toLowerCase() === e.company_name?.toLowerCase() &&
            g.job_title?.toLowerCase() === e.job_title?.toLowerCase()
      );
      return {
        ...e,
        enhanced_description: match?.enhanced_description ?? null,
      };
    });

    // ── 8. Build final payload ────────────────────────────────────────────────
    const finalPayload = {
      personal_details: resumeData.personal_details,
      projects: projectsWithGenerated,
      work_experience: {
        job_role: resumeData.work_experience.job_role,
        experiences: experiencesWithGenerated,
      },
      certificates: resumeData.certificates,
      links: resumeData.links,
      technical_summary: resumeData.technical_summary,
      education: resumeData.education,
      technical_summary_generated: summaryData.technical_summary_generated ?? null,
      enhanced_technical_summary: enhancedData.enhanced_technical_summary ?? null,
    };

    // ── 9. Save full generated data to AiSession.infoJson (no other DB writes) ─
    if (session_id) {
      try {
        const session = await AiSession.query().findById(session_id);
        if (session) {
          await AiSession.query().findById(session_id).patch({
            infoJson: finalPayload,
          });
        }
      } catch (err) {
        console.error("Failed to save infoJson to session:", err);
        // Non-fatal — still return the response even if session save fails
      }
    }

    // ── 10. Return final merged response ─────────────────────────────────────
    return res.json({
      message: "Resume data retrieved successfully",
      data: finalPayload,
    });
  } catch (err) {
    console.error("Error generating resume:", err);
    res.status(500).json({ message: "Error generating resume content" });
  }
};