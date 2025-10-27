import React, { useState, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

export default function AccountSelector({ onAccountSelect, token }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [error, setError] = useState(null);

  // Fetch accounts when component mounts
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoadingAccounts(true);
      setError(null);
      try {
        const res = await fetch(
          "https://3ixmj4hf2a.us-east-2.awsapprunner.com/api/ads/customers",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setAccounts(data);
        } else {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      } catch (err) {
        console.error("Error fetching accounts:", err);
        setError("Failed to load accounts. Please try again.");
      } finally {
        setLoadingAccounts(false);
      }
    };

    if (token) {
      fetchAccounts();
    }
  }, [token]);

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setIsDropdownOpen(false);
    onAccountSelect(account);
  };

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-full max-w-2xl">
          <div style={{ backgroundColor: '#F1ECEC' }} className="rounded-2xl p-8 shadow-lg">
            <div className="text-center">
              <div className="text-red-600 font-semibold text-lg mb-4">
                Error Loading Accounts
              </div>
              <div className="text-red-500 mb-4">
                {error}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="w-full max-w-2xl">
        <div style={{ backgroundColor: '#F1ECEC' }} className="rounded-2xl p-8 shadow-lg">
          {/* Header Section */}
          <div className="mb-8">
            <div 
              className="text-center py-4 px-6 rounded-lg text-white font-semibold text-lg"
              style={{ backgroundColor: '#508995' }}
            >
              Select the Ad Campaign Account
              <ChevronDown className="inline-block ml-2 w-5 h-5" />
            </div>
          </div>

          {/* Loading State */}
          {loadingAccounts ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500 mr-3" />
                <span className="text-gray-600 text-lg">Loading accounts...</span>
              </div>
            </div>
          ) : (
            /* Accounts List */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-h-80 overflow-y-auto">
              {accounts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No accounts found
                </div>
              ) : (
                accounts.map((account, index) => (
                  <div key={account.id || account.customerId}>
                    <button
                      onClick={() => handleAccountSelect(account)}
                      className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                    >
                      <div className="flex flex-col">
                        <div className="font-semibold text-lg text-gray-900 mb-1">
                          {account.name || account.descriptiveName || 'Unnamed Account'}
                        </div>
                        <div className="text-sm text-gray-600">
                          ID: {account.id || account.customerId} | {account.description || account.currencyCode || 'No description'}
                        </div>
                      </div>
                    </button>
                    {index < accounts.length - 1 && (
                      <div className="border-b border-gray-200"></div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {selectedAccount && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-green-800 font-medium">
                Selected Account: {selectedAccount.name || selectedAccount.descriptiveName || 'Unnamed Account'}
              </div>
              <div className="text-green-600 text-sm">
                ID: {selectedAccount.id || selectedAccount.customerId} | {selectedAccount.description || selectedAccount.currencyCode || 'No description'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}