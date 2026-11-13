import api from "./axios";

export const loginApi = async (email, password) => {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data; // { message, token, user }
};

// Register token nahi deta, isliye register ke baad login karte hain
export const signupApi = async (name, email, password) => {
  await api.post("/api/auth/register", { name, email, password });
  return loginApi(email, password);
};