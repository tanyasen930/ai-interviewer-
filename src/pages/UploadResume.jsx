import NewInterview from "../components/NewInterview";

export default function UploadResume() {
  return (
    <div className="fade-up" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2>Start a new interview</h2>
      <p className="muted">Upload your resume as a PDF. The AI will read it and prepare questions for you.</p>
      <NewInterview />
    </div>
  );
}