import api from "./axios";

export const uploadResumeApi = async (file) => {
  const form = new FormData();
  form.append("resume", file);
  const { data } = await api.post("/api/resume/upload", form);

  const skills = data.analysis?.skills || data.resume?.skills || [];
  return {
    resumeId: data.resume._id,
    skills,
    summary: skills.length
      ? `We found ${skills.length} skills in your resume, including ${skills.slice(0, 5).join(", ")}.`
      : "Your resume was read successfully.",
  };
};