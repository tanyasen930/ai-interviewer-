import { useState } from "react";
import { UploadCloud, FileCheck2, Rocket } from "lucide-react";
import { uploadResumeApi } from "../api/resume";
import { errMsg } from "../api/axios";

export default function ResumeUploader({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [over, setOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pick = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      return setError("Please upload a PDF file.");
    }
    if (f.size > 8 * 1024 * 1024) return setError("The file is too large. Please upload a PDF under 8 MB.");
    setError("");
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setOver(false);
    pick(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please choose your resume PDF first.");
    setError("");
    setLoading(true);
    try {
      onSuccess(await uploadResumeApi(file));
    } catch (err) {
      setError(errMsg(err, "Upload failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <label
        className={over ? "dropzone over" : "dropzone"}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={handleDrop}
      >
        <div className={file ? "dz-ico done" : "dz-ico"}>
          {file ? <FileCheck2 size={26} /> : <UploadCloud size={26} />}
        </div>
        <strong>{file ? file.name : "Drag your resume here or click to browse"}</strong>
        <div className="muted">PDF only, up to 8 MB</div>
        <input type="file" accept=".pdf,application/pdf" onChange={(e) => pick(e.target.files[0])} />
      </label>

      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={loading} style={{ marginTop: 14 }}>
        {loading ? <span className="spinner" /> : <Rocket size={17} />}
        {loading ? "Analyzing your resume with AI..." : "Submit resume"}
      </button>
    </form>
  );
}