import React, { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, Coins, CreditCard, ShieldCheck } from "lucide-react";
import { useWalletConnection } from "@elizaos/hedera-wallet/react";

interface FamilyTreasuryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FamilyTreasuryModal: React.FC<FamilyTreasuryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isConnected, isConnecting, connection, connectWallet, disconnectWallet } = useWalletConnection();
  const [balance, setBalance] = useState<string>("0");

  // Fetch balance when connected
  useEffect(() => {
    if (isConnected && connection?.accountId) {
      fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${connection.accountId}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.balance) {
            // Convert tinybar to HBAR
            setBalance(
              (data.balance.balance / 100_000_000).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            );
          }
        })
        .catch((err) => console.error("Failed to fetch balance:", err));
    } else {
      setBalance("0");
    }
  }, [isConnected, connection?.accountId]);

  const handleConnectWallet = async () => {
    try {
      await connectWallet("hashpack");
    } catch (error) {
      console.error("Wallet connection failed:", error);
      alert("Failed to connect wallet. Please ensure HashPack is installed.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-white border-2 border-purple-100 p-0 overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Wallet className="w-64 h-64 text-purple-600" />
        </div>

        <DialogHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <DialogTitle className="flex items-center space-x-2 text-2xl font-bold">
            <Wallet className="w-8 h-8 text-purple-200" />
            <span>Family Treasury</span>
          </DialogTitle>
          <p className="text-purple-100 mt-2">
            Manage your family's shared resources and unlock premium AI features with Hedera.
          </p>
        </DialogHeader>

        <div className="p-6 space-y-6 relative z-10">
          {!isConnected ? (
            <div className="text-center py-8 space-y-6">
              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 inline-block">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-purple-900 mb-2">Connect Family Wallet</h3>
                <p className="text-gray-600 max-w-xs mx-auto text-sm">
                  Link a Hedera wallet to fund your Family Agent's inference and enable rewards for your family members.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                   <div className="p-2 bg-blue-100 rounded-full">
                     <Coins className="w-4 h-4 text-blue-600" />
                   </div>
                   <div className="text-left">
                     <h4 className="font-bold text-blue-900 text-sm">Pay for Intelligence</h4>
                     <p className="text-xs text-blue-700">Use HBAR to power advanced AI reasoning.</p>
                   </div>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-pink-50 border border-pink-100">
                   <div className="p-2 bg-pink-100 rounded-full">
                     <TrophyIcon className="w-4 h-4 text-pink-600" />
                   </div>
                   <div className="text-left">
                     <h4 className="font-bold text-pink-900 text-sm">Reward Growth</h4>
                     <p className="text-xs text-pink-700">Incentivize family members with token rewards.</p>
                   </div>
                </div>
              </div>

              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                size="lg"
                className="bg-black hover:bg-gray-800 text-white font-bold py-6 px-8 rounded-xl text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 w-full max-w-sm"
              >
                {isConnecting ? "Connecting..." : "Connect HashPack Wallet"}
              </Button>
              <p className="text-xs text-gray-400">
                Requires HashPack browser extension
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Coins className="w-32 h-32 text-white" />
                </div>
                <div className="relative z-10">
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Total Balance</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-bold">{balance}</h2>
                        <span className="text-xl text-gray-400 font-medium">HBAR</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 bg-white/10 w-fit px-3 py-1 rounded-full">
                        <ShieldCheck className="w-3 h-3 text-green-400" />
                        <span className="font-mono">{connection?.accountId}</span>
                    </div>
                </div>
              </div>

              {/* Allocation Section */}
              <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                      Fund Allocation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 hover:border-purple-300 transition-colors cursor-pointer group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                                    <Coins className="w-4 h-4 text-purple-600" />
                                </div>
                                <h4 className="font-bold text-purple-900 text-sm">Inference Fund</h4>
                            </div>
                            <span className="text-xs font-bold bg-purple-200 text-purple-800 px-2 py-1 rounded">75%</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">
                            Allocated to power your Family Agents' intelligence and reasoning capabilities.
                        </p>
                        <div className="w-full bg-purple-200 rounded-full h-1.5">
                            <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                    </div>

                    <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 hover:border-pink-300 transition-colors cursor-pointer group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors">
                                    <TrophyIcon className="w-4 h-4 text-pink-600" />
                                </div>
                                <h4 className="font-bold text-pink-900 text-sm">Reward Pool</h4>
                            </div>
                            <span className="text-xs font-bold bg-pink-200 text-pink-800 px-2 py-1 rounded">25%</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">
                            Distributed to family members for completing growth challenges and goals.
                        </p>
                        <div className="w-full bg-pink-200 rounded-full h-1.5">
                            <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                    </div>
                  </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnectWallet()}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                    Disconnect Wallet
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
            <Button onClick={onClose} variant="outline">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper icon component
const TrophyIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
);
