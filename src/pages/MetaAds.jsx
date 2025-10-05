import React, { useState, useEffect } from "react";
import FacebookLogin from "../components/FacebookLogin";
import { useFacebookAuth } from "../hooks/useFacebookAuth";

const MetaAds = ({ period, selectedAccount }) => {
  const { 
    facebookUser, 
    facebookToken, 
    isLoading, 
    handleFacebookLogin, 
    handleDisconnect, 
    isAuthenticated 
  } = useFacebookAuth();
  
  const [metaAdsData, setMetaAdsData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (facebookToken && facebookUser) {
      fetchMetaAdsData();
    }
  }, [facebookToken, facebookUser, period]);

  const fetchMetaAdsData = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch(
        "https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/ad-accounts",
        { headers: { Authorization: `Bearer ${facebookToken}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMetaAdsData(data);
      } else if (response.status === 401) {
        handleDisconnect();
      }
    } catch (error) {
      console.error('Error fetching Meta Ads data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-white">Loading Meta Ads integration...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <FacebookLogin onFacebookLogin={handleFacebookLogin} />;
  }

  // Display selected account details if available
  if (selectedAccount) {
    return (
      <div className="space-y-6">
        {/* User Info Header with Selected Account */}
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
                  {selectedAccount.name}
                </h2>
                <p className="text-[#A1BCD3]">
                  Account ID: {selectedAccount.account_id} • {selectedAccount.status}
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

        {/* Account Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
            <h3 className="text-sm text-[#A1BCD3] mb-2">Amount Spent</h3>
            <p className="text-2xl font-bold text-white">
              {selectedAccount.currency} {selectedAccount.amount_spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </div>
          
          <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
            <h3 className="text-sm text-[#A1BCD3] mb-2">Balance</h3>
            <p className="text-2xl font-bold text-white">
              {selectedAccount.currency} {selectedAccount.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </div>
          
          <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
            <h3 className="text-sm text-[#A1BCD3] mb-2">Status</h3>
            <p className="text-2xl font-bold text-white">{selectedAccount.status}</p>
          </div>
          
          <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
            <h3 className="text-sm text-[#A1BCD3] mb-2">Timezone</h3>
            <p className="text-base font-bold text-white">{selectedAccount.timezone}</p>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-500/20 border border-green-500 text-green-300 px-6 py-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-semibold">Meta Ads Account Active!</h4>
              <p className="text-sm mt-1">
                Viewing data for {selectedAccount.name}. Period: {period}
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder for future campaign data */}
        <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Campaign Performance</h3>
          <p className="text-[#A1BCD3]">Campaign analytics and performance metrics will be displayed here.</p>
        </div>
      </div>
    );
  }

  // Default view when no account is selected but authenticated
  return (
    <div className="space-y-6">
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
                Connected to Meta Ads
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

      <div className="bg-blue-500/20 border border-blue-500 text-blue-300 px-6 py-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-semibold">Select an Ad Account</h4>
            <p className="text-sm mt-1">
              Please select a Meta Ads account from the sidebar to view details and analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaAds;