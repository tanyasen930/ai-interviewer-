import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mic } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../api/axios";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(errMsg(err, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <form onSubmit={handleSubmit} className="card auth-card fade-up">
        <span className="logo"><Mic size={22} /></span>
        <h2>Welcome back</h2>
        <p className="muted">Log in to continue your interview practice.</p>
        <input name="email" type="email" placeholder="Email" required value={form.email} onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" required value={form.password} onChange={handleChange} />
        {error && <p className="error">{error}</p>}
        <button className="btn full" disabled={loading} style={{ marginTop: 8 }}>
          {loading && <span className="spinner" />}{loading ? "Logging in..." : "Log in"}
        </button>
        <p className="muted" style={{ textAlign: "center", marginBottom: 0 }}>
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </div>
  );
}