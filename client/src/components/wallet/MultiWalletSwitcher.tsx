import React, { useState, useEffect } from "react";
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Check, 
  ArrowRightLeft, 
  CreditCard,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MultiWalletAccount {
  accountId: string;
  walletType: string;
  nickname?: string;
  isActive: boolean;
}

interface MultiWalletSwitcherProps {
  connectedWallets: MultiWalletAccount[];
  activeWallet?: string;
  onSwitchWallet: (accountId: string) => void;
  onAddWallet: () => void;
  onRemoveWallet: (accountId: string) => void;
  isConnecting?: boolean;
}

export const MultiWalletSwitcher: React.FC<MultiWalletSwitcherProps> = ({
  connectedWallets,
  activeWallet,
  onSwitchWallet,
  onAddWallet,
  onRemoveWallet,
  isConnecting = false,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <Card className="w-full bg-white border-purple-100">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="w-5 h-5 text-purple-600" />
          Connected Wallets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {connectedWallets.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No wallets connected</p>
            <p className="text-sm mt-1">Connect a wallet to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {connectedWallets.map((wallet) => (
              <div
                key={wallet.accountId}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  wallet.isActive || wallet.accountId === activeWallet
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    wallet.walletType === "walletconnect" ? "bg-blue-100" : "bg-orange-100"
                  }`}>
                    {wallet.walletType === "walletconnect" ? (
                      <Shield className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Wallet className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {wallet.nickname || `${wallet.walletType.charAt(0).toUpperCase()}${wallet.walletType.slice(1)}`}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {wallet.accountId.slice(0, 10)}...{wallet.accountId.slice(-6)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(wallet.isActive || wallet.accountId === activeWallet) && (
                    <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSwitchWallet(wallet.accountId)}
                    disabled={wallet.isActive || wallet.accountId === activeWallet}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveWallet(wallet.accountId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full mt-4 border-dashed"
          onClick={onAddWallet}
          disabled={isConnecting}
        >
          <Plus className="w-4 h-4 mr-2" />
          {isConnecting ? "Connecting..." : "Add Wallet"}
        </Button>
      </CardContent>
    </Card>
  );
};

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletType: string) => void;
  isConnecting?: boolean;
}

export const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  isConnecting = false,
}) => {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const wallets = [
    {
      type: "walletconnect",
      name: "WalletConnect",
      description: "Connect using WalletConnect protocol",
      icon: Shield,
      color: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      type: "blade",
      name: "Blade Wallet",
      description: "Hedera-native mobile wallet",
      icon: Wallet,
      color: "bg-orange-100",
      textColor: "text-orange-600",
    },
  ];

  const handleConnect = () => {
    if (selectedWallet) {
      onConnect(selectedWallet);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md m-4">
        <h2 className="text-xl font-semibold mb-4">Connect Wallet</h2>
        
        <div className="space-y-3">
          {wallets.map((wallet) => {
            const Icon = wallet.icon;
            return (
              <button
                key={wallet.type}
                onClick={() => setSelectedWallet(wallet.type)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                  selectedWallet === wallet.type
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className={`w-12 h-12 rounded-full ${wallet.color} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${wallet.textColor}`} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium">{wallet.name}</p>
                  <p className="text-sm text-gray-500">{wallet.description}</p>
                </div>
                {selectedWallet === wallet.type && (
                  <Check className="w-5 h-5 text-purple-600" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleConnect} 
            disabled={!selectedWallet || isConnecting}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
        </div>
      </div>
    </div>
  );
};
