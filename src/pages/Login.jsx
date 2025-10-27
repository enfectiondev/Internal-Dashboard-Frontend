import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  const handleTokenSubmit = () => {
    if (tokenInput.trim()) {
      // Redirect to main page with token as parameter
      window.location.href = `/?token=${tokenInput.trim()}`;
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch(
        "${process.env.REACT_APP_API_BASE_URL}/auth/login"
        // "http://localhost:8000/auth/login"
        
      );

      // Check if response is ok
      if (!response.ok) {
        const text = await response.text(); // get raw text from server
        console.error("Server returned non-200:", text);
        alert("Login failed: " + text);
        return;
      }

      const data = await response.json();

      if (data.auth_url) {
        // Redirect user to Google OAuth
        window.location.href = data.auth_url;
        // Show token input as fallback since backend doesn't auto-redirect
        setTimeout(() => setShowTokenInput(true), 1000);
      } else if (data.error) {
        alert("Login failed: " + data.error);
      } else {
        alert("Failed to get login URL");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed: " + err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="relative bg-gradient-to-br from-[#4b6b6b] to-[#1a2b2b] rounded-[20px] shadow-xl w-[700px] h-[400px] flex overflow-hidden border border-gray-700">
        {/* Left Section */}
        <div className="flex flex-col justify-center items-center flex-1 text-center p-8 relative">
          <div className="absolute top-[-80px] left-[-50px] w-[350px] h-[350px] bg-gradient-to-t from-[#05242A] to-[#ffffff] rounded-full opacity-60 border-4 border-black" />
          <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-gradient-to-br from-[#c0d8d8] to-transparent rounded-full" />
          <div className="text-sm text-white/80 opacity-70">Welcome</div>
          <div className="text-sm text-white/60 mt-1 opacity-70">to</div>
          <div className="text-4xl font-light text-[#c0d8d8] mt-3 opacity-70">
            Strategy
          </div>
          <div className="text-4xl font-light text-[#c0d8d8]">Dashboard</div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col justify-center items-center flex-1 bg-gradient-to-br from-[#2a3d3d] to-[#1a2b2b] p-8">
          <div className="text-xl font-semibold text-white">Sign In</div>
          <div className="text-xs text-white/70 mt-1">with your Google account</div>

          {!showTokenInput ? (
            <>
              <button
                onClick={handleGoogleLogin}
                className="flex items-center gap-3 bg-gray-100 hover:bg-gray-200 px-5 py-2 mt-6 rounded-full shadow-md transition-colors duration-200 active:scale-95"
              >
                <FcGoogle size={24} />
                <span className="text-gray-700 font-medium">Sign in with Google</span>
              </button>
              
              <button
                onClick={() => setShowTokenInput(true)}
                className="mt-4 text-gray-400 text-sm hover:text-white underline"
              >
                Already have a token? Click here
              </button>
            </>
          ) : (
            <div className="mt-6 w-full max-w-sm">
              <div className="text-white text-sm mb-2">Paste your JWT token:</div>
              <textarea
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full h-24 p-2 text-sm bg-gray-800 text-white rounded resize-none border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Paste JWT token here..."
              />
              <button
                onClick={handleTokenSubmit}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
                disabled={!tokenInput.trim()}
              >
                Continue
              </button>
              <button
                onClick={() => {
                  setShowTokenInput(false);
                  setTokenInput("");
                }}
                className="w-full mt-1 text-gray-400 text-sm hover:text-white"
              >
                Back to Google Sign In
              </button>
            </div>
          )}

          <div className="absolute bottom-4 right-6 flex items-center gap-2 text-white/80 text-sm">
            <span>Powered by</span>
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <img src="/images/logo.png" alt="Logo" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}