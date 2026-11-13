import { createContext, useContext, useState } from "react";
import { loginApi, signupApi } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved && localStorage.getItem("token") ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const save = ({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  const login = async (email, password) => save(await loginApi(email, password));
  const signup = async (name, email, password) => save(await signupApi(name, email, password));

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);