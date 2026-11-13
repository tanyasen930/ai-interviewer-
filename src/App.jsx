import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import UploadResume from "./pages/UploadResume";
import Interview from "./pages/Interview";
import Feedback from "./pages/Feedback";

export default function App() {
  const { user } = useAuth();
  const home = <Navigate to="/dashboard" replace />;

  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={user ? home : <Landing />} />
          <Route path="/login" element={user ? home : <Login />} />
          <Route path="/signup" element={user ? home : <Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadResume /></ProtectedRoute>} />
          <Route path="/interview/:id" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
          <Route path="/feedback/:id" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}