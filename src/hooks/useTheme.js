import { useEffect, useState } from "react";

const getInitial = () => {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* ignore */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export default function useTheme() {
  const [theme, setTheme] = useState(getInitial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch { /* ignore */ }
  }, [theme]);

  const toggle = () => {
    const root = document.documentElement;
    root.classList.add("theme-anim"); // smooth color transition
    setTimeout(() => root.classList.remove("theme-anim"), 450);
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  return { theme, toggle };
}