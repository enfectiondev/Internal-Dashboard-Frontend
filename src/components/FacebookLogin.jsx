import React, { useState, useEffect } from "react";

const FacebookLogin = ({ onFacebookLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check URL parameters for token or error from callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (token) {
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Handle successful login
      handleTokenReceived(token);
    } else if (error) {
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Handle error
      setError(decodeURIComponent(error));
      setIsLoading(false);
    }
  }, []);

  const handleTokenReceived = async (token) => {
    try {
      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Store Facebook token separately
      localStorage.setItem('facebook_token', token);
      
      // Create Facebook user object
      const facebookUser = {
        id: payload.sub || payload.facebook_id,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        provider: 'facebook'
      };

      // Call parent callback with Facebook user data
      onFacebookLogin(facebookUser, token);
    } catch (error) {
      console.error('Error processing Facebook token:', error);
      setError('Failed to process login information');
    } finally {
      setIsLoading(false);
    }
  };

  const initiateLogin = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const backendUrl = "https://eyqi6vd53z.us-east-2.awsapprunner.com";
      // const backendUrl = "http://localhost:8000"; // --- IGNORE ---
      const loginUrl = `${backendUrl}/auth/facebook/login`;
      
      // First fetch the auth URL from your backend
      const response = await fetch(loginUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to initiate login: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.auth_url) {
        // Redirect to Facebook OAuth using the returned auth_url
        window.location.href = data.auth_url;
      } else {
        throw new Error("No auth URL received from server");
      }
    } catch (error) {
      console.error('Error initiating Facebook login:', error);
      setError(`Failed to initiate login: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Connect Facebook Account</h2>
        <p className="text-gray-300">
          Login with Facebook to access your Facebook analytics and insights
        </p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4 max-w-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={initiateLogin}
        disabled={isLoading}
        className={`flex items-center space-x-3 px-6 py-3 rounded-lg font-medium transition-colors ${
          isLoading
            ? "bg-gray-500 text-gray-300 cursor-not-allowed"
            : "bg-[#1877F2] text-white hover:bg-[#166FE5] active:bg-[#1464D6]"
        }`}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Login with Facebook</span>
          </>
        )}
      </button>

      <p className="text-xs text-gray-400 max-w-md text-center">
        By connecting your Facebook account, you agree to share your Facebook data with this application
        for analytics purposes.
      </p>
    </div>
  );
};

export default FacebookLogin;