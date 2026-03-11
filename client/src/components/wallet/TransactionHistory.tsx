import React, { useState, useEffect } from "react";
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Token, 
  Clock,
  ExternalLink,
  RefreshCw,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface TransactionHistoryEntry {
  transactionId: string;
  type: "HBAR_TRANSFER" | "TOKEN_TRANSFER" | "TOKEN_SWAP" | "CONTRACT_CALL" | "UNKNOWN";
  amount: number;
  tokenId?: string;
  timestamp: number;
  status: "SUCCESS" | "PENDING" | "FAILED";
  memo?: string;
  from?: string;
  to?: string;
}

interface TransactionHistoryProps {
  accountId: string;
  limit?: number;
  onRefresh?: () => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  accountId,
  limit = 20,
  onRefresh,
}) => {
  const [transactions, setTransactions] = useState<TransactionHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/transactions?accountId=${accountId}&limit=${limit}`
      );
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchTransactions();
    }
  }, [accountId, limit]);

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "all") return true;
    return tx.type === filter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "HBAR_TRANSFER":
        return <ArrowUpRight className="w-4 h-4" />;
      case "TOKEN_TRANSFER":
        return <Token className="w-4 h-4" />;
      case "TOKEN_SWAP":
        return <RefreshCw className="w-4 h-4" />;
      case "CONTRACT_CALL":
        return <History className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "HBAR_TRANSFER":
        return "bg-blue-100 text-blue-600";
      case "TOKEN_TRANSFER":
        return "bg-purple-100 text-purple-600";
      case "TOKEN_SWAP":
        return "bg-green-100 text-green-600";
      case "CONTRACT_CALL":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatAmount = (amount: number, tokenId?: string) => {
    if (tokenId) {
      return `${(amount / 100).toFixed(2)} ${tokenId.slice(-6)}`;
    }
    return `${(amount / 100_000_000).toFixed(2)} ℏ`;
  };

  return (
    <Card className="w-full bg-white border-purple-100">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5 text-purple-600" />
            Transaction History
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchTransactions}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {["all", "HBAR_TRANSFER", "TOKEN_TRANSFER", "TOKEN_SWAP", "CONTRACT_CALL"].map((type) => (
            <Badge
              key={type}
              variant={filter === type ? "default" : "outline"}
              className={`cursor-pointer whitespace-nowrap ${
                filter === type ? "bg-purple-600 hover:bg-purple-700" : ""
              }`}
              onClick={() => setFilter(type)}
            >
              {type === "all" ? "All" : type.replace("_", " ")}
            </Badge>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
            Loading transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No transactions found</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.transactionId}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(tx.type)}`}>
                    {getTypeIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {tx.type.replace("_", " ")}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(tx.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatAmount(tx.amount, tx.tokenId)}
                  </p>
                  <a
                    href={`https://hashscan.io/testnet/transaction/${tx.transactionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-600 hover:underline flex items-center gap-1 justify-end"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
