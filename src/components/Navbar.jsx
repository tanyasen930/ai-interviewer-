import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Mic, LayoutDashboard, FilePlus2, LogOut, ChevronDown, Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import useTheme from "../hooks/useTheme";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/");
  };

  const themeBtn = (
    <button className="theme-btn" onClick={toggle} aria-label="Toggle dark mode"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
      <span key={theme} className="theme-ico">
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </span>
    </button>
  );

  return (
    <nav className="navbar">
      <Link to={user ? "/dashboard" : "/"} className="brand">
        <span className="logo"><Mic size={18} /></span>
        AI Interviewer
      </Link>

      <div className="nav-links">
        {user ? (
          <>
            <NavLink to="/dashboard"><LayoutDashboard size={17} /> Dashboard</NavLink>
            <NavLink to="/upload"><FilePlus2 size={17} /> New Interview</NavLink>
            {themeBtn}

            <div className="profile" ref={ref}>
              <button className="profile-btn" onClick={() => setOpen(!open)}>
                <span className="avatar">{user.name?.[0]?.toUpperCase() || "U"}</span>
                <span className="pname">{user.name}</span>
                <ChevronDown size={15} />
              </button>
              {open && (
                <div className="menu">
                  <div className="menu-head">
                    <strong>{user.name}</strong>
                    <div className="muted">{user.email}</div>
                  </div>
                  <button onClick={handleLogout}><LogOut size={16} /> Log out</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {themeBtn}
            <Link to="/login" className="btn ghost">Log in</Link>
            <Link to="/signup" className="btn">Get started</Link>
          </>
        )}
      </div>
    </nav>
  );
}