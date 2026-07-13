// frontend/src/hooks/useSession.js
// Manages anonymous session lifecycle in the browser.
//
// On first load: creates a session via POST /api/session, stores the token
// in sessionStorage, and records consent via POST /api/consent.
// On subsequent loads: reads the existing token from sessionStorage.
// If the token is expired or missing, it creates a fresh session.

import { useState, useEffect, useCallback } from 'react';
import { createSession, recordConsent } from '../api/session';

const STORAGE_KEY = 'mindguard_session_token';

export function useSession() {
  const [token,        setToken]        = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [error,        setError]        = useState(null);

  const init = useCallback(async () => {
    try {
      // Check for an existing token first
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setToken(stored);
        setSessionReady(true);
        return;
      }

      // Create a new anonymous session
      const { sessionToken } = await createSession('en');
      sessionStorage.setItem(STORAGE_KEY, sessionToken);
      setToken(sessionToken);

      // Record consent (disclaimer was shown on page mount via DisclaimerBanner)
      await recordConsent(sessionToken, '1.0');

      setSessionReady(true);
    } catch (err) {
      // Non-fatal: the app can still show static content without a session.
      // AI features will show an error when called without a valid token.
      console.warn('[useSession] Could not initialise session:', err.message);
      setError(err.message);
      setSessionReady(true); // unblock UI even if session init failed
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setSessionReady(false);
    init();
  }, [init]);

  return { token, sessionReady, error, clearSession };
}
