
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Save, RotateCcw, Wallet, Coins, ArrowRight } from "lucide-react";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useWalletConnection } from "@elizaos/hedera-wallet/react";

interface SettingsFormData {
  familyName: string;
  communicationStyle: "warm" | "formal" | "casual";
  meetingFrequency: "daily" | "weekly" | "monthly";
  privacyLevel: "open" | "balanced" | "private";
  notifications: boolean;
  dataSharing: boolean;
}

export const SettingsTab: React.FC = () => {
  const { familyMembers } = useFamilyMembers();
  const { isConnected, isConnecting, connection, connectWallet, disconnectWallet } = useWalletConnection();
  const [balance, setBalance] = useState<string>("0");

  const [formData, setFormData] = useState<SettingsFormData>({
    familyName: "",
    communicationStyle: "warm",
    meetingFrequency: "weekly",
    privacyLevel: "balanced",
    notifications: true,
    dataSharing: false,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("familyProfile");
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setFormData({
          familyName: profile.name || "",
          communicationStyle: profile.preferences?.communicationStyle || "warm",
          meetingFrequency: profile.preferences?.meetingFrequency || "weekly",
          privacyLevel: profile.preferences?.privacyLevel || "balanced",
          notifications: profile.preferences?.notifications !== false,
          dataSharing: profile.preferences?.dataSharing || false,
        });
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    }
  }, []);

  // Fetch balance when connected
  useEffect(() => {
    if (isConnected && connection?.accountId) {
        fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${connection.accountId}`)
            .then(res => res.json())
            .then(data => {
                 if(data && data.balance) {
                     // Convert tinybar to HBAR
                     setBalance((data.balance.balance / 100_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                 }
            })
            .catch(err => console.error("Failed to fetch balance:", err));
    } else {
        setBalance("0");
    }
  }, [isConnected, connection?.accountId]);

  const handleInputChange = (
    field: keyof SettingsFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    try {
      const savedProfile = localStorage.getItem("familyProfile");
      const profile = savedProfile ? JSON.parse(savedProfile) : {};

      const updatedProfile = {
        ...profile,
        name: formData.familyName,
        preferences: {
          ...profile.preferences,
          communicationStyle: formData.communicationStyle,
          meetingFrequency: formData.meetingFrequency,
          privacyLevel: formData.privacyLevel,
          notifications: formData.notifications,
          dataSharing: formData.dataSharing,
        },
      };

      localStorage.setItem("familyProfile", JSON.stringify(updatedProfile));
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const handleReset = () => {
    const savedProfile = localStorage.getItem("familyProfile");
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setFormData({
          familyName: profile.name || "",
          communicationStyle: profile.preferences?.communicationStyle || "warm",
          meetingFrequency: profile.preferences?.meetingFrequency || "weekly",
          privacyLevel: profile.preferences?.privacyLevel || "balanced",
          notifications: profile.preferences?.notifications !== false,
          dataSharing: profile.preferences?.dataSharing || false,
        });
      } catch (error) {
        console.error("Failed to reset settings:", error);
      }
    }
    setHasChanges(false);
  };

  const handleConnectWallet = async () => {
      try {
          // Default to HashPack for this demo
          await connectWallet("hashpack");
      } catch (error) {
          console.error("Wallet connection failed:", error);
          alert("Failed to connect wallet. Please ensure HashPack is installed.");
      }
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Family Treasury / Wallet Section - REAL INTEGRATION */}
      <Card className="border-2 border-purple-100 overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-24 h-24 text-purple-600" />
          </div>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
          <CardTitle className="flex items-center space-x-2 text-purple-900">
            <Wallet className="w-5 h-5 text-purple-600" />
            <span>Family Treasury (Hedera)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
            {!isConnected ? (
                <div className="text-center py-6">
                    <p className="text-gray-600 mb-4">Connect a wallet to fund your Family Agent and enable blockchain rewards.</p>
                    <Button
                        onClick={handleConnectWallet}
                        disabled={isConnecting}
                        className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-full transition-all transform hover:scale-105"
                    >
                        {isConnecting ? "Connecting..." : "Connect HashPack Wallet"}
                    </Button>
                    <p className="text-xs text-gray-400 mt-4">
                        Requires HashPack browser extension
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Connected Account</p>
                            <p className="font-mono text-lg font-bold text-purple-900">{connection?.accountId}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Balance</p>
                            <p className="text-2xl font-bold text-green-600 flex items-center justify-end gap-1">
                                {balance} <span className="text-sm text-gray-400">HBAR</span>
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Coins className="w-4 h-4 text-purple-600" />
                                <h4 className="font-bold text-purple-900 text-sm">Inference Fund</h4>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">
                                HBAR allocated to power your Family Agents' intelligence.
                            </p>
                            <div className="w-full bg-purple-200 rounded-full h-2 mb-1">
                                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                            <p className="text-xs text-right text-purple-700 font-mono">Allocated: 75%</p>
                        </div>

                        <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowRight className="w-4 h-4 text-pink-600" />
                                <h4 className="font-bold text-pink-900 text-sm">Reward Pool</h4>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">
                                HBAR distributed to family members for completing growth challenges.
                            </p>
                            <div className="w-full bg-pink-200 rounded-full h-2 mb-1">
                                <div className="bg-pink-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                            </div>
                            <p className="text-xs text-right text-pink-700 font-mono">Allocated: 25%</p>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => disconnectWallet()} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            Disconnect Wallet
                        </Button>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>

      {/* Family Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5" />
            <span>Family Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Family Name */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Family Name
            </label>
            <input
              type="text"
              value={formData.familyName}
              onChange={(e) => handleInputChange("familyName", e.target.value)}
              placeholder="Enter your family name"
              className="w-full px-3 py-2 border border-purple-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Communication Style */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Communication Style
            </label>
            <select
              value={formData.communicationStyle}
              onChange={(e) =>
                handleInputChange(
                  "communicationStyle",
                  e.target.value as "warm" | "formal" | "casual"
                )
              }
              className="w-full px-4 py-3 border-2 border-blue-400 rounded-lg bg-white text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-blue-500 transition-colors"
            >
              <option value="warm">Warm & Supportive</option>
              <option value="formal">Formal & Professional</option>
              <option value="casual">Casual & Relaxed</option>
            </select>
            <p className="text-xs text-gray-700 mt-2 font-medium">
              How your AI agents will communicate with your family
            </p>
          </div>

          {/* Meeting Frequency */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-lg border border-emerald-100">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Check-in Frequency
            </label>
            <select
              value={formData.meetingFrequency}
              onChange={(e) =>
                handleInputChange(
                  "meetingFrequency",
                  e.target.value as "daily" | "weekly" | "monthly"
                )
              }
              className="w-full px-4 py-3 border-2 border-emerald-400 rounded-lg bg-white text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer hover:border-emerald-500 transition-colors"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <p className="text-xs text-gray-700 mt-2 font-medium">
              How often AI agents will check in with your family
            </p>
          </div>

          {/* Privacy Level */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-100">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Privacy Level
            </label>
            <select
              value={formData.privacyLevel}
              onChange={(e) =>
                handleInputChange(
                  "privacyLevel",
                  e.target.value as "open" | "balanced" | "private"
                )
              }
              className="w-full px-4 py-3 border-2 border-amber-400 rounded-lg bg-white text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer hover:border-amber-500 transition-colors"
            >
              <option value="open">Open - Share freely with all members</option>
              <option value="balanced">
                Balanced - Share selectively
              </option>
              <option value="private">
                Private - Keep family conversations confidential
              </option>
            </select>
            <p className="text-xs text-gray-700 mt-2 font-medium">
              How family information is shared across the platform
            </p>
          </div>

          {/* Notifications Toggle */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-900">
                  Enable Notifications
                </label>
                <p className="text-xs text-gray-700 mt-1 font-medium">
                  Receive updates about family activities and AI insights
                </p>
              </div>
              <button
                onClick={() =>
                  handleInputChange("notifications", !formData.notifications)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4 flex-shrink-0 ${
                  formData.notifications
                    ? "bg-indigo-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Data Sharing Toggle */}
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-lg border border-rose-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-900">
                  Data Sharing for Improvements
                </label>
                <p className="text-xs text-gray-700 mt-1 font-medium">
                  Help improve our AI by sharing anonymized family insights
                </p>
              </div>
              <button
                onClick={() =>
                  handleInputChange("dataSharing", !formData.dataSharing)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4 flex-shrink-0 ${
                  formData.dataSharing ? "bg-rose-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.dataSharing ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-purple-200 pt-6 flex gap-3">
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex-1 bg-gradient-to-br from-purple-600 via-purple-600 to-pink-600 hover:from-purple-700 hover:via-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 text-white font-bold text-base py-3 rounded-lg shadow-md hover:shadow-lg active:shadow-inner transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5 mr-2.5" />
              Save Changes
            </Button>
            <Button
              onClick={handleReset}
              disabled={!hasChanges}
              className="flex-1 bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-gray-400 text-gray-700 hover:from-gray-200 hover:to-gray-100 hover:border-gray-500 font-bold text-base py-3 rounded-lg shadow-sm hover:shadow-md active:shadow-inner transition-all disabled:from-gray-50 disabled:to-gray-50 disabled:border-gray-300 disabled:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-5 h-5 mr-2.5" />
              Reset
            </Button>
          </div>

          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm"
            >
              ✓ Settings saved successfully
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Family Members Overview */}
      {familyMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Family Members ({familyMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-600">
                      {member.relationship}
                      {member.age ? `, ${member.age} years old` : ""}
                    </p>
                  </div>
                  {member.interests && member.interests.length > 0 && (
                    <div className="flex gap-2 flex-wrap justify-end">
                      {member.interests.slice(0, 2).map((interest, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              To update family members, please complete the onboarding setup or restart it from the dashboard.
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};
