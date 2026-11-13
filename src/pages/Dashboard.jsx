import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList, TrendingUp, TrendingDown, Trophy, Rocket, Trash2, ChevronRight,
  Inbox, BarChart3, FileText, Sparkles, ArrowRight, Minus,
} from "lucide-react";
import { getInterviewsApi, deleteInterviewApi } from "../api/interview";
import { errMsg } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import NewInterview from "../components/NewInterview";

const scoreColor = (v) => (v >= 8 ? "var(--ok)" : v >= 6 ? "var(--warn)" : "var(--bad)");
const statusInfo = (s) =>
  s === "Completed" ? ["Completed", "done"] : s === "In Progress" ? ["In progress", "prog"] : ["Not started", "new"];
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof target !== "number") return;
    let raf, start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / ms, 1);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Kpi({ Icon, label, value, decimals = 0, suffix = "", delay }) {
  const n = useCountUp(typeof value === "number" ? value : 0);
  const shown = typeof value === "number" ? `${n.toFixed(decimals)}${suffix}` : "-";
  return (
    <div className="card kpi" style={{ animationDelay: `${delay}s` }}>
      <div className="step-ico"><Icon size={21} /></div>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-val">{shown}</div>
      </div>
    </div>
  );
}

function ScoreRing({ value, size = 92 }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 120); return () => clearTimeout(t); }, []);
  const r = 40, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ flex: "none" }}>
      <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="ring-track" />
      <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={on ? c * (1 - value / 10) : c} transform="rotate(-90 50 50)"
        style={{ stroke: scoreColor(value), transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)" }} />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="ring-num">{value.toFixed(1)}</text>
    </svg>
  );
}

// Chhota aur simple progress card (side mein)
function Progress({ scored }) {
  const latest = scored[scored.length - 1];
  const prev = scored.length > 1 ? scored[scored.length - 2] : null;
  const diff = prev ? +(latest.score - prev.score).toFixed(1) : null;
  const recent = scored.slice(-3).reverse(); // naya sabse upar

  let badge;
  if (diff === null) badge = { cls: "flat", Icon: Minus, text: "First interview" };
  else if (diff > 0) badge = { cls: "up", Icon: TrendingUp, text: `+${diff} vs last` };
  else if (diff < 0) badge = { cls: "down", Icon: TrendingDown, text: `${diff} vs last` };
  else badge = { cls: "flat", Icon: Minus, text: "Same as last" };

  return (
    <div className="card prog-card">
      <div className="prog-row">
        <div className="mid-score" style={{ color: scoreColor(latest.score) }}>
          {latest.score}<small>/10</small>
          <div className="muted small" style={{ fontWeight: 500 }}>Latest score</div>
        </div>
        <span className={`chip-trend ${badge.cls}`}><badge.Icon size={15} /> {badge.text}</span>
      </div>

      <div className="plist">
        {recent.map((p, i) => (
          <div className="prow" key={p.id}>
            <span className="pdate">{fmtDate(p.date)}</span>
            <div className="ptrack">
              <i style={{ width: `${p.score * 10}%`, background: scoreColor(p.score), animationDelay: `${i * 0.1}s` }} />
            </div>
            <b>{p.score}</b>
          </div>
        ))}
      </div>
      {scored.length === 1 && (
        <p className="muted small" style={{ margin: "12px 0 0" }}>Take one more interview to see your progress.</p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null); // interview id ya "all"
  const [busy, setBusy] = useState(false);
  const [delError, setDelError] = useState("");
  const startRef = useRef(null);

  useEffect(() => {
    getInterviewsApi().then(setInterviews).finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(() => [...interviews].sort((a, b) => b.date.localeCompare(a.date)), [interviews]);
  const scored = useMemo(() => sorted.filter((i) => i.score > 0).reverse(), [sorted]); // purana se naya
  const last = sorted[0];

  const total = interviews.length;
  const avg = scored.length ? scored.reduce((s, i) => s + i.score, 0) / scored.length : null;
  const best = scored.length ? Math.max(...scored.map((i) => i.score)) : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = (user.name || "").split(" ")[0];

  const remove = async (target) => {
    setBusy(true);
    setDelError("");
    try {
      if (target === "all") {
        const res = await Promise.allSettled(interviews.map((i) => deleteInterviewApi(i.id)));
        const failed = interviews.filter((_, k) => res[k].status === "rejected");
        setInterviews(failed);
        if (failed.length) setDelError("Some interviews could not be deleted. Please try again.");
        else setConfirmId(null);
      } else {
        await deleteInterviewApi(target);
        setInterviews((list) => list.filter((i) => i.id !== target));
        setConfirmId(null);
      }
    } catch (e) {
      setDelError(errMsg(e, "Could not delete. Please make sure the server supports deleting interviews."));
    } finally {
      setBusy(false);
    }
  };

  const goStart = () => startRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <section className="dash-hero">
        <div className="hero-text">
          <span className="chip"><Sparkles size={14} /> AI Mock Interview</span>
          <h1>{greeting}, {firstName}</h1>
          <p>Practice with an AI interviewer that reads your resume, then review clear and honest feedback.</p>
        </div>
        <button className="btn light" onClick={goStart}><Rocket size={17} /> New interview</button>
      </section>

      <section className="kpis">
        <Kpi Icon={ClipboardList} label="Interviews taken" value={total} delay={0.04} />
        <Kpi Icon={TrendingUp} label="Average score" value={avg} decimals={1} suffix="/10" delay={0.1} />
        <Kpi Icon={Trophy} label="Best score" value={best} decimals={1} suffix="/10" delay={0.16} />
      </section>

      <section className="row-a">
        <div ref={startRef} className="fade-up d1 fill-col" style={{ scrollMarginTop: 90 }}>
          <h2>Start a new interview</h2>
          <NewInterview />
        </div>

        <div className="fade-up d2">
          <h2>Last interview</h2>
          {!last ? (
            <div className="card empty">
              <Inbox size={34} className="float" />
              <p>Your last interview will appear here.</p>
            </div>
          ) : (
            <div className="card">
              <div className="last-body">
                {last.score > 0 ? <ScoreRing value={last.score} /> : <div className="ring-empty">-</div>}
                <div>
                  <strong className="last-title">{last.role}</strong>
                  <div className="muted small">{last.date}</div>
                  <span className={`pill ${statusInfo(last.status)[1]}`}>{statusInfo(last.status)[0]}</span>
                </div>
              </div>
              <Link className="btn full" to={last.status === "Completed" ? `/feedback/${last.id}` : `/interview/${last.id}`}>
                {last.status === "Completed" ? "View feedback" : "Continue interview"} <ArrowRight size={17} />
              </Link>
            </div>
          )}

          <h2 style={{ marginTop: 6 }}>Your progress</h2>
          {scored.length === 0 ? (
            <div className="card empty">
              <BarChart3 size={30} className="float" />
              <p>Complete an interview to see your progress.</p>
            </div>
          ) : (
            <Progress key={scored.map((s) => s.id).join("-")} scored={scored} />
          )}
        </div>
      </section>

      <section className="fade-up d3">
        <div className="hist-head">
          <h2>Interview history</h2>
          {total > 0 && (
            confirmId === "all" ? (
              <div className="confirm">
                <span>Delete all {total} interviews?</span>
                <button className="mini danger" disabled={busy} onClick={() => remove("all")}>{busy ? "Deleting..." : "Yes, delete all"}</button>
                <button className="mini" disabled={busy} onClick={() => setConfirmId(null)}>Cancel</button>
              </div>
            ) : (
              <button className="text-btn" onClick={() => { setDelError(""); setConfirmId("all"); }}>
                <Trash2 size={15} /> Clear all
              </button>
            )
          )}
        </div>

        {delError && <p className="error">{delError}</p>}
        {loading && (<><div className="skeleton" /><div className="skeleton" /></>)}
        {!loading && total === 0 && (
          <div className="card empty">
            <Inbox size={34} className="float" />
            <p>No interviews yet. Upload your resume above to get started.</p>
          </div>
        )}

        {sorted.map((i, idx) => {
          const [label, cls] = statusInfo(i.status);
          return (
            <div className="card hist-item" key={i.id} style={{ animationDelay: `${idx * 0.06}s` }}>
              <Link className="hist-main" to={i.status === "Completed" ? `/feedback/${i.id}` : `/interview/${i.id}`}>
                <div className="hist-ico"><FileText size={19} /></div>
                <div style={{ minWidth: 0 }}>
                  <strong>{i.role}</strong>
                  <div className="muted small">{i.date} <span className={`pill ${cls}`} style={{ marginTop: 0, marginLeft: 6 }}>{label}</span></div>
                </div>
              </Link>
              <div className="hist-right">
                {i.score > 0 && <span className="score" style={{ color: scoreColor(i.score) }}>{i.score}/10</span>}
                {confirmId === i.id ? (
                  <div className="confirm">
                    <span>Delete?</span>
                    <button className="mini danger" disabled={busy} onClick={() => remove(i.id)}>Yes</button>
                    <button className="mini" disabled={busy} onClick={() => setConfirmId(null)}>No</button>
                  </div>
                ) : (
                  <>
                    <button className="del-btn" title="Delete this interview" onClick={() => { setDelError(""); setConfirmId(i.id); }}>
                      <Trash2 size={17} />
                    </button>
                    <ChevronRight size={18} className="muted" />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}