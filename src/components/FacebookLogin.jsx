import React from "react";

const FacebookLogin = ({ onFacebookLogin, sourceTab = 'facebook' }) => {
  const handleFacebookAuth = () => {
    // Redirect directly to backend with source_tab parameter
    const authUrl = `https://eyqi6vd53z.us-east-2.awsapprunner.com/auth/facebook/login?source_tab=${sourceTab}`;
    window.location.href = authUrl;
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-8 max-w-md">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <svg className="w-16 h-16 text-[#508995]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Connect Facebook Account
            </h2>
            <p className="text-[#A1BCD3]">
              Connect your Facebook account to view analytics and insights
            </p>
          </div>
          <button
            onClick={handleFacebookAuth}
            className="w-full px-6 py-3 bg-[#508995] text-white rounded-lg hover:bg-[#3F7380] transition-colors font-semibold flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Connect with Facebook</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacebookLogin;