import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Hash, 
  Phone, 
  MessageCircle,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink
} from "lucide-react";

// Reuse existing types and extend them
export interface PlatformConfig {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  status: 'active' | 'connecting' | 'coming-soon' | 'error';
  description: string;
  color: string;
  features: string[];
  setupUrl?: string;
  botUsername?: string;
  inviteLink?: string;
}

// Platform configurations - easily extensible
export const platformConfigs: Record<string, PlatformConfig> = {
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    icon: MessageSquare,
    status: 'connecting', // Will be 'active' once implemented
    description: 'Family group chats with bot integration',
    color: 'bg-blue-500',
    features: [
      'Group chat participation',
      'Individual agent coaching',
      'Daily family check-ins',
      'Slash command interactions'
    ],
    botUsername: '@FamilyWisdomBot',
    inviteLink: 'https://t.me/FamilyWisdomBot'
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    icon: Hash,
    status: 'coming-soon',
    description: 'Family servers with dedicated agent channels',
    color: 'bg-indigo-500',
    features: [
      'Family server templates',
      'Agent-specific channels',
      '@mention interactions',
      'Voice channel support'
    ]
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: Phone,
    status: 'coming-soon',
    description: 'Business API for family groups',
    color: 'bg-green-500',
    features: [
      'Family group integration',
      'Scheduled messages',
      'Status updates',
      'Private coaching'
    ]
  },
  web: {
    id: 'web',
    name: 'Web Chat',
    icon: MessageCircle,
    status: 'active',
    description: 'Direct chat with all family agents',
    color: 'bg-purple-500',
    features: [
      'Real-time chat interface',
      'All 5 agents available',
      'Message history',
      'File sharing support'
    ]
  }
};

interface PlatformCardProps {
  platform: PlatformConfig;
  onConnect?: (platformId: string) => void;
  onConfigure?: (platformId: string) => void;
}

export const PlatformCard: React.FC<PlatformCardProps> = ({ 
  platform, 
  onConnect, 
  onConfigure 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = platform.icon;

  const getStatusIcon = () => {
    switch (platform.status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'connecting':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'coming-soon':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (platform.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'connecting':
        return <Badge className="bg-blue-100 text-blue-800">Connecting</Badge>;
      case 'coming-soon':
        return <Badge variant="outline" className="text-orange-600 border-orange-200">Coming Soon</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  const getActionButton = () => {
    switch (platform.status) {
      case 'active':
        return (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onConfigure?.(platform.id)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        );
      case 'connecting':
        return (
          <Button 
            size="sm"
            onClick={() => onConnect?.(platform.id)}
          >
            Connect Now
          </Button>
        );
      case 'coming-soon':
        return (
          <Button variant="outline" size="sm" disabled>
            Coming Soon
          </Button>
        );
      case 'error':
        return (
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => onConnect?.(platform.id)}
          >
            Retry Connection
          </Button>
        );
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${platform.color} text-white`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">{platform.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{platform.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Platform-specific info */}
          {platform.botUsername && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Bot Username:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {platform.botUsername}
              </code>
            </div>
          )}
          
          {/* Features preview */}
          {isExpanded && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Features:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {platform.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Show Less' : 'Show Features'}
            </Button>
            
            <div className="flex items-center space-x-2">
              {platform.inviteLink && platform.status === 'connecting' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(platform.inviteLink, '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open
                </Button>
              )}
              {getActionButton()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface PlatformIntegrationProps {
  onPlatformConnect?: (platformId: string) => void;
  onPlatformConfigure?: (platformId: string) => void;
}

export const PlatformIntegration: React.FC<PlatformIntegrationProps> = ({
  onPlatformConnect,
  onPlatformConfigure
}) => {
  return (
    <div className="space-y-4">
      {Object.values(platformConfigs).map((platform) => (
        <PlatformCard
          key={platform.id}
          platform={platform}
          onConnect={onPlatformConnect}
          onConfigure={onPlatformConfigure}
        />
      ))}
    </div>
  );
};
