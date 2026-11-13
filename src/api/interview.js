import api from "./axios";

// Dashboard ki list. Backend mein GET /api/interview/my banane par chalegi, tab tak khali list.
export const getInterviewsApi = async () => {
  try {
    const { data } = await api.get("/api/interview/my");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

// Gemini se questions banata hai
export const createInterviewApi = async (resumeId) => {
  const { data } = await api.post("/api/interview/generate", { resumeId });
  return data.interview;
};

export const getInterviewApi = async (id) => {
  const { data } = await api.get(`/api/interview/${id}`);
  return data.interview;
};

export const submitAnswerApi = async (interviewId, questionId, answer) => {
  const { data } = await api.post("/api/interview/answer", { interviewId, questionId, answer });
  return data;
};

const toList = (v) => (Array.isArray(v) ? v : v ? [String(v)] : []);

export const getFeedbackApi = async (id) => {
  // 1) Report banao (pehle se bana ho to wahi milta hai)
  const { data: repRes } = await api.post("/api/report/generate", { interviewId: id });
  const report = repRes.report;

  // 2) Question-wise details
  const { data: ivRes } = await api.get(`/api/interview/${id}`);
  const qs = ivRes.interview.questions;
  const scores = qs.map((q) => q.score || 0);

  // Skill radar: category ke hisaab se average
  const byCat = {};
  qs.forEach((q) => {
    const c = q.category || "General";
    (byCat[c] = byCat[c] || []).push(q.score || 0);
  });
  let skills = Object.entries(byCat).map(([name, arr]) => ({
    name,
    score: +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1),
  }));
  if (skills.length < 3) {
    skills = qs.map((q, i) => ({ name: `Q${i + 1}`, score: q.score || 0 }));
  }

  return {
    overall: report.averageScore,
    answered: `${report.answeredQuestions}/${report.totalQuestions}`,
    best: Math.max(...scores),
    lowest: Math.min(...scores),
    summary: report.overallFeedback,
    strengths: toList(report.strengths),
    improvements: toList(report.improvements),
    recommendation: typeof report.recommendation === "string" ? report.recommendation : "",
    skills,
    questions: qs.map((q) => ({
      q: q.question, a: q.answer, score: q.score || 0, feedback: q.feedback, category: q.category,
    })),
    transcript: qs.flatMap((q) => [
      { role: "ai", text: q.question },
      { role: "me", text: q.answer || "(not answered)" },
    ]),
    
  };
  
};
export const deleteInterviewApi = async (id) => {
  await api.delete(`/api/interview/${id}`);
};