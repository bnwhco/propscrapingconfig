import { useState, useEffect } from 'react';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils'; // Use Hub for listening to auth events

export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = checking, true/false = status

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser(); // Check if user is logged in
        await fetchAuthSession({ forceRefresh: false }); // Check if session is valid
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false); // Any error means not authenticated
      }
    };

    checkAuth(); // Check on initial load

    // Listen for auth events (signIn, signOut)
    const hubListenerCancel = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          setIsAuthenticated(true);
          break;
        case 'signedOut':
          setIsAuthenticated(false);
          break;
        // Handle other events if needed (e.g., token refresh failure)
        case 'tokenRefresh_failure':
             console.warn("Auth token refresh failed, user might need to sign in again.");
             setIsAuthenticated(false);
             break;
         case 'autoSignIn_failure':
             console.warn("Auto sign-in failed.");
              setIsAuthenticated(false);
             break;
      }
    });

    // Cleanup listener on unmount
    return () => {
      hubListenerCancel();
    };
  }, []);

  return { isAuthenticated, isLoading: isAuthenticated === null };
};