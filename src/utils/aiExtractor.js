const { GoogleGenerativeAI } = require("@google/generative-ai");
const apiKey = process.env.GEMINI_API_KEY;
let genAI = new GoogleGenerativeAI(apiKey);

async function extractResumeUsingAI(text) {

  const prompt = `
Extract structured resume data ONLY AS PURE JSON.
❗ NO markdown.
❗ NO code blocks.
❗ Return ONLY valid JSON.

VERY IMPORTANT EDUCATION RULES:
- Always separate "degree" and "field_of_study".
- If resume says “Bachelor of Engineering in X”, extract:
    degree: "Bachelor's Degree"
    field_of_study: "X"
- If it says “B.E in X”, extract field_of_study: "X"
- If it says “BTech in X”, extract field_of_study: "X"
- If it says “Diploma in X”, extract:
    degree: "Diploma"
    field_of_study: "X"
- NEVER leave field_of_study empty when “in” + branch exists.

RESULT RULES:
- If “CGPA: X/Y”, extract:
    result_format: "CGPA"
    result: "X"
- If “CGPA X.Y”, extract:
    result_format: "CGPA"
    result: "X.Y"
- If “Percentage: X”, extract:
    result_format: "Percentage"
    result: "X"
- If “X%”, extract:
    result_format: "Percentage"
    result: "X"
    
AWARDS RULE:
- Anything under "Awards", "Achievements", "Recognitions" should be extracted as a certificate.
- Extract:
    certificate_type: "Award"
    certificate_title: <full award name>
    date: <award date> (convert to YYYY-MM format)
- DO NOT miss any awards section.

NATIONALITY RULE:
- If resume contains “Nationality: Indian” or similar, extract it as:
    nationality: "Indian"
- If nationality is mentioned anywhere in text, ALWAYS include it in personal_details.

TEXT:
${text}

Return JSON EXACTLY in this structure:
{
  "personal_details": {
    "first_name": "",
    "last_name": "",
    "email": "",
    "phone": "",
    "address": "",
    "city": "",
    "state": "",
    "country": "",
    "nationality": "",
    "date_of_birth": ""
  },
  "job_role": "",
  "summary": "",
  "education": [
    {
      "education_type": "",
      "degree": "",
      "field_of_study": "",
      "institution_name": "",
      "university_name": "",
      "start_year": "",
      "end_year": "",
      "currently_pursuing": false,
      "result_format": "",
      "result": ""
    }
  ],
  "work_experience": [
    {
      "company_name": "",
      "job_title": "",
      "start_date": "",
      "end_date": "",
      "currently_working_here": false,
      "description": ""
    }
  ],
  "projects": [
    {
      "project_title": "",
      "description": "",
      "roles_responsibilities": "",
      "start_date": "",
      "end_date": "",
      "currently_working": false
    }
  ],
  "skills": [
    {
      "skill_name": "",
      "skill_level": ""
    }
  ],
  "links": [
    {
      "link_type": "",
      "url": "",
      "description": ""
    }
  ],
  "certificates": [
    {
      "certificate_type": "",
      "certificate_title": "",
      "domain": "",
      "certificate_provided_by": "",
      "date": "",
      "description": "",
      "file_url": "",
      "file_type": ""
    }
  ]
}`;
  while (true) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const result = await model.generateContent(prompt);
      const response = await result.response;

      let content = response.text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      return JSON.parse(content);

    } catch (err) {
      console.log(`Error `, err);
      console.error("AI extraction failed.");
      throw new Error("AI extraction failed: " + err.message);
    }
  }
}

module.exports = { extractResumeUsingAI };
