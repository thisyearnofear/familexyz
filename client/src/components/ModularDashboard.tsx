import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChatInterface } from './ChatInterface';
import { PlatformIntegration } from './platform/PlatformIntegration';
import { FamilyLogo } from './FamilyLogo';
import { apiClient } from "@/lib/api";
import { telegramIntegration } from "@/services/telegramIntegration";
import type { FamilyStats } from "@/types/family";

import { 
  MessageCircle, 
  TrendingUp, 
  ChevronRight,
  ChevronDown,
  Heart,
  Zap,
  Target,
  Calendar,
  BarChart3,
  Smartphone,
  Users,
  Settings
} from "lucide-react";

// Simplified agent cards for quick access - reuse existing data
const agentQuickAccess = [
  { id: 'wisdom', name: 'Wisdom', icon: '🧠', color: 'from-purple-500 to-purple-600', description: 'Emotional guidance' },
  { id: 'intimacy', name: 'Intimacy', icon: '💑', color: 'from-pink-500 to-pink-600', description: 'Relationship coaching' },
  { id: 'generationalbridge', name: 'Bridge', icon: '👵👦', color: 'from-blue-500 to-blue-600', description: 'Cross-generational' },
  { id: 'presence', name: 'Presence', icon: '🧘', color: 'from-green-500 to-green-600', description: 'Mindful wellness' },
  { id: 'growth', name: 'Growth', icon: '🚀', color: 'from-orange-500 to-orange-600', description: 'Family challenges' }
];

interface ModularDashboardProps {
  onAgentSelect?: (agentId: string) => void;
}

export const ModularDashboard: React.FC<ModularDashboardProps> = ({ onAgentSelect }) => {
  const [activeView, setActiveView] = useState<'overview' | 'chat' | 'insights' | 'platforms'>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['quick-access']));
  const [, setSelectedAgent] = useState<string | null>(null);
  const [, setIsLoading] = useState(false);

  const { data: familyStats } = useQuery<FamilyStats>({
    queryKey: ['familyStats'],
    queryFn: apiClient.getFamilyStats,
  });

  // Platform integration handlers
  const handlePlatformConnect = async (platformId: string) => {
    setIsLoading(true);
    try {
      if (platformId === 'telegram') {
        const status = await telegramIntegration.getStatus();
        if (status.isConnected) {
          alert('Telegram bot is already connected! Check your family group.');
        } else {
          // Show setup instructions instead of attempting direct connection
          alert('Telegram Integration Setup:\n\n1. Contact your family admin for bot token\n2. Configure bot in family settings\n3. Add bot to your family group\n4. Type /start to activate');
        }
      }
    } catch (error) {
      console.error('Platform connection error:', error);
      alert('Failed to connect platform. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformConfigure = async (platformId: string) => {
    if (platformId === 'telegram') {
      try {
        const familyGroups = await telegramIntegration.getFamilyGroups();
        // Open configuration modal or navigate to settings
        console.log('Current Telegram groups:', familyGroups);
        alert('Telegram configuration panel would open here.');
      } catch (error) {
        console.error('Configuration error:', error);
        alert('Failed to load configuration. Please ensure Telegram is connected.');
      }
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    setActiveView('chat');
    onAgentSelect?.(agentId);
  };

  // Settings and user management handlers
  const handleUserManagement = () => {
    alert('User management panel would open here.\n\nFeatures:\n- Add/remove family members\n- Set permissions\n- Manage agent access');
  };

  const handleSettings = () => {
    alert('Settings panel would open here.\n\nFeatures:\n- Notification preferences\n- Privacy settings\n- Agent configurations\n- Platform integrations');
  };

  // Main navigation tabs
  const navigationTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'platforms', label: 'Platforms', icon: Smartphone }
  ];

  // Load initial data
  useEffect(() => {
    // Any initialization logic can go here
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Simplified Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FamilyLogo size="md" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Family Dashboard</h1>
              <p className="text-sm text-gray-600">Strengthen your family bonds with AI guidance</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUserManagement}
              className="flex items-center space-x-1"
            >
              <Users className="w-4 h-4" />
              <span>Users</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSettings}
              className="flex items-center space-x-1"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              All Agents Online
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="flex space-x-1">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                  activeView === tab.id
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-6">
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Quick Agent Access - Always Visible */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <span>Quick Chat</span>
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">5 Agents</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {agentQuickAccess.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleAgentSelect(agent.id)}
                      className={`p-4 rounded-xl bg-gradient-to-br ${agent.color} text-white hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl`}
                    >
                      <div className="text-2xl mb-2">{agent.icon}</div>
                      <div className="text-sm font-semibold">{agent.name}</div>
                      <div className="text-xs opacity-90 mt-1">{agent.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Family Health Score - Collapsible */}
            <Card>
              <CardHeader className="pb-3">
                <button
                  onClick={() => toggleSection('health-score')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span>Family Health Score</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {familyStats?.healthScore || 0}%
                    </Badge>
                    {expandedSections.has('health-score') ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className="w-4 h-4" />
                    }
                  </div>
                </button>
              </CardHeader>
              {expandedSections.has('health-score') && (
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={familyStats?.healthScore || 0} className="h-3" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">{familyStats?.intimacy?.affection || 0}</div>
                        <div className="text-gray-600">Intimacy</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{familyStats?.presence?.attention || 0}</div>
                        <div className="text-gray-600">Presence</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-purple-600">{familyStats?.generational?.bridge || 0}</div>
                        <div className="text-gray-600">Bridge</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-orange-600">{familyStats?.growth?.growth || 0}</div>
                        <div className="text-gray-600">Growth</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Today's Suggestions - Collapsible */}
            <Card>
              <CardHeader className="pb-3">
                <button
                  onClick={() => toggleSection('suggestions')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <span>Today's Suggestions</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">3 New</Badge>
                    {expandedSections.has('suggestions') ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className="w-4 h-4" />
                    }
                  </div>
                </button>
              </CardHeader>
              {expandedSections.has('suggestions') && (
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg">💬</div>
                      <div>
                        <div className="font-medium text-sm">Family Check-in</div>
                        <div className="text-xs text-gray-600">Ask each family member about their day</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="text-lg">🎲</div>
                      <div>
                        <div className="font-medium text-sm">Game Night</div>
                        <div className="text-xs text-gray-600">Schedule 30 minutes of family fun</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg">📱</div>
                      <div>
                        <div className="font-medium text-sm">Digital Wellness</div>
                        <div className="text-xs text-gray-600">Try a 15-minute phone-free conversation</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {activeView === 'chat' && (
          <div className="max-w-4xl mx-auto">
            <ChatInterface />
          </div>
        )}

        {activeView === 'insights' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Family Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Detailed insights coming soon...</p>
                  <p className="text-sm mt-2">We're analyzing your family's interaction patterns</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'platforms' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span>Platform Integrations</span>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Connect your family agents across different platforms
                </p>
              </CardHeader>
              <CardContent>
                <PlatformIntegration 
                  onPlatformConnect={handlePlatformConnect}
                  onPlatformConfigure={handlePlatformConfigure}
                />
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-blue-900">Implementation Status</div>
                      <div className="text-sm text-blue-700 mt-1">
                        <strong>Telegram:</strong> Ready for testing - bot integration active<br/>
                        <strong>Discord:</strong> In development - server templates ready<br/>
                        <strong>WhatsApp:</strong> Business API approval pending
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
