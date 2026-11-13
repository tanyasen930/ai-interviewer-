import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import ResumeUploader from "./ResumeUploader";
import { createInterviewApi } from "../api/interview";
import { errMsg } from "../api/axios";

export default function NewInterview() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    if (starting) return;
    setError("");
    setStarting(true);
    try {
      const interview = await createInterviewApi(result.resumeId);
      navigate(`/interview/${interview._id}`);
    } catch (err) {
      setError(errMsg(err, "Could not create the interview. Please try again."));
      setStarting(false);
    }
  };

  if (!result) return <ResumeUploader onSuccess={setResult} />;

  return (
    <div className="card success">
      <div className="ok-ico"><CheckCircle2 size={30} /></div>
      <h3>Resume analyzed</h3>
      <p className="muted">{result.summary}</p>
      {error && <p className="error">{error}</p>}
      <button className="btn" onClick={start} disabled={starting}>
        {starting ? <span className="spinner" /> : null}
        {starting ? "Preparing your questions..." : <>Start interview <ArrowRight size={17} /></>}
      </button>
      <button className="btn ghost" style={{ marginLeft: 8 }} disabled={starting} onClick={() => setResult(null)}>
        Use another resume
      </button>
    </div>
  );
}