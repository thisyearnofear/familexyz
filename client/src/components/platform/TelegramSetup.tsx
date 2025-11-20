import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare, 
  CheckCircle, 
  Copy,
  ExternalLink,
  Users,
  Settings
} from "lucide-react";
import { telegramIntegration, TelegramIntegrationStatus } from "@/services/telegramIntegration";

interface TelegramSetupProps {
  onComplete?: () => void;
}

export const TelegramSetup: React.FC<TelegramSetupProps> = ({ onComplete }) => {
  const [status, setStatus] = useState<TelegramIntegrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupStep, setSetupStep] = useState(1);
  const [botToken, setBotToken] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    const currentStatus = await telegramIntegration.getStatus();
    setStatus(currentStatus);
    setIsLoading(false);
    
    if (currentStatus.isConnected) {
      setSetupStep(4); // Already connected
    }
  };

  const handleConnect = async () => {
    if (!botToken.trim()) {
      alert('Please enter your bot token');
      return;
    }

    setIsLoading(true);
    const result = await telegramIntegration.connectBot({
      botToken: botToken.trim(),
      botUsername: '@FamilyWisdomBot' // This would be dynamic in real implementation
    });

    if (result.success) {
      setSetupStep(4);
      onComplete?.();
      await loadStatus();
    } else {
      alert(`Connection failed: ${result.error}`);
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here using existing toast system
  };

  const setupSteps = [
    {
      title: "Create Telegram Bot",
      description: "Contact @BotFather on Telegram to create your family bot",
      action: (
        <Button 
          variant="outline" 
          onClick={() => window.open('https://t.me/BotFather', '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open BotFather
        </Button>
      )
    },
    {
      title: "Get Bot Token", 
      description: "Copy the bot token from BotFather",
      action: (
        <div className="space-y-2">
          <input
            type="password"
            placeholder="Paste your bot token here..."
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )
    },
    {
      title: "Connect Bot",
      description: "Connect your bot to the family agent system",
      action: (
        <Button 
          onClick={handleConnect}
          disabled={isLoading || !botToken.trim()}
        >
          {isLoading ? 'Connecting...' : 'Connect Bot'}
        </Button>
      )
    },
    {
      title: "Add to Family Group",
      description: "Add your bot to your family group chat",
      action: status?.isConnected ? (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              {status.botUsername}
            </code>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => copyToClipboard(status.botUsername || '')}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          <Button 
            variant="outline"
            onClick={() => window.open(telegramIntegration.getBotInviteLink(status.botUsername || ''), '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Bot Chat
          </Button>
        </div>
      ) : null
    }
  ];

  if (isLoading && !status) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading Telegram status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Telegram Integration</span>
            {status?.isConnected ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                <span className="text-red-500 text-xs mr-1">⚠️</span>
                Not Connected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status?.isConnected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Bot Username:</span>
                  <div className="font-medium">{status.botUsername}</div>
                </div>
                <div>
                  <span className="text-gray-600">Connected Groups:</span>
                  <div className="font-medium">{status.connectedGroups}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Groups
                </Button>
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Agents
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Connect your Telegram bot to enable family group integration</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Steps */}
      {!status?.isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Steps</CardTitle>
            <Progress value={(setupStep / setupSteps.length) * 100} className="mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {setupSteps.map((step, index: number) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === setupStep;
                const isCompleted = stepNumber < setupStep;
                
                return (
                  <div 
                    key={stepNumber}
                    className={`flex items-start space-x-4 p-4 rounded-lg border ${
                      isActive ? 'border-blue-200 bg-blue-50' : 
                      isCompleted ? 'border-green-200 bg-green-50' : 
                      'border-gray-200'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCompleted ? 'bg-green-600 text-white' :
                      isActive ? 'bg-blue-600 text-white' :
                      'bg-gray-300 text-gray-600'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{step.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      {isActive && step.action && (
                        <div className="mt-3">
                          {step.action}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {telegramIntegration.getSetupInstructions('@FamilyWisdomBot').map((instruction, index: number) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">{instruction}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
