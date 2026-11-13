import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Target, MessageSquare, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { getFeedbackApi } from "../api/interview";
import { errMsg } from "../api/axios";
import "../styles/room.css";

const colorFor = (v) => (v >= 8 ? "#059669" : v >= 6 ? "#d97706" : "#dc2626");

function useCountUp(target, ms = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / ms, 1);
      setV(+(target * p).toFixed(1));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function useMounted() {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 150); return () => clearTimeout(t); }, []);
  return on;
}

function Bar({ value }) {
  const on = useMounted();
  return (
    <div className="bar">
      <i style={{ width: on ? `${value * 10}%` : 0, background: colorFor(value) }} />
    </div>
  );
}

function Ring({ value }) {
  const on = useMounted();
  const n = useCountUp(value);
  const r = 54, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 130 130" width="130" height="130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="#e9eef7" strokeWidth="10" />
      <circle cx="65" cy="65" r={r} fill="none" stroke={colorFor(value)} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={on ? c * (1 - value / 10) : c} transform="rotate(-90 65 65)"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)" }} />
      <text x="65" y="62" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: 30, fontWeight: 800, fill: "var(--tx)" }}>{n}</text>
      <text x="65" y="86" textAnchor="middle" style={{ fontSize: 11, fill: "var(--muted)" }}>out of 10</text>
    </svg>
  );
}

function Stat({ label, Icon, value, text, delay }) {
  const n = useCountUp(value || 0);
  return (
    <div className="card stat" style={{ animationDelay: `${delay}s` }}>
      <div className="row-between">
        <span className="muted">{label}</span>
        <span className="stat-ico"><Icon size={17} /></span>
      </div>
      <div className="stat-val">
        {text ?? <>{n}<small>/10</small></>}
      </div>
      {text === undefined && <Bar value={value} />}
    </div>
  );
}

export default function Feedback() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("summary");
  const requested = useRef(false); // report do baar generate na ho (StrictMode)

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    getFeedbackApi(id)
      .then(setData)
      .catch((e) => setError(errMsg(e, "Could not load your feedback.")));
  }, [id]);

  if (error) {
    return (
      <div className="lobby card fade-up">
        <h3>Feedback is not ready</h3>
        <p className="muted">{error}</p>
        <button className="btn" onClick={() => navigate(`/interview/${id}`)}>Continue interview</button>
        <button className="btn ghost" style={{ marginLeft: 8 }} onClick={() => navigate("/dashboard")}>Dashboard</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="lobby card fade-up">
        <div className="orb sm" />
        <h3>Generating your report...</h3>
        <p className="muted">The AI is reviewing all your answers. This can take a few seconds.</p>
      </div>
    );
  }

  const tabs = [["summary", "Summary"], ["skills", "Skill Metrics"], ["questions", "Questions"], ["transcript", "Transcript"]];
  const radarData = data.skills.map((s) => ({ skill: s.name, score: s.score }));

  return (
    <div className="fade-up">
      <div className="fb-head">
        <button className="icon-btn" onClick={() => navigate("/dashboard")}><ArrowLeft size={18} /></button>
        <div>
          <h2 style={{ margin: 0 }}>Interview <span className="hl">Feedback</span></h2>
          <div className="muted">A detailed analysis of your performance</div>
        </div>
      </div>

      <div className="fb-top">
        <div className="card stat score-card">
          <Ring value={data.overall} />
          <div>
            <strong>Overall Score</strong>
            <div className="muted">Average across the interview</div>
          </div>
        </div>
        <Stat label="Questions Answered" Icon={MessageSquare} text={data.answered} delay={0.08} />
        <Stat label="Best Answer" Icon={Target} value={data.best} delay={0.16} />
        <Stat label="Needs Work" Icon={AlertTriangle} value={data.lowest} delay={0.24} />
      </div>

      <div className="tabs wide">
        {tabs.map(([k, l]) => (
          <button key={k} className={tab === k ? "tab active" : "tab"} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <div className="card panel" key={tab}>
        {tab === "summary" && (
          <>
            <h3>Overall Assessment</h3>
            <p className="assess">{data.summary}</p>
            <div className="two">
              <div>
                <h3 className="sec-title good-t"><CheckCircle2 size={19} /> Key Strengths</h3>
                {data.strengths.map((s, i) => (
                  <div className="pt good" key={i} style={{ animationDelay: `${i * 0.1}s` }}><b>{i + 1}</b><span>{s}</span></div>
                ))}
              </div>
              <div>
                <h3 className="sec-title warn-t"><AlertTriangle size={19} /> Areas for Improvement</h3>
                {data.improvements.map((s, i) => (
                  <div className="pt warn" key={i} style={{ animationDelay: `${i * 0.1}s` }}><b>{i + 1}</b><span>{s}</span></div>
                ))}
              </div>
            </div>
            {data.recommendation && (
              <>
                <h3 style={{ marginTop: 22 }}>Recommendation</h3>
                <p className="assess">{data.recommendation}</p>
              </>
            )}
          </>
        )}

        {tab === "skills" && (
          <div className="skills-grid">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="#dbe3f2" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar dataKey="score" stroke="#2563eb" strokeWidth={2} fill="#2563eb" fillOpacity={0.22} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div>
              {data.skills.map((s) => (
                <div className="skill" key={s.name}>
                  <div className="row-between">
                    <strong>{s.name}</strong>
                    <span style={{ color: colorFor(s.score), fontWeight: 700 }}>{s.score}/10</span>
                  </div>
                  <Bar value={s.score} />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "questions" && data.questions.map((q, i) => (
          <details className="qa" key={i}>
            <summary>
              <span>Q{i + 1}. {q.q}</span>
              <span style={{ color: colorFor(q.score), fontWeight: 700 }}>{q.score}/10</span>
            </summary>
            <p><strong>Your answer:</strong> {q.a}</p>
            <p><strong>Feedback:</strong> {q.feedback}</p>
          </details>
        ))}

        {tab === "transcript" && (
          <div className="chat" style={{ maxHeight: 420 }}>
            {data.transcript.map((m, i) => <div key={i} className={`bubble ${m.role}`}>{m.text}</div>)}
          </div>
        )}
      </div>

      <button className="btn" onClick={() => navigate("/dashboard")}><RotateCcw size={16} /> Back to dashboard</button>
    </div>
  );
}