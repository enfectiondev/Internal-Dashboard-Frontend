import { useState, useEffect } from 'react';

export const useFacebookAuth = () => {
  const [facebookUser, setFacebookUser] = useState(null);
  const [facebookToken, setFacebookToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkFacebookAuth();
  }, []);

  const checkFacebookAuth = () => {
    const token = localStorage.getItem('facebook_token');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format');
        }
        
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
          localStorage.removeItem('facebook_token');
          setFacebookUser(null);
          setFacebookToken(null);
        } else {
          const user = {
            id: payload.sub || payload.facebook_id,
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
            provider: 'facebook'
          };
          setFacebookUser(user);
          setFacebookToken(token);
        }
      } catch (error) {
        console.error('Error decoding Facebook token:', error);
        localStorage.removeItem('facebook_token');
        setFacebookUser(null);
        setFacebookToken(null);
      }
    }
    setIsLoading(false);
  };

  const handleFacebookLogin = (user, token) => {
    setFacebookUser(user);
    setFacebookToken(token);
    localStorage.setItem('facebook_token', token);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('facebook_token');
    setFacebookUser(null);
    setFacebookToken(null);
  };

  const refreshAuth = () => {
    checkFacebookAuth();
  };

  return {
    facebookUser,
    facebookToken,
    isLoading,
    handleFacebookLogin,
    handleDisconnect,
    refreshAuth,
    isAuthenticated: !!facebookUser
  };
};