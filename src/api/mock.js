const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const QUESTIONS = [
  ["Please introduce yourself and summarize your background.", "HR"],
  ["Tell me about a project from your resume and your role in it.", "Project"],
  ["What was the biggest technical challenge you faced, and how did you solve it?", "Technical"],
  ["Which skill on your resume are you strongest in, and why?", "Technical"],
  ["Describe a time you disagreed with a teammate. How did you handle it?", "Behavioral"],
];

const fail = (config, status, message) =>
  Promise.reject({ config, message, response: { status, data: { message } } });

// Backend ke bina testing ke liye nakli server
export default async function mockAdapter(config) {
  await delay(700);
  const url = config.url || "";
  const method = (config.method || "get").toLowerCase();
  let body = {};
  if (typeof config.data === "string") { try { body = JSON.parse(config.data); } catch { /* ignore */ } }
  const ok = (data, status = 200) => ({ data, status, statusText: "OK", headers: {}, config });

  const users = load("mock_users", []);
  const interviews = load("mock_interviews", []);

  // ---------- Auth ----------
  if (url === "/api/auth/register" && method === "post") {
    const email = (body.email || "").toLowerCase();
    if (users.some((u) => u.email === email)) return fail(config, 400, "User already exists");
    const user = { id: "u" + Date.now(), name: body.name, email, password: body.password };
    save("mock_users", [...users, user]);
    return ok({ message: "Registration successful", user: { id: user.id, name: user.name, email } }, 201);
  }

  if (url === "/api/auth/login" && method === "post") {
    const email = (body.email || "").toLowerCase();
    const u = users.find((x) => x.email === email && x.password === body.password);
    if (!u) return fail(config, 401, "Invalid email or password");
    return ok({ message: "Login successful", token: "mock-token", user: { id: u.id, name: u.name, email } });
  }

  // ---------- Resume ----------
  if (url === "/api/resume/upload" && method === "post") {
    const skills = ["React", "JavaScript", "Node.js", "MongoDB", "Problem Solving"];
    return ok({
      message: "Resume uploaded and analyzed successfully",
      resume: { _id: "mock-resume", skills },
      analysis: { skills },
    }, 201);
  }

  // ---------- Interview ----------
  if (url === "/api/interview/generate" && method === "post") {
    const stamp = Date.now();
    const iv = {
      _id: "iv" + stamp,
      status: "Generated",
      createdAt: new Date().toISOString(),
      questions: QUESTIONS.map(([question, category], i) => ({
        _id: `q${stamp}${i}`, question, category, difficulty: "Medium", answer: "", score: null, feedback: "",
      })),
    };
    save("mock_interviews", [iv, ...interviews]);
    return ok({ message: "Interview questions generated successfully", interview: iv }, 201);
  }

  if (url === "/api/interview/my" && method === "get") {
    return ok(interviews.map((iv) => {
      const scored = iv.questions.filter((q) => typeof q.score === "number");
      const avg = scored.length ? scored.reduce((s, q) => s + q.score, 0) / scored.length : 0;
      return { id: iv._id, role: "Mock Interview", date: iv.createdAt.slice(0, 10), score: +avg.toFixed(1), status: iv.status };
    }));
  }

  if (url === "/api/interview/answer" && method === "post") {
    const iv = interviews.find((x) => x._id === body.interviewId);
    if (!iv) return fail(config, 404, "Interview not found");
    const q = iv.questions.find((x) => x._id === body.questionId);
    if (!q) return fail(config, 404, "Question not found");
    if (q.answer) return fail(config, 409, "Answer has already been submitted");
    q.answer = body.answer;
    q.score = 6 + Math.floor(Math.random() * 4); // 6 se 9
    q.feedback = "A clear answer. Adding a concrete example and a measurable result would make it even stronger.";
    iv.status = iv.questions.every((x) => x.answer) ? "Completed" : "In Progress";
    save("mock_interviews", interviews);
    return ok({
      message: "Answer evaluated successfully",
      result: { question: q.question, answer: q.answer, score: q.score, feedback: q.feedback },
      interviewStatus: iv.status,
    });
  }

  const getOne = url.match(/^\/api\/interview\/([^/]+)$/);
  if (getOne && method === "get") {
    const iv = interviews.find((x) => x._id === getOne[1]);
    return iv ? ok({ message: "Interview fetched", interview: iv }) : fail(config, 404, "Interview not found");
  }
    const delOne = url.match(/^\/api\/interview\/([^/]+)$/);
  if (delOne && method === "delete") {
    const next = interviews.filter((x) => x._id !== delOne[1]);
    if (next.length === interviews.length) return fail(config, 404, "Interview not found");
    save("mock_interviews", next);
    return ok({ message: "Interview deleted successfully" });
  }

  // ---------- Report ----------
  if (url === "/api/report/generate" && method === "post") {
    const iv = interviews.find((x) => x._id === body.interviewId);
    if (!iv) return fail(config, 404, "Interview not found");
    if (!iv.questions.every((q) => q.answer)) return fail(config, 400, "Please answer all interview questions first");
    const avg = iv.questions.reduce((s, q) => s + q.score, 0) / iv.questions.length;
    return ok({
      message: "Final interview report generated successfully",
      report: {
        totalQuestions: iv.questions.length,
        answeredQuestions: iv.questions.length,
        averageScore: +avg.toFixed(2),
        overallFeedback: "You show a good understanding of your project and the concepts behind it. Your answers could be more structured and backed by specific examples. With a little practice, you can become a very strong candidate.",
        strengths: ["Good understanding of core technical concepts.", "Explained your project clearly.", "Confident and polite communication."],
        improvements: ["Add concrete examples and numbers to your answers.", "Use the STAR method (Situation, Task, Action, Result).", "Go deeper when describing how you handled challenges."],
        recommendation: "Practice two more mock interviews focusing on structured answers.",
      },
    }, 201);
  }

  return fail(config, 404, `Mock server: no route for ${method.toUpperCase()} ${url}`);
}