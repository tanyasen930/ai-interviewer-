import { Link } from "react-router-dom";
import { Sparkles, FileText, Video, BarChart3, TrendingUp, ArrowRight } from "lucide-react";

const FEATURES = [
  [FileText, "Resume-based questions", "Upload your resume as a PDF. The AI reads it and asks questions about your own skills and projects."],
  [Video, "Voice and camera interview", "Talk to an AI interviewer on a live call. Answer by speaking, just like a real interview."],
  [BarChart3, "Instant detailed feedback", "Get an overall score, strengths, weak areas and clear feedback for every answer."],
  [TrendingUp, "Track your progress", "Every interview is saved, so you can see how your score improves over time."],
];

const STEPS = [
  ["Upload your resume", "Add your resume as a PDF. It takes less than a minute."],
  ["Take the interview", "Answer questions by voice or text. Each answer is scored by AI."],
  ["Review your feedback", "See your scores, skill chart and clear tips to improve."],
];

export default function Landing() {
  return (
    <>
      <section className="l-hero fade-up">
        <span className="l-badge"><Sparkles size={14} /> AI-powered mock interviews</span>
        <h1>Practice interviews that <span className="hl">match your resume</span></h1>
        <p>Upload your resume and get interviewed by an AI. Receive honest, detailed feedback and walk into your real interview with confidence.</p>
        <div className="l-cta">
          <Link to="/signup" className="btn">Get started free <ArrowRight size={17} /></Link>
          <Link to="/login" className="btn ghost">Log in</Link>
        </div>
      </section>

      <section className="l-section fade-up d1">
        <h2>Everything you need to prepare</h2>
        <p className="muted">One platform from resume to feedback.</p>
        <div className="features">
          {FEATURES.map(([Icon, title, desc]) => (
            <div className="card" key={title}>
              <div className="step-ico"><Icon size={21} /></div>
              <h3>{title}</h3>
              <div className="muted">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="l-section fade-up d2">
        <h2>How it works</h2>
        <p className="muted">Three simple steps.</p>
        <div className="how">
          {STEPS.map(([title, desc], i) => (
            <div className="card" key={title}>
              <div className="num">{i + 1}</div>
              <h3>{title}</h3>
              <div className="muted">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-band fade-up">
        <h2>Ready for your next interview?</h2>
        <p>Create a free account and start practicing in minutes.</p>
        <Link to="/signup" className="btn">Create your account <ArrowRight size={17} /></Link>
      </section>

      <p className="l-foot">© 2026 AI Interviewer</p>
    </>
  );
}