import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import type { ConsentScopes } from "@/types/family";

export const useConsent = () => {
  const [hasConsent, setHasConsent] = useState<boolean>(false);
  const [consentScopes, setConsentScopes] = useState<ConsentScopes | null>(null);
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEYS.FAMILY_CONSENT);
    const scopes = localStorage.getItem(STORAGE_KEYS.CONSENT_SCOPES);
    
    if (consent === "accepted") {
      setHasConsent(true);
      if (scopes) {
        try {
          setConsentScopes(JSON.parse(scopes));
        } catch {
          // Invalid JSON, reset consent
          localStorage.removeItem(STORAGE_KEYS.FAMILY_CONSENT);
          localStorage.removeItem(STORAGE_KEYS.CONSENT_SCOPES);
          setShowConsentModal(true);
        }
      }
    } else {
      setShowConsentModal(true);
    }
  }, []);

  const handleConsent = (accepted: boolean, scopes?: ConsentScopes) => {
    if (accepted && scopes) {
      localStorage.setItem(STORAGE_KEYS.FAMILY_CONSENT, "accepted");
      localStorage.setItem(STORAGE_KEYS.CONSENT_SCOPES, JSON.stringify(scopes));
      setHasConsent(true);
      setConsentScopes(scopes);
    } else {
      localStorage.setItem(STORAGE_KEYS.FAMILY_CONSENT, "declined");
      setHasConsent(false);
      setConsentScopes(null);
    }
    setShowConsentModal(false);
  };

  const revokeConsent = () => {
    localStorage.removeItem(STORAGE_KEYS.FAMILY_CONSENT);
    localStorage.removeItem(STORAGE_KEYS.CONSENT_SCOPES);
    setHasConsent(false);
    setConsentScopes(null);
    setShowConsentModal(true);
  };

  return {
    hasConsent,
    consentScopes,
    showConsentModal,
    handleConsent,
    revokeConsent,
  };
};