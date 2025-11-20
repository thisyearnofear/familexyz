import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";
import { apiClient } from "@/lib/api";

export const ConnectionBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let retryTimeoutId: NodeJS.Timeout;

    const checkConnection = async () => {
      try {ts
        await apiClient.getAgents();
        if (!isOnline) {
          setIsOnline(true);
          setShowBanner(true);
          setRetryCount(0);
          // Hide success banner after 3 seconds
          timeoutId = setTimeout(() => setShowBanner(false), 3000);
        }
      } catch (error) {
        setIsOnline(false);
        setShowBanner(true);
        setRetryCount((prev) => prev + 1);

        // Exponential backoff for retries (max 30 seconds)
        const delay = Math.min(1000 * 2 ** retryCount, 30000);
        retryTimeoutId = setTimeout(checkConnection, delay);
      }
    };

    // Initial check
    checkConnection();

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, [isOnline, retryCount]);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className={`fixed top-0 left-0 right-0 z-50 ${
            isOnline
              ? "bg-gradient-to-r from-green-500 to-emerald-500"
              : "bg-gradient-to-r from-orange-500 to-red-500"
          } text-white px-4 py-3 shadow-lg`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isOnline ? (
                <Wifi className="w-5 h-5" />
              ) : (
                <WifiOff className="w-5 h-5 animate-pulse" />
              )}
              <div>
                <p className="font-semibold">
                  {isOnline
                    ? "✅ Connected to Family AI"
                    : "⚠️ Unable to connect to Family AI"}
                </p>
                {!isOnline && (
                  <p className="text-sm text-white/90">
                    Retrying... (Attempt {retryCount})
                  </p>
                )}
              </div>
            </div>
            {!isOnline && (
              <button
                onClick={() => setShowBanner(false)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                ×
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Inline connection indicator for dashboard header
export const ConnectionIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await apiClient.getAgents();
        setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${
        isOnline
          ? "bg-green-100 text-green-700"
          : "bg-orange-100 text-orange-700"
      }`}
      title={isOnline ? "Connected" : "Disconnected"}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? "bg-green-500 animate-pulse" : "bg-orange-500"
        }`}
      />
      <span className="text-xs font-medium">
        {isOnline ? "Online" : "Offline"}
      </span>
    </div>
  );
};
