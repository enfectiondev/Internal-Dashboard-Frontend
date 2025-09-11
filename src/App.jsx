import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./components/Layout";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state to prevent flash redirect

  useEffect(() => {
    const checkToken = () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const error = params.get("error"); // Check for OAuth error

      if (error) {
        // Handle OAuth error
        console.error("OAuth error:", error);
        alert("Login failed: " + decodeURIComponent(error));
        window.history.replaceState({}, document.title, "/login");
        setLoading(false);
        return;
      }

      if (token) {
        try {
          // Decode JWT to get user info
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const userData = JSON.parse(jsonPayload);

          // Validate token expiration
          const currentTime = Math.floor(Date.now() / 1000);
          if (userData.exp && userData.exp < currentTime) {
            console.error("Token expired");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setLoading(false);
            return;
          }

          // Save token and user in localStorage
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(userData));
          setUser(userData);
        } catch (err) {
          console.error("JWT decode error:", err);
          alert("Login failed: Invalid token");
        } finally {
          // Remove token from URL after setting user
          window.history.replaceState({}, document.title, "/dashboard");
          setLoading(false);
        }
      } else {
        // Fallback: check localStorage
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        
        if (storedToken && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            // Validate stored token expiration
            const currentTime = Math.floor(Date.now() / 1000);
            if (userData.exp && userData.exp < currentTime) {
              // Token expired, clear storage
              localStorage.removeItem("token");
              localStorage.removeItem("user");
            } else {
              setUser(userData);
            }
          } catch (err) {
            console.error("Stored user data invalid:", err);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        }
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/dashboard"
          element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}