const InterviewerReview = require("../models/interviewerReview");
const CandidateReview = require("../models/candidateReview");
const InterviewSchedule = require("../models/interviewSchedule");
const BankDetails = require("../models/bankDetails");

exports.create = async (req, res) => {
  try {
    const data = req.body;
    const interviewer_id = req.user.user_id;

    if (!interviewer_id) {
      return res.status(403).json({ message: "Invalid user. Access denied" })
    }


    // Fields that MUST exist in the payload
    const requiredFields = [
      "interview_schedule_id",
      "communication_skills",
      "technical_knowledge",
      "problem_solving_analytical_skills",
      "relevant_experience_skills",
      "adaptability_learning_ability",
      "cultural_team_fit",
      "overall_impression",
      "final_comments",
      "final_recommendation",
      "communication_skills_rating",
      "technical_knowledge_rating",
      "problem_solving_analytical_skills_rating",
      "relevant_experience_skills_rating",
      "adaptability_learning_ability_rating",
      "cultural_team_fit_rating",
      "overall_impression_rating"
    ];

    // Check if all required fields exist and for the ratings the values are in the range of 1-5
    for (const field of requiredFields) {
      if (!data[field]) {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
      if (field.endsWith('rating') && (data[field] < 1 || data[field] > 5)) {
        return res.status(400).json({ message: "Rating value Cannot be less than 1 or greater than 5" });
      }
    }

    const candidateInfo = await InterviewSchedule.query()
      .where({ interview_schedule_id: data.interview_schedule_id })
      .select('candidate_id')
      .first();

    if (!candidateInfo) {
      return res.status(400).json({ message: "Invalid Candidate ID" })
    }

    const candidate_id = candidateInfo.candidate_id;

    // Check if review already exists for this candidate & schedule
    const exists = await CandidateReview
      .query()
      .findOne({ candidate_id, interview_schedule_id: data.interview_schedule_id });

    if (exists) {
      return res.status(400).json({
        message: "Review already exists for this interview"
      });
    }

    // Insert new record
    const newRecord = await CandidateReview.query().insert({
      ...data,
      interviewer_id,
      candidate_id
    });

    return res.status(201).json(newRecord);

  } catch (err) {
    return res.status(500).json({ message: "Error creating candidate review" });
  }
};

exports.getByUser = async (req, res) => {
  try {
    const interviewer_id = req.user.user_id;

    const list = await InterviewerReview.query()
      .where({ interviewer_id })
      .orderBy("created_at", "desc");

    return res.status(200).json(list);

  } catch (err) {
    return res.status(500).json({
      message: "Error fetching interviewer reviews"
    });
  }
};


exports.getById = async (req, res) => {
  try {
    const interviewer_id = req.user.user_id;
    const { id } = req.params; // interviewer_review_id

    const record = await InterviewerReview.query().findOne({
      interviewer_id,
      interviewer_review_id: id
    });

    if (!record) {
      return res.status(404).json({ message: "Interviewer review not found" });
    }

    return res.status(200).json(record);

  } catch (err) {
    return res.status(500).json({
      message: "Error fetching interviewer review"
    });
  }
};

exports.userHasBankDetails = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    if (!user_id) {
      return res.status(403).json({ message: "Invalid user. Access denied" });
    }

    const record = await BankDetails.query().where({ user_id }).first();
    return res.status(200).json({ hasBankDetails: record ? true : false });
  } catch (err) {
    console.error("Error checking bank details: ", err);
    return res.status(500).json({ message: "Error checking bank details" });
  }
}
