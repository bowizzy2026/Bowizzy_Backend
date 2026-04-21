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
      max_tokens: 4096,
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

// ── Slim context builder ──────────────────────────────────────────────────────

function buildContext(resumeData, chatAnswers) {
  const { personal_details, projects, work_experience, certificates, education, technical_summary } = resumeData;
  const pd = personal_details || {};
  const lines = [];

  lines.push("=== PERSONAL DETAILS ===");
  lines.push(`Name: ${[pd.first_name, pd.middle_name, pd.last_name].filter(Boolean).join(" ")}`);
  if (pd.email) lines.push(`Email: ${pd.email}`);
  if (pd.mobile_number) lines.push(`Phone: ${pd.mobile_number}`);
  if (pd.city || pd.state || pd.country)
    lines.push(`Location: ${[pd.city, pd.state, pd.country].filter(Boolean).join(", ")}`);
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
      lines.push(`Project ${i + 1}: ${p.project_title} (${p.project_type || "N/A"})`);
      lines.push(`  Duration: ${p.start_date || "N/A"} to ${p.currently_working ? "Present" : (p.end_date || "N/A")}`);
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
    const rawSummary = technical_summary.summary.replace(/<[^>]+>/g, "").trim();
    if (rawSummary) {
      lines.push("\n=== EXISTING TECHNICAL SUMMARY ===");
      lines.push(rawSummary);
    }
  }

  return lines.join("\n");
}

// ── Controller ────────────────────────────────────────────────────────────────

exports.generateResume = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const {
      chat_answers = {},
      session_id,
      retained_project_ids,
      retained_experience_ids,
      retained_education_ids,
    } = req.body;

    const keepAllProjects    = retained_project_ids    == null;
    const keepAllExperiences = retained_experience_ids == null;
    const keepAllEducation   = retained_education_ids  == null;

    const retainedProjectSet    = new Set((retained_project_ids    || []).map(Number));
    const retainedExperienceSet = new Set((retained_experience_ids || []).map(Number));
    const retainedEducationSet  = new Set((retained_education_ids  || []).map(Number));

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

    const allProjects    = getValue(projects, []);
    const allExperiences = getValue(workExperiences, []);
    const allEducation   = getValue(education, []);

    // ── 2. Filter to only retained records ───────────────────────────────────
    const retainedProjects = keepAllProjects
      ? allProjects
      : allProjects.filter((p) => retainedProjectSet.has(p.project_id));

    const retainedExperiences = keepAllExperiences
      ? allExperiences
      : allExperiences.filter((e) => retainedExperienceSet.has(e.experience_id));

    const retainedEducation = keepAllEducation
      ? allEducation
      : allEducation.filter((e) => retainedEducationSet.has(e.education_id));

    // ── 3. Parse chat_answers for brand-new items via Groq ────────────────────
    const hasAdditional =
      chat_answers.additional_projects ||
      chat_answers.additional_experience ||
      chat_answers.additional_education;

    let newProjects    = [];
    let newExperiences = [];
    let newEducation   = [];

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

      newProjects    = (parsed.new_projects    || []).filter((p) => p.project_title);
      newExperiences = (parsed.new_experiences || []).filter((e) => e.company_name || e.job_title);
      newEducation   = (parsed.new_education   || []).filter((e) => e.institution_name || e.education_type);
    }

    // ── 4. Merge retained DB records + newly parsed records ───────────────────
    const mergedProjects    = [...retainedProjects,    ...newProjects];
    const mergedExperiences = [...retainedExperiences, ...newExperiences];
    const mergedEducation   = [...retainedEducation,   ...newEducation];

    const resumeData = {
      personal_details: getValue(personalDetails),
      projects: mergedProjects,
      work_experience: {
        job_role: getValue(jobRole)?.job_role ?? null,
        experiences: mergedExperiences,
      },
      certificates: getValue(certificates, []),
      links: getValue(links, []),
      technical_summary: getValue(technicalSummary),
      education: mergedEducation,
    };

    // ── 5. Build context string for Groq ──────────────────────────────────────
    const context = buildContext(resumeData, chat_answers);

    const systemPrompt = `You are an expert resume writer and career coach.
Your task is to enhance resume content based on the candidate's information.
Always respond with valid JSON only — no markdown, no explanation, no extra text.
Write professionally, concisely, and in first person where appropriate.`;

    // ── 6. Build explicit lists for projects and experiences ──────────────────
    const projectListForPrompt = mergedProjects.map((p, i) =>
      `${i + 1}. "${p.project_title}" (project_id: ${p.project_id ?? "null"})`
    ).join("\n");

    const expListForPrompt = mergedExperiences.map((e, i) =>
      `${i + 1}. "${e.job_title} at ${e.company_name}" (experience_id: ${e.experience_id ?? "null"})`
    ).join("\n");

    // ── 7. Single combined Groq enhancement call ──────────────────────────────
    const combinedPrompt = `Based on the following candidate information, generate all three of the following in a single response.

---

TASK 1 — TECHNICAL SUMMARY:
Write a compelling technical summary in a single paragraph (4-6 sentences).
Highlight key skills, experience level, domain expertise, and career objective.

---

TASK 2 — PROJECTS:
Enhance the description for EVERY project listed below into professional bullet points.
You MUST include ALL ${mergedProjects.length} project(s) — do not skip any.

Projects to enhance:
${projectListForPrompt || "None"}

Rules:
- 3-5 enhanced_description bullets per project, each starting with a strong action verb
- 2-3 roles_responsibilities bullets per project
- Use the project details from === PROJECTS === in the candidate info below

---

TASK 3 — WORK EXPERIENCE:
Enhance the description for EVERY work experience listed below into professional bullet points.
You MUST include ALL ${mergedExperiences.length} experience(s) — do not skip any.

Experiences to enhance:
${expListForPrompt || "None"}

Rules:
- 3-5 enhanced_description bullets per experience, each starting with a strong action verb
- Highlight responsibilities, achievements, and technologies used

---

Respond with this exact JSON structure and nothing else:
{
  "technical_summary_generated": "<paragraph here>",
  "projects_generated": [
    {
      "project_id": <number or null>,
      "project_title": "<title>",
      "enhanced_description": ["bullet 1", "bullet 2", "bullet 3"],
      "roles_responsibilities": ["bullet 1", "bullet 2"]
    }
  ],
  "work_experience_generated": [
    {
      "experience_id": <number or null>,
      "job_title": "<title>",
      "company_name": "<company>",
      "enhanced_description": ["bullet 1", "bullet 2", "bullet 3"]
    }
  ]
}

CANDIDATE INFO:
${context}`;

    let enhancedRaw = "";
    try {
      enhancedRaw = await callGroq(systemPrompt, combinedPrompt);
    } catch (err) {
      console.error("[enhancement] Groq call failed:", err);
    }

    let enhancedData = {
      technical_summary_generated: null,
      projects_generated: [],
      work_experience_generated: [],
    };

    try {
      enhancedData = parseGroqJSON(enhancedRaw);
    } catch (err) {
      console.error("[enhancement] JSON parse failed. Raw:", enhancedRaw);
    }

    // ── 8. Build slim response — only what the frontend needs ─────────────────
    const projectsOut = mergedProjects.map((p) => {
      const pTitle = p.project_title?.toLowerCase() ?? "";
      const match = (enhancedData.projects_generated || []).find((g) => {
        if (p.project_id && g.project_id && Number(g.project_id) === Number(p.project_id)) return true;
        const gTitle = g.project_title?.toLowerCase() ?? "";
        return gTitle === pTitle || gTitle.includes(pTitle) || pTitle.includes(gTitle);
      });
      return {
        project_id:             p.project_id       ?? null,
        project_title:          p.project_title,
        start_date:             p.start_date        ?? null,
        end_date:               p.end_date          ?? null,
        currently_working:      p.currently_working ?? false,
        enhanced_description:   match?.enhanced_description   ?? [],
        roles_responsibilities: match?.roles_responsibilities ?? [],
      };
    });

    const experiencesOut = mergedExperiences.map((e) => {
      const eCompany = e.company_name?.toLowerCase() ?? "";
      const eTitle   = e.job_title?.toLowerCase()   ?? "";
      const match = (enhancedData.work_experience_generated || []).find((g) => {
        if (e.experience_id && g.experience_id) return Number(g.experience_id) === Number(e.experience_id);
        const gCompany = g.company_name?.toLowerCase() ?? "";
        const gTitle   = g.job_title?.toLowerCase()   ?? "";
        const companyMatch = gCompany === eCompany || gCompany.includes(eCompany) || eCompany.includes(gCompany);
        const titleMatch   = gTitle   === eTitle   || gTitle.includes(eTitle)     || eTitle.includes(gTitle);
        return companyMatch && titleMatch;
      });
      return {
        experience_id:          e.experience_id         ?? null,
        job_title:              e.job_title,
        company_name:           e.company_name,
        employment_type:        e.employment_type        ?? null,
        location:               e.location               ?? null,
        work_mode:              e.work_mode              ?? null,
        start_date:             e.start_date             ?? null,
        end_date:               e.end_date               ?? null,
        currently_working_here: e.currently_working_here ?? false,
        enhanced_description:   match?.enhanced_description ?? [],
      };
    });

    const educationOut = mergedEducation.map((e) => ({
      education_id:       e.education_id       ?? null,
      education_type:     e.education_type     ?? null,
      institution_name:   e.institution_name   ?? null,
      degree:             e.degree             ?? null,
      field_of_study:     e.field_of_study     ?? null,
      university_name:    e.university_name    ?? null,
      start_year:         e.start_year         ?? null,
      end_year:           e.end_year           ?? null,
      currently_pursuing: e.currently_pursuing ?? false,
      result_format:      e.result_format      ?? null,
      result:             e.result             ?? null,
    }));

    const finalPayload = {
      personal_details:            resumeData.personal_details,
      technical_summary_generated: enhancedData.technical_summary_generated ?? null,
      projects:                    projectsOut,
      work_experience: {
        experiences: experiencesOut,
      },
      education: educationOut,
    };

    // ── 9. Save to AiSession.infoJson ─────────────────────────────────────────
    if (session_id) {
      try {
        const session = await AiSession.query().findById(session_id);
        if (session) {
          await AiSession.query().findById(session_id).patch({ infoJson: finalPayload });
        }
      } catch (err) {
        console.error("Failed to save infoJson to session:", err);
      }
    }

    // ── 10. Return response ───────────────────────────────────────────────────
    return res.json({
      message: "Resume generated successfully",
      data: finalPayload,
    });
  } catch (err) {
    console.error("Error generating resume:", err);
    res.status(500).json({ message: "Error generating resume content" });
  }
};