import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  ArrowRight, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Token {
  tokenId: string;
  symbol: string;
  name: string;
}

interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  priceImpact: number;
  validUntil: number;
  slippageBps: number;
}

interface DexSwapInterfaceProps {
  accountId: string;
  availableTokens: Token[];
  onSwap: (fromToken: string, toToken: string, amount: number) => Promise<void>;
}

export const DexSwapInterface: React.FC<DexSwapInterfaceProps> = ({
  accountId,
  availableTokens,
  onSwap,
}) => {
  const [fromToken, setFromToken] = useState<string>("");
  const [toToken, setToToken] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const defaultTokens: Token[] = [
    { tokenId: "0.0.7304501", symbol: "FAM", name: "Family Token" },
    { tokenId: "0.0.12345", symbol: "HBAR", name: "Hedera" },
    { tokenId: "0.0.67890", symbol: "USDC", name: "USD Coin" },
  ];

  const tokens = availableTokens.length > 0 ? availableTokens : defaultTokens;

  const fetchQuote = async () => {
    if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0) {
      setError("Please select tokens and enter an amount");
      return;
    }

    if (fromToken === toToken) {
      setError("Please select different tokens");
      return;
    }

    setIsLoadingQuote(true);
    setError(null);

    try {
      const response = await fetch("/api/dex/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromToken,
          toToken,
          amount: parseFloat(amount),
        }),
      });
      const data = await response.json();
      setQuote(data);
    } catch (err) {
      setError("Failed to get swap quote");
      setQuote(null);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleSwap = async () => {
    if (!quote) return;

    setIsSwapping(true);
    setError(null);
    setSuccess(null);

    try {
      await onSwap(fromToken, toToken, parseFloat(amount));
      setSuccess(`Successfully swapped ${amount} for ${quote.toAmount.toFixed(2)}`);
      setQuote(null);
      setAmount("");
    } catch (err) {
      setError("Swap failed. Please try again.");
    } finally {
      setIsSwapping(false);
    }
  };

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setQuote(null);
  };

  const formatTokenId = (id: string) => {
    if (id === "0.0.12345") return "HBAR";
    return id.slice(-6);
  };

  return (
    <Card className="w-full bg-white border-purple-100">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-purple-600" />
          Token Swap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <Label>From</Label>
            <div className="flex gap-2">
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="flex-1 p-2 border rounded-lg bg-white"
              >
                <option value="">Select token</option>
                {tokens.map((token) => (
                  <option key={token.tokenId} value={token.tokenId}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-32 text-right"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={swapTokens}
              className="rounded-full w-10 h-10 p-0"
            >
              <ArrowRight className="w-4 h-4 rotate-90" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <Label>To</Label>
            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white"
            >
              <option value="">Select token</option>
              {tokens
                .filter((t) => t.tokenId !== fromToken)
                .map((token) => (
                  <option key={token.tokenId} value={token.tokenId}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Get Quote Button */}
          <Button
            onClick={fetchQuote}
            disabled={isLoadingQuote || !fromToken || !toToken || !amount}
            className="w-full"
            variant="outline"
          >
            {isLoadingQuote ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting quote...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Get Quote
              </>
            )}
          </Button>

          {/* Quote Display */}
          {quote && (
            <div className="bg-purple-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Exchange Rate</span>
                <span className="font-medium">
                  1 {formatTokenId(quote.fromToken)} = {quote.exchangeRate.toFixed(4)} {formatTokenId(quote.toToken)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price Impact</span>
                <Badge variant={quote.priceImpact > 5 ? "destructive" : "default"}>
                  {quote.priceImpact.toFixed(2)}%
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Slippage Tolerance</span>
                <span className="font-medium">{quote.slippageBps / 100}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">You Receive</span>
                <span className="font-semibold text-purple-600">
                  ~{quote.toAmount.toFixed(2)} {formatTokenId(quote.toToken)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                Quote expires in {Math.max(0, Math.floor((quote.validUntil - Date.now()) / 1000))}s
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              {success}
            </div>
          )}

          {/* Swap Button */}
          {quote && (
            <Button
              onClick={handleSwap}
              disabled={isSwapping}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isSwapping ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Swapping...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Swap Now
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
