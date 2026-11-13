import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mic } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../api/axios";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await signup(form.name.trim(), form.email.trim(), form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(errMsg(err, "Signup failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <form onSubmit={handleSubmit} className="card auth-card fade-up">
        <span className="logo"><Mic size={22} /></span>
        <h2>Create your account</h2>
        <p className="muted">Start practicing mock interviews for free.</p>
        <input name="name" placeholder="Full name" required value={form.name} onChange={handleChange} />
        <input name="email" type="email" placeholder="Email" required value={form.email} onChange={handleChange} />
        <input name="password" type="password" placeholder="Password (min. 6 characters)" required value={form.password} onChange={handleChange} />
        {error && <p className="error">{error}</p>}
        <button className="btn full" disabled={loading} style={{ marginTop: 8 }}>
          {loading && <span className="spinner" />}{loading ? "Creating account..." : "Create account"}
        </button>
        <p className="muted" style={{ textAlign: "center", marginBottom: 0 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}