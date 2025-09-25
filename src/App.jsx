import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import { CacheProvider } from "./context/CacheContext";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state to prevent flash redirect



  useEffect(() => {
    const checkToken = () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const facebookToken = params.get("facebook_token");
      const error = params.get("error");

      // Handle Facebook token separately
      if (facebookToken) {
        try {
          // Decode URL-encoded token
          const decodedToken = decodeURIComponent(facebookToken);
          localStorage.setItem('facebook_token', decodedToken);
          console.log("Facebook token stored successfully");
          
          // Store flag to switch to Facebook tab
          localStorage.setItem('switch_to_facebook_tab', 'true');
          
          // Clean URL without affecting main authentication
          window.history.replaceState({}, document.title, "/dashboard");
          setLoading(false);
          return;
        } catch (err) {
          console.error("Facebook token processing error:", err);
        }
      }

      // Rest of your existing code for Google token handling...
      if (error) {
        console.error("OAuth error:", error);
        alert("Login failed: " + decodeURIComponent(error));
        window.history.replaceState({}, document.title, "/login");
        setLoading(false);
        return;
      }

      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const userData = JSON.parse(jsonPayload);

          const currentTime = Math.floor(Date.now() / 1000);
          if (userData.exp && userData.exp < currentTime) {
            console.error("Token expired");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setLoading(false);
            return;
          }

          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(userData));
          setUser(userData);
        } catch (err) {
          console.error("JWT decode error:", err);
          alert("Login failed: Invalid token");
        } finally {
          window.history.replaceState({}, document.title, "/dashboard");
          setLoading(false);
        }
      } else {
        // Check localStorage for existing Google auth
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        
        if (storedToken && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            const currentTime = Math.floor(Date.now() / 1000);
            if (userData.exp && userData.exp < currentTime) {
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
    // Keep Facebook token separate - don't remove on main logout
    // localStorage.removeItem("facebook_token"); // Only remove this if user specifically disconnects Facebook
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
          element={
            user ? (
              <CacheProvider>
                <Layout user={user} onLogout={handleLogout} />
              </CacheProvider>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}