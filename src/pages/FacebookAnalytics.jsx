import React, { useState, useEffect } from "react";
import FacebookLogin from "../components/FacebookLogin";
import { useFacebookAuth } from "../hooks/useFacebookAuth";

const FacebookAnalytics = ({ period }) => {
  const { 
    facebookUser, 
    facebookToken, 
    isLoading, 
    handleFacebookLogin, 
    handleDisconnect, 
    isAuthenticated 
  } = useFacebookAuth();
  
  const [facebookData, setFacebookData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (facebookToken && facebookUser) {
      fetchFacebookData();
    }
  }, [facebookToken, facebookUser, period]);

  const fetchFacebookData = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch(
        "https://eyqi6vd53z.us-east-2.awsapprunner.com/api/facebook/accounts",
        { headers: { Authorization: `Bearer ${facebookToken}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setFacebookData(data);
      } else if (response.status === 401) {
        // Token expired or invalid
        handleDisconnect();
      }
    } catch (error) {
      console.error('Error fetching Facebook data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-white">Loading Facebook integration...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <FacebookLogin onFacebookLogin={handleFacebookLogin} />;
  }

  return (
    <div className="space-y-6">
      {/* User Info Header */}
      <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {facebookUser.picture && (
              <img 
                src={facebookUser.picture} 
                alt={facebookUser.name}
                className="w-12 h-12 rounded-full border-2 border-[#508995]"
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-white">
                Connected to Facebook
              </h2>
              <p className="text-[#A1BCD3]">
                {facebookUser.name} • {facebookUser.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Display real Facebook data if available */}
      {isLoadingData ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-white">Loading Facebook data...</span>
        </div>
      ) : facebookData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pages */}
          {facebookData.pages && facebookData.pages.map(page => (
            <div key={page.id} className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white">{page.name}</h3>
              <p className="text-[#A1BCD3] text-sm">{page.category}</p>
              <div className="mt-4">
                <p className="text-white">Followers: {page.followers_count || 'N/A'}</p>
                <p className="text-white">Fan Count: {page.fan_count || 'N/A'}</p>
              </div>
            </div>
          ))}
          
          {/* Ad Accounts */}
          {facebookData.ad_accounts && facebookData.ad_accounts.map(account => (
            <div key={account.id} className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white">{account.name}</h3>
              <p className="text-[#A1BCD3] text-sm">Ad Account</p>
              <div className="mt-4">
                <p className="text-white">Status: {account.account_status}</p>
                <p className="text-white">Currency: {account.currency}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success Message */}
      <div className="bg-green-500/20 border border-green-500 text-green-300 px-6 py-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-semibold">Facebook Account Successfully Connected!</h4>
            <p className="text-sm mt-1">
              Your Facebook data is now available. Period: {period}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacebookAnalytics;