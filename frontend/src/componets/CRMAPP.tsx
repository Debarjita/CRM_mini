import React, { useState, useEffect } from 'react';
import { Plus, Target, Users, TrendingUp, Brain, Send, Clock, CheckCircle, XCircle, LogOut } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Campaign {
  _id: string;
  name: string;
  audienceSize: number;
  message: string;
  createdAt: string;
  stats: {
    sent: number;
    failed: number;
    pending: number;
  };
}

interface SegmentCondition {
  field: string;
  operator: string;
  value: string;
}

interface SegmentRules {
  operator: string;
  conditions: SegmentCondition[];
}

interface Stats {
  totalCampaigns: number;
  totalCustomers: number;
  deliveryRate: number;
  recentCampaigns: Campaign[];
}

// Main App Component
const CRMApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<string>('dashboard');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/auth/user`, { credentials: 'include' });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { 
        method: 'POST', 
        credentials: 'include' 
      });
      setUser(null);
      setCurrentView('login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CRM Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} currentView={currentView} onViewChange={setCurrentView} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'campaigns' && <CampaignManager />}
        {currentView === 'segments' && <SegmentBuilder />}
      </main>
    </div>
  );
};

// Login Component
const LoginPage: React.FC = () => {
  const handleGoogleLogin = (): void => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <Target className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mini CRM</h1>
          <p className="text-gray-600 mb-8">Intelligent customer engagement platform</p>
          
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

// Header Component
interface HeaderProps {
  user: User;
  onLogout: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, currentView, onViewChange }) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-indigo-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Mini CRM</h1>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              {['dashboard', 'campaigns', 'segments'].map((view) => (
                <button
              onClick={previewAudience}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Preview Audience
            </button>
            {audienceSize !== null && (
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                Audience Size: {audienceSize.toLocaleString()} customers
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Composer */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Campaign Message</h3>
          <button
            onClick={getMessageSuggestions}
            className="flex items-center text-sm text-purple-600 hover:text-purple-700"
          >
            <Brain className="h-4 w-4 mr-1" />
            AI Suggestions
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Template (use {'{name}'} for personalization)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your message template..."
            />
          </div>

          {messageSuggestions.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">AI Suggestions:</p>
              <div className="space-y-2">
                {messageSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setMessage(suggestion)}
                    className="block w-full text-left p-3 bg-purple-50 rounded-lg hover:bg-purple-100 text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Campaign Button */}
      <div className="flex justify-end">
        <button
          onClick={createCampaign}
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Campaign...' : 'Create Campaign'}
        </button>
      </div>
    </div>
  );
};

export default CRMApp;

// Additional TypeScript interfaces for completeness
export interface FieldOption {
  value: string;
  label: string;
}

export interface OperatorOption {
  value: string;
  label: string;
}

export interface MessageSuggestion {
  segment: string;
  messages: string[];
}
                  key={view}
                  onClick={() => onViewChange(view)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === view
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="h-8 w-8 rounded-full"
            />
            <span className="text-sm font-medium text-gray-700">{user.name}</span>
            <button
              onClick={onLogout}
              className="text-gray-400 hover:text-gray-600"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Dashboard Component
const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalCampaigns: 0,
    totalCustomers: 0,
    deliveryRate: 0,
    recentCampaigns: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns`, { credentials: 'include' });
      if (response.ok) {
        const campaigns: Campaign[] = await response.json();
        const totalSent = campaigns.reduce((sum, c) => sum + c.stats.sent, 0);
        const totalFailed = campaigns.reduce((sum, c) => sum + c.stats.failed, 0);
        const deliveryRate = totalSent + totalFailed > 0 ? (totalSent / (totalSent + totalFailed) * 100) : 0;
        
        setStats({
          totalCampaigns: campaigns.length,
          totalCustomers: campaigns.reduce((sum, c) => sum + c.audienceSize, 0),
          deliveryRate: parseFloat(deliveryRate.toFixed(1)),
          recentCampaigns: campaigns.slice(0, 5)
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Send className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Customers Reached</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.deliveryRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Campaigns</h3>
        </div>
        <div className="p-6">
          {stats.recentCampaigns.length > 0 ? (
            <div className="space-y-4">
              {stats.recentCampaigns.map((campaign) => (
                <div key={campaign._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                    <p className="text-sm text-gray-600">
                      Audience: {campaign.audienceSize.toLocaleString()} customers
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-green-600">{campaign.stats.sent}</p>
                      <p className="text-xs text-gray-500">Sent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-red-600">{campaign.stats.failed}</p>
                      <p className="text-xs text-gray-500">Failed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-yellow-600">{campaign.stats.pending}</p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No campaigns created yet. Create your first campaign to get started!</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Campaign Manager Component
const CampaignManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (campaign: Campaign): JSX.Element => {
    const { sent, failed, pending } = campaign.stats;
    if (pending > 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Processing</span>;
    } else if (failed > 0 && sent === 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Failed</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Campaign History</h2>
      </div>

      <div className="bg-white shadow-sm rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">All Campaigns</h3>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Stats</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{campaign.message}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.audienceSize.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(campaign)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-4 text-sm">
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {campaign.stats.sent}
                      </div>
                      <div className="flex items-center text-red-600">
                        <XCircle className="h-4 w-4 mr-1" />
                        {campaign.stats.failed}
                      </div>
                      <div className="flex items-center text-yellow-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {campaign.stats.pending}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {campaigns.length === 0 && (
            <div className="text-center py-12">
              <Send className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No campaigns created yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Segment Builder Component
const SegmentBuilder: React.FC = () => {
  const [segmentName, setSegmentName] = useState<string>('');
  const [rules, setRules] = useState<SegmentRules>({
    operator: 'AND',
    conditions: [{ field: 'totalSpends', operator: '>', value: '' }]
  });
  const [message, setMessage] = useState<string>('Hi {name}, here\'s a special offer just for you!');
  const [aiDescription, setAiDescription] = useState<string>('');
  const [audienceSize, setAudienceSize] = useState<number | null>(null);
  const [messageSuggestions, setMessageSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const addCondition = (): void => {
    setRules(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: 'totalSpends', operator: '>', value: '' }]
    }));
  };

  const removeCondition = (index: number): void => {
    setRules(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index: number, field: string, value: string): void => {
    setRules(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const previewAudience = async (): Promise<void> => {
    try {
      const response = await fetch(
        `${API_BASE}/api/customers/preview?rules=${encodeURIComponent(JSON.stringify(rules))}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setAudienceSize(data.audienceSize);
      }
    } catch (error) {
      console.error('Failed to preview audience:', error);
    }
  };

  const handleAISegment = async (): Promise<void> => {
    if (!aiDescription.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/ai/segment-from-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ description: aiDescription })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules);
        setAiDescription('');
      }
    } catch (error) {
      console.error('AI segment generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMessageSuggestions = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/api/ai/message-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          objective: segmentName || 'general campaign',
          audienceSize 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessageSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Failed to get message suggestions:', error);
    }
  };

  const createCampaign = async (): Promise<void> => {
    if (!segmentName.trim() || !message.trim() || rules.conditions.some(c => !c.value)) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: segmentName,
          segmentRules: rules,
          message
        })
      });

      if (response.ok) {
        alert('Campaign created successfully!');
        // Reset form
        setSegmentName('');
        setRules({ operator: 'AND', conditions: [{ field: 'totalSpends', operator: '>', value: '' }] });
        setMessage('Hi {name}, here\'s a special offer just for you!');
        setAudienceSize(null);
        setMessageSuggestions([]);
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const fieldOptions = [
    { value: 'totalSpends', label: 'Total Spending' },
    { value: 'visits', label: 'Number of Visits' },
    { value: 'lastVisit', label: 'Last Visit' }
  ];

  const operatorOptions = [
    { value: '>', label: 'Greater than' },
    { value: '<', label: 'Less than' },
    { value: '>=', label: 'Greater than or equal' },
    { value: '<=', label: 'Less than or equal' },
    { value: '=', label: 'Equal to' },
    { value: 'inactive_days', label: 'Inactive for (days)' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Create Campaign</h2>

      {/* AI-Powered Segment Builder */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <Brain className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">AI Segment Builder</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your target audience in plain English
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="e.g., People who haven't shopped in 6 months and spent over ₹5000"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAISegment}
                disabled={loading || !aiDescription.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Rules'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Rule Builder */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Segment Rules</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
            <input
              type="text"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              placeholder="Enter campaign name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Conditions</label>
            <div className="space-y-3">
              {rules.conditions.map((condition, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  {index > 0 && (
                    <select
                      value={rules.operator}
                      onChange={(e) => setRules(prev => ({ ...prev, operator: e.target.value }))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  )}
                  
                  <select
                    value={condition.field}
                    onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    {fieldOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    {operatorOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="border border-gray-300 rounded px-3 py-2 text-sm w-24"
                  />
                  
                  {rules.conditions.length > 1 && (
                    <button
                      onClick={() => removeCondition(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                onClick={addCondition}
                className="flex items-center text-indigo-600 hover:text-indigo-700 text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Condition
              </button>
            </div>
          </div>

          <div className="flex space-x-4">
            <button