import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Target, Users, TrendingUp, Brain, Send, Clock, CheckCircle,
  XCircle, LogOut, AlertCircle, Loader2, Eye, Trash2, ChevronRight,
  HelpCircle, BarChart3, Sparkles, Zap, Copy, Calendar, Activity,
  Target as TargetIcon, UserCheck, Timer
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

// =====================
// Type definitions
// =====================
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
  status: string;
  stats: {
    sent: number;
    failed: number;
    pending: number;
  };
  // Optional if present server-side
  segmentRules?: SegmentRules;
}

interface SegmentCondition {
  field: string;
  operator: string;
  value: string;
}

interface SegmentRules {
  operator: string; // AND | OR
  conditions: SegmentCondition[];
}

interface Stats {
  totalCampaigns: number;
  totalCustomers: number;
  deliveryRate: number;
  recentCampaigns: Campaign[];
}

interface CampaignPerformance {
  summary: string;
  insights?: string[];
  recommendations?: string[];
}

interface LookalikeSuggestion {
  rules: SegmentRules;
  description: string;
  estimatedSize: number;
  similarityScore: number;
  name?: string; // Add optional name field
}

interface TimingRecommendation {
  bestTime: string;
  bestDay: string;
  explanation: string;
  expectedEngagement: number;
  
  bestDays?: string[];
  bestHours?: number[];
  timezone?: string;
  confidence?: number;
  reasoning?: string;
}

interface RealTimeStats {
  campaign: Campaign;
  recentActivity: any[];
  statusDistribution: { _id: string; count: number }[];
  hourlyTrends: any[];
  realTimeStats: {
    deliveryRate: number;
    avgDeliveryTime: number | null;
    estimatedCompletion: {
      remainingMessages: number;
      estimatedMinutes: number;
      estimatedCompletion: string;
    } | null;
  } | null;
}

// =====================
// Main App
// =====================
const CRMApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Lookalike → Segment prefill wiring
  const [prefillRules, setPrefillRules] = useState<SegmentRules | null>(null);
  const openSegmentWithRules = (rules: SegmentRules) => {
    setPrefillRules(rules);
    setCurrentView('segments');
  };

  useEffect(() => {
    // Ensure page loads at 100% zoom and fetch auth
    (document.body.style as any).zoom = '100%';
    fetchUser();
  }, []);

  // Optional: accept handoffs from the Insights view if you keep sessionStorage bridging
  useEffect(() => {
    const raw = sessionStorage.getItem('prefillRules');
    if (raw) {
      try {
        const parsed: SegmentRules = JSON.parse(raw);
        setPrefillRules(parsed);
        setCurrentView('segments');
      } finally {
        sessionStorage.removeItem('prefillRules');
      }
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Target className="h-16 w-16 text-white" />
              <div className="absolute inset-0 animate-ping">
                <Target className="h-16 w-16 text-white/30" />
              </div>
            </div>
          </div>
          <Loader2 className="animate-spin h-12 w-12 text-white mx-auto mb-4" />
          <p className="text-white/90 text-lg font-medium">Loading CRM Platform...</p>
          <p className="text-white/70 mt-2">Getting things ready for you</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <Header user={user} onLogout={handleLogout} currentView={currentView} onViewChange={setCurrentView} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'campaigns' && <CampaignManager onApplyLookalike={openSegmentWithRules} />}
        {currentView === 'segments' && (
          <SegmentBuilder
            onCampaignCreated={() => setCurrentView('campaigns')}
            prefillRules={prefillRules}
            onPrefillConsumed={() => setPrefillRules(null)}
          />
        )}
        {currentView === 'insights' && <InsightsView onApplyLookalike={openSegmentWithRules} />}
      </main>
    </div>
  );
};

// =====================
// Login
// =====================
const LoginPage: React.FC = () => {
  const handleGoogleLogin = (): void => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
        <div className="p-1 bg-gradient-to-r from-indigo-400 to-purple-500">
          <div className="bg-white rounded-xl p-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Target className="h-16 w-16 text-indigo-600" />
                  <div className="absolute -inset-2 bg-indigo-100 rounded-full -z-10 animate-pulse"></div>
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">Mini CRM</h1>
              <p className="text-gray-600 mb-8 text-lg">Intelligent customer engagement platform</p>

              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl px-6 py-4 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <p className="text-sm text-gray-500 mt-6">Secure login with your Google account</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================
// Header
// =====================
interface HeaderProps {
  user: User;
  onLogout: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, currentView, onViewChange }) => {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <div className="relative">
                <Target className="h-8 w-8 text-indigo-600 mr-2" />
                <div className="absolute inset-0 bg-indigo-100 rounded-full -z-10 animate-pulse"></div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Mini CRM</h1>
            </div>

            <nav className="hidden md:flex space-x-2">
              {[
                { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
                { key: 'campaigns', label: 'Campaigns', icon: Send },
                { key: 'segments', label: 'Create Campaign', icon: Plus },
                { key: 'insights', label: 'Insights', icon: BarChart3 } // NEW
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => onViewChange(item.key)}
                  className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    currentView === item.key
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col text-right mr-3">
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
              <span className="text-xs text-gray-500">Welcome back!</span>
            </div>
            <div className="relative group">
              <img
                src={user.avatar}
                alt={user.name}
                className="h-10 w-10 rounded-full border-2 border-white shadow-md group-hover:border-indigo-300 transition-colors duration-300"
              />
              <div className="absolute -inset-1 bg-indigo-100 rounded-full -z-10 group-hover:animate-pulse"></div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-indigo-600 transition-all duration-300 hover:bg-indigo-50 rounded-lg"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// =====================
// AI: Campaign Performance
// =====================
const CampaignPerformanceComponent: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const [performance, setPerformance] = useState<CampaignPerformance | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/ai/campaign-performance-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ campaignId })
      });

      if (!response.ok) throw new Error('Failed to fetch performance data');
      const data = await response.json();
      setPerformance(data.summary);
    } catch (err) {
      console.error('Failed to fetch campaign performance:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin h-6 w-6 text-indigo-600 mr-2" />
        <span>Analyzing campaign performance...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading performance data</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center mb-4">
        <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">AI Performance Analysis</h3>
      </div>

      {performance ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
            <p className="text-blue-800">{performance.summary}</p>
          </div>

          {performance.insights && performance.insights.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Insights</h4>
              <ul className="space-y-2">
                {performance.insights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {performance.recommendations && performance.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
              <ul className="space-y-2">
                {performance.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <TargetIcon className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500">No performance data available.</p>
      )}
    </div>
  );
};

// =====================
// AI: Lookalike Audience - Fixed Version
// =====================
const LookalikeAudience: React.FC<{ baseSegmentId: string; onApply?: (rules: SegmentRules) => void }> = ({ baseSegmentId, onApply }) => {
  const [suggestions, setSuggestions] = useState<LookalikeSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLookalikeSuggestions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/ai/lookalike-audience`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ baseSegmentId })
      });
      if (!response.ok) throw new Error('Failed to fetch lookalike suggestions');
      const data = await response.json();
      
      console.log('Lookalike response:', data); // Debug log

      // Handle both response formats (array of suggestions or object with suggestions property)
      const suggestionsData = Array.isArray(data) ? data : (data.suggestions || []);
      
      const normalized: LookalikeSuggestion[] = suggestionsData.map((s: any) => ({
        rules: s?.rules ?? { operator: 'AND', conditions: [] },
        description: s?.description ?? s?.name ?? 'Suggested audience',
        estimatedSize: Number.isFinite(Number(s?.estimatedSize)) ? Number(s.estimatedSize) : 1000,
        similarityScore: Math.max(0, Math.min(100, parseInt(s?.similarityScore ?? 75, 10)))
      }));

      setSuggestions(normalized);
    } catch (err) {
      console.error('Failed to fetch lookalike audience:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [baseSegmentId]);

  useEffect(() => {
    fetchLookalikeSuggestions();
  }, [fetchLookalikeSuggestions]);

  const applySuggestion = (s: LookalikeSuggestion): void => {
    onApply ? onApply(s.rules) : alert('No apply handler wired');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin h-6 w-6 text-indigo-600 mr-2" />
        <span>Generating lookalike suggestions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading lookalike suggestions</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center mb-4">
        <UserCheck className="h-5 w-5 text-purple-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Lookalike Audience Suggestions</h3>
      </div>

      {suggestions.length > 0 ? (
        <div className="space-y-4">
          {suggestions.map((s, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl border">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-900">Suggestion {i + 1}</h4>
                <div className="flex items-center text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  <Target className="h-3 w-3 mr-1" />
                  {Math.round(s.similarityScore)}% match
                </div>
              </div>

              <p className="text-gray-700 mb-3">{s.description}</p>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Estimated audience: {(Number.isFinite(s.estimatedSize) ? s.estimatedSize : 1000).toLocaleString()} customers
                </div>
                <button
                  onClick={() => applySuggestion(s)}
                  className="flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Apply Rules
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No lookalike suggestions available.</p>
      )}
    </div>
  );
};

// =====================
// AI: Optimal Timing - Fixed Version
// =====================
const OptimalTiming: React.FC<{ audienceRules: SegmentRules }> = ({ audienceRules }) => {
  const [timing, setTiming] = useState<TimingRecommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOptimalTiming = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/api/ai/optimal-timing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ audienceRules })
      });

      if (!response.ok) throw new Error('Failed to fetch optimal timing');
      const data = await response.json();
      
      console.log('Optimal timing response:', data); // Debug log
      
      // Handle both response formats
      const timingData = data.timing || data;
      
      // Convert the backend response to the frontend expected format
      setTiming({
        bestTime: timingData.bestHours ? 
          timingData.bestHours.map((hour: number) => `${hour}:00`).join(', ') : 
          '10:00, 14:00, 16:00',
        bestDay: timingData.bestDays ? 
          timingData.bestDays.join(', ') : 
          'Tuesday, Wednesday, Thursday',
        explanation: timingData.reasoning || 'Based on general engagement patterns for similar audiences.',
        expectedEngagement: timingData.confidence ? 
          Math.round(timingData.confidence * 100) : 85
      });
    } catch (err) {
      console.error('Failed to fetch optimal timing:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [audienceRules]);

  useEffect(() => {
    if (
      audienceRules.conditions.length > 0 &&
      audienceRules.conditions.every(c => c.value.trim() !== '')
    ) {
      fetchOptimalTiming();
    }
  }, [audienceRules, fetchOptimalTiming]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="animate-spin h-5 w-5 text-indigo-600 mr-2" />
        <span className="text-sm">Analyzing optimal timing...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <p className="text-sm text-yellow-700">Could not determine optimal timing: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!timing) return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-100">
      <div className="flex items-center mb-2">
        <Calendar className="h-5 w-5 text-green-600 mr-2" />
        <h4 className="font-medium text-gray-900">Optimal Timing Suggestion</h4>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500">Best Day</p>
          <p className="font-medium">{timing.bestDay}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Best Time</p>
          <p className="font-medium">{timing.bestTime}</p>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-2">{timing.explanation}</p>

      <div className="flex items-center text-sm text-blue-600">
        <Zap className="h-4 w-4 mr-1" />
        Expected engagement: {timing.expectedEngagement}% higher
      </div>
    </div>
  );
};

// =====================
// Real-Time Stats
// =====================
// =====================
// Real-Time Stats - Fixed Version
// =====================
const RealTimeStatsComponent: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const [stats, setStats] = useState<RealTimeStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRealTimeStats = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${campaignId}/realtime`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch real-time stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch real-time stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchRealTimeStats();
    const interval = setInterval(fetchRealTimeStats, 5000);
    return () => clearInterval(interval);
  }, [fetchRealTimeStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin h-6 w-6 text-indigo-600 mr-2" />
        <span>Loading real-time statistics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading real-time stats</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return <p className="text-gray-500">No real-time data available.</p>;

  const sent = stats.statusDistribution.find(s => s._id === 'SENT')?.count || 0;
  const failed = stats.statusDistribution.find(s => s._id === 'FAILED')?.count || 0;
  const pending = stats.statusDistribution.find(s => s._id === 'PENDING')?.count || 0;
  const total = sent + failed + pending;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Activity className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Real-Time Campaign Analytics</h3>
        </div>
        <div className="flex items-center text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
          <Timer className="h-4 w-4 mr-1" />
          Live
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Messages Sent</span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{sent.toLocaleString()}</div>
          <div className="text-xs text-gray-500">
            {total > 0 ? `${((sent / total) * 100).toFixed(1)}% of total` : '0%'}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Messages Failed</span>
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{failed.toLocaleString()}</div>
          <div className="text-xs text-gray-500">
            {total > 0 ? `${((failed / total) * 100).toFixed(1)}% of total` : '0%'}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Messages Pending</span>
            <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{pending.toLocaleString()}</div>
          <div className="text-xs text-gray-500">
            {total > 0 ? `${((pending / total) * 100).toFixed(1)}% of total` : '0%'}
          </div>
        </div>
      </div>

      {stats.realTimeStats && (
        <div className="bg-blue-50 p-4 rounded-xl mb-6">
          <h4 className="font-medium text-blue-900 mb-3">Delivery Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-blue-700">Delivery Rate</p>
              <p className="text-lg font-semibold text-blue-900">
                {/* Fix: Ensure deliveryRate is treated as a number */}
                {typeof stats.realTimeStats.deliveryRate === 'number' 
                  ? stats.realTimeStats.deliveryRate.toFixed(1)
                  : parseFloat(stats.realTimeStats.deliveryRate || '0').toFixed(1)
                }%
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-700">Avg. Delivery Time</p>
              <p className="text-lg font-semibold text-blue-900">
                {/* Fix: Ensure avgDeliveryTime is properly handled */}
                {stats.realTimeStats.avgDeliveryTime 
                  ? `${typeof stats.realTimeStats.avgDeliveryTime === 'number' 
                      ? stats.realTimeStats.avgDeliveryTime.toFixed(1) 
                      : parseFloat(stats.realTimeStats.avgDeliveryTime).toFixed(1)}s` 
                  : 'N/A'
                }
              </p>
            </div>
          </div>

          {stats.realTimeStats.estimatedCompletion && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-xs text-blue-700 mb-1">Estimated Completion</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">
                  {stats.realTimeStats.estimatedCompletion.estimatedCompletion}
                </span>
                <span className="text-xs text-blue-600">
                  {stats.realTimeStats.estimatedCompletion.remainingMessages.toLocaleString()} messages remaining
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {stats.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center">
                  <div
                    className={`p-1 rounded-full mr-2 ${
                      activity.status === 'SENT'
                        ? 'bg-green-100'
                        : activity.status === 'FAILED'
                        ? 'bg-red-100'
                        : 'bg-yellow-100'
                    }`}
                  >
                    {activity.status === 'SENT' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : activity.status === 'FAILED' ? (
                      <XCircle className="h-3 w-3 text-red-600" />
                    ) : (
                      <Loader2 className="h-3 w-3 text-yellow-600 animate-spin" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700">Message to {activity.recipient}</span>
                </div>
                <span className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =====================
// Dashboard
// =====================
const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalCampaigns: 0,
    totalCustomers: 0,
    deliveryRate: 0,
    recentCampaigns: []
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (): Promise<void> => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
          <p className="text-gray-600">Welcome back! Here's what's happening with your campaigns today.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 bg-indigo-50 py-2 px-4 rounded-xl">
          <Clock className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Send className="h-7 w-7 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCampaigns}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+12%</span> from last month
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <Users className="h-7 w-7 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Customers Reached</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+24%</span> from last month
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-center">
            <div className={`p-3 rounded-xl ${stats.deliveryRate >= 90 ? 'bg-green-100' : stats.deliveryRate >= 70 ? 'bg-yellow-100' : 'bg-red-100'}`}>
              <TrendingUp className={`h-7 w-7 ${stats.deliveryRate >= 90 ? 'text-green-600' : stats.deliveryRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
              <p className="text-3xl font-bold text-gray-900">{stats.deliveryRate}%</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Industry average: 92% • {stats.deliveryRate >= 92 ? 'Above' : 'Below'} average</p>
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Recent Campaigns</h3>
            <button className="text-sm text-indigo-600 font-medium flex items-center hover:text-indigo-700">
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {stats.recentCampaigns.length > 0 ? (
            <div className="space-y-4">
              {stats.recentCampaigns.map((campaign) => (
                <div key={campaign._id} className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors duration-300">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-4 ${campaign.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {campaign.status === 'completed' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                      <p className="text-sm text-gray-500">Sent to {campaign.audienceSize.toLocaleString()} customers</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                    <div className="flex items-center mt-1 space-x-3 text-xs">
                      <span className="text-green-600">{campaign.stats.sent} sent</span>
                      <span className="text-red-600">{campaign.stats.failed} failed</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-full mb-4">
                <Send className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first campaign</p>
              <button className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                <HelpCircle className="h-5 w-5 mr-2" />
                Create Campaign
              </button>
            </div>
          )}
        </div>
      </div>

      
    </div>
  );
};

// =====================
// Campaign Manager
// =====================
const CampaignManager: React.FC<{ onApplyLookalike?: (rules: SegmentRules) => void }> = ({ onApplyLookalike }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // NEW: expand per-campaign insights
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/api/campaigns`, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data: Campaign[] = await response.json();
      setCampaigns(data);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete campaign');
      setCampaigns(campaigns.filter(c => c._id !== id));
    } catch (err) {
      console.error('Failed to delete campaign:', err);
      alert('Failed to delete campaign. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading campaigns</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchCampaigns}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Campaign Manager</h2>
          <p className="text-gray-600">Create, manage, and track your marketing campaigns</p>
        </div>
        <button
          onClick={() => (window.location.hash = '#segments')}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Campaign
        </button>
      </div>

      {campaigns.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-indigo-50">
            <h3 className="text-xl font-semibold text-gray-900">Your Campaigns</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {campaigns.map((campaign) => (
              <div key={campaign._id} className="p-6 hover:bg-gray-50 transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-4 ${campaign.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {campaign.status === 'completed' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{campaign.message}</p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <span className="mr-3">Sent to {campaign.audienceSize.toLocaleString()} customers</span>
                        <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right mr-4">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-green-600">{campaign.stats.sent} sent</span>
                        <span className="text-red-600">{campaign.stats.failed} failed</span>
                        <span className="text-gray-400">{campaign.stats.pending} pending</span>
                      </div>
                    </div>
                    <button
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors duration-300"
                      title={expandedCampaignId === campaign._id ? 'Hide Insights' : 'View Insights'}
                      onClick={() => setExpandedCampaignId(prev => (prev === campaign._id ? null : campaign._id))}
                    >
                      <Eye className={`h-5 w-5 ${expandedCampaignId === campaign._id ? 'text-indigo-600' : ''}`} />
                    </button>
                    <button
                      onClick={() => deleteCampaign(campaign._id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-300"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Insights Panel */}
                {expandedCampaignId === campaign._id && (
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="col-span-1">
                      <CampaignPerformanceComponent campaignId={campaign._id} />
                    </div>
                    <div className="col-span-1">
                      <RealTimeStatsComponent campaignId={campaign._id} />
                    </div>
                    <div className="col-span-1 lg:col-span-2">
                      <LookalikeAudience baseSegmentId={campaign._id} onApply={onApplyLookalike} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-full mb-4">
            <Send className="h-12 w-12 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-medium text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">Create your first campaign to start engaging with your customers through targeted messaging.</p>
          <button
            onClick={() => (window.location.hash = '#segments')}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium py-3 px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center mx-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Campaign
          </button>
        </div>
      )}
    </div>
  );
};

// =====================
// Segment Builder
// =====================
interface SegmentBuilderProps {
  onCampaignCreated: () => void;
  prefillRules?: SegmentRules | null;
  onPrefillConsumed?: () => void;
}

const SegmentBuilder: React.FC<SegmentBuilderProps> = ({ onCampaignCreated, prefillRules, onPrefillConsumed }) => {
  const [segmentName, setSegmentName] = useState<string>('');
  const [rules, setRules] = useState<SegmentRules>({
    operator: 'AND',
    conditions: [{ field: 'totalSpends', operator: '>', value: '' }]
  });
  const [message, setMessage] = useState<string>("Hi {name}, here's a special offer just for you!");
  const [aiDescription, setAiDescription] = useState<string>('');
  const [audienceSize, setAudienceSize] = useState<number | null>(null);
  const [messageSuggestions, setMessageSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Accept prefill from Lookalike
  useEffect(() => {
    if (prefillRules) {
      setRules(prefillRules);
      setSegmentName(prev => prev || 'Lookalike Audience Campaign');
      onPrefillConsumed?.();
      setAudienceSize(null);
    }
  }, [prefillRules, onPrefillConsumed]);

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
    setAudienceSize(null);
  };

  const previewAudience = async (): Promise<void> => {
    if (rules.conditions.some((c: SegmentCondition) => !c.value.trim())) {
      setErrors({ preview: 'Please fill in all condition values before previewing' });
      return;
    }

    setPreviewLoading(true);
    setErrors({});

    try {
      const response = await fetch(
        `${API_BASE}/api/campaigns/preview?rules=${encodeURIComponent(JSON.stringify(rules))}`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      setAudienceSize(data.audienceSize);
    } catch (error) {
      console.error('Failed to preview audience:', error);
      setErrors({ preview: 'Failed to preview audience. Please check your rules and try again.' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAISegment = async (): Promise<void> => {
    if (!aiDescription.trim()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_BASE}/api/ai/segment-from-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ description: aiDescription })
      });

      if (!response.ok) throw new Error('Failed to generate rules from AI');
      const data = await response.json();
      setRules(data.rules);
      setAiDescription('');
      setAudienceSize(null);
    } catch (error) {
      console.error('AI segment generation failed:', error);
      setErrors({ ai: 'Failed to generate rules. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getMessageSuggestions = async (): Promise<void> => {
    setLoading(true);
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
      setErrors({ messages: 'Failed to get AI suggestions. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!segmentName.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (!message.trim()) {
      newErrors.message = 'Campaign message is required';
    }

    if (rules.conditions.some((c: SegmentCondition) => !c.value.trim())) {
      newErrors.conditions = 'All condition values are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createCampaign = async (): Promise<void> => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }

      alert('Campaign created successfully! It will start processing shortly.');

      setSegmentName('');
      setRules({ operator: 'AND', conditions: [{ field: 'totalSpends', operator: '>', value: '' }] });
      setMessage("Hi {name}, here's a special offer just for you!");
      setAudienceSize(null);
      setMessageSuggestions([]);

      onCampaignCreated();
    } catch (error) {
      console.error('Failed to create campaign:', error);
      setErrors({ create: error instanceof Error ? error.message : 'Failed to create campaign' });
    } finally {
      setLoading(false);
    }
  };

  const fieldOptions = [
    { value: 'totalSpends', label: 'Total Spending (₹)' },
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Create Campaign</h2>
          <p className="text-gray-600">Build your audience and create personalized campaigns</p>
        </div>
      </div>

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {Object.values(errors).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1) AI Segment Builder */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center mb-4">
          <Brain className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">1) AI Segment Builder</h3>
          <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Beta</span>
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
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300"
                onKeyPress={(e) => e.key === 'Enter' && handleAISegment()}
              />
              <button
                onClick={handleAISegment}
                disabled={loading || !aiDescription.trim()}
                className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors duration-300"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                {loading ? 'Generating...' : 'Generate Rules'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Try: "High spenders with low engagement" or "New customers from last month"
            </p>
          </div>
        </div>
      </div>

      {/* 2) Segment Rules */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Segment Rules</h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              placeholder="Enter campaign name"
              className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audience Conditions <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {rules.conditions.map((condition, index) => (
                <div key={index} className="flex items-center space-x-2 p-4 bg-gray-50 rounded-xl border">
                  {index > 0 && (
                    <select
                      value={rules.operator}
                      onChange={(e) => setRules(prev => ({ ...prev, operator: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  )}

                  <select
                    value={condition.field}
                    onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white min-w-0 flex-1"
                  >
                    {fieldOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>

                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white min-w-0 flex-1"
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
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24 min-w-0"
                  />

                  {rules.conditions.length > 1 && (
                    <button
                      onClick={() => removeCondition(index)}
                      className="text-red-600 hover:text-red-700 p-1 transition-colors duration-300"
                      title="Remove condition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addCondition}
                className="flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors duration-300"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Condition
              </button>
            </div>
          </div>

          {/* Optimal Timing panel lives directly under rules */}
          <div className="bg-white rounded-2xl shadow-none border-none p-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Optimal Timing (AI)</h3>
              <p className="text-sm text-gray-600 mb-4">
                We’ll analyze your current audience rules and suggest the best day & time to send.
              </p>
              <OptimalTiming audienceRules={rules} />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center space-x-4">
              <button
                onClick={previewAudience}
                disabled={previewLoading || rules.conditions.some((c: SegmentCondition) => !c.value.trim())}
                className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors duration-300"
              >
                {previewLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {previewLoading ? 'Calculating...' : 'Preview Audience'}
              </button>

              {audienceSize !== null && (
                <div className="flex items-center text-sm text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="font-medium">{audienceSize.toLocaleString()}</span> customers
                </div>
              )}
            </div>

            {audienceSize !== null && (
              <div className="text-xs text-blue-600">
                {audienceSize === 0
                  ? 'No customers match these criteria'
                  : audienceSize < 10
                  ? 'Very small audience'
                  : audienceSize < 100
                  ? 'Small audience'
                  : audienceSize < 1000
                  ? 'Medium audience'
                  : 'Large audience'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3) Message Composer */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center mb-4">
          <Send className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Message Composer</h3>
        </div>

        <div className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
              errors.message ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Write your campaign message. Use {name} to personalize."
          />

        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={getMessageSuggestions}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors duration-300"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Get AI Suggestions
            </button>
            {messageSuggestions.length > 0 && (
              <span className="text-sm text-gray-500">{messageSuggestions.length} ideas</span>
            )}
          </div>
          <button
            onClick={createCampaign}
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Send className="h-4 w-4 mr-2" />
            Launch Campaign
          </button>
        </div>

        {messageSuggestions.length > 0 && (
          <div className="mt-6 space-y-3">
            {messageSuggestions.map((s, i) => (
              <div
                key={i}
                className="p-3 bg-gray-50 rounded-lg border flex items-start justify-between"
              >
                <p className="text-sm text-gray-700 pr-4">{s}</p>
                <button
                  onClick={() => setMessage(s)}
                  className="text-indigo-600 text-sm font-medium hover:text-indigo-700"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// =====================
// Insights View (Global)
// =====================
const InsightsView: React.FC<{ onApplyLookalike?: (rules: SegmentRules) => void }> = ({ onApplyLookalike }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/campaigns`, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Campaign[] = await res.json();
        setCampaigns(data);
        if (data.length) setSelectedId(data[0]._id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading insights</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Insights</h2>
          <p className="text-gray-600">AI performance analysis, live stats, and audience growth ideas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm bg-white"
          >
            {campaigns.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedId ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="col-span-1">
            <CampaignPerformanceComponent campaignId={selectedId} />
          </div>
          <div className="col-span-1">
            <RealTimeStatsComponent campaignId={selectedId} />
          </div>
          <div className="col-span-1 lg:col-span-2">
            <LookalikeAudience
              baseSegmentId={selectedId}
              onApply={(rules) => {
                if (onApplyLookalike) {
                  onApplyLookalike(rules);
                } else {
                  // fallback handoff
                  sessionStorage.setItem('prefillRules', JSON.stringify(rules));
                  window.location.hash = '#segments';
                  window.location.reload();
                }
              }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border p-10 text-center text-gray-500">
          No campaigns yet — create one to see insights here.
        </div>
      )}
    </div>
  );
};

export default CRMApp;
