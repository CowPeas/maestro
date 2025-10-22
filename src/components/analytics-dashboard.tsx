'use client';

import { useEffect, useState } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  totalThreats: number;
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  layerDistribution: Record<string, number>;
  avgRiskScore: number;
  trends: {
    date: string;
    threatCount: number;
    avgRisk: number;
  }[];
  predictions: {
    predictedThreat: string;
    layer: string;
    confidence: number;
    predictedLikelihood: number;
    predictedImpact: number;
    reasoning: string;
    recommendedActions: string[];
  }[];
}

export default function AnalyticsDashboard({ userId }: { userId: number }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generatePredictions() {
    setGenerating(true);
    try {
      const response = await fetch('/api/analytics/predict', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        await fetchAnalytics(); // Refresh data
        alert(`✅ ${data.predictions.length} predictions generated successfully!`);
      } else {
        alert(data.message || 'Failed to generate predictions');
      }
    } catch (error) {
      console.error('Failed to generate predictions:', error);
      alert('Failed to generate predictions');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics || analytics.totalThreats === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Analytics Data Yet</h3>
        <p className="text-gray-600 mb-6">
          Analyze some systems to generate threat data, then return here for AI-powered predictions and insights.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    );
  }

  const riskChartData = {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [
      {
        data: [
          analytics.riskDistribution.high,
          analytics.riskDistribution.medium,
          analytics.riskDistribution.low,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(251, 146, 60)',
          'rgb(34, 197, 94)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const layerLabels = Object.keys(analytics.layerDistribution);
  const layerData = Object.values(analytics.layerDistribution);

  const layerChartData = {
    labels: layerLabels,
    datasets: [
      {
        label: 'Threats by Layer',
        data: layerData,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
    ],
  };

  const trendChartData = {
    labels: analytics.trends.map(t => t.date),
    datasets: [
      {
        label: 'Threat Count',
        data: analytics.trends.map(t => t.threatCount),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Avg Risk Score',
        data: analytics.trends.map(t => t.avgRisk),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Threats</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalThreats}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{analytics.riskDistribution.high}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Risk Score</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{analytics.avgRiskScore.toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Predictions</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{analytics.predictions.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={riskChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Layer Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">PAWAEYE Layer Distribution</h3>
          <div className="h-64">
            <Bar
              data={layerChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      {analytics.trends.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Threat Trends Over Time</h3>
          <div className="h-64">
            <Line
              data={trendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* AI Predictions Section */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🔮 AI-Powered Predictions
              <span className="text-sm font-normal text-gray-600">(Gemini 2.5 Flash)</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Future threats predicted based on your historical patterns
            </p>
          </div>
          <button
            onClick={generatePredictions}
            disabled={generating}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              '⚡ Generate New Predictions'
            )}
          </button>
        </div>

        {analytics.predictions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No predictions generated yet. Click the button above to generate AI-powered predictions!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analytics.predictions.map((prediction, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {prediction.layer}
                      </span>
                      <span className="text-sm text-gray-600">
                        Confidence: <span className="font-bold text-purple-600">{prediction.confidence}%</span>
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {prediction.predictedThreat}
                    </h4>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-600">Likelihood</div>
                      <div className="text-lg font-bold text-orange-600">{prediction.predictedLikelihood}/5</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600">Impact</div>
                      <div className="text-lg font-bold text-red-600">{prediction.predictedImpact}/5</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">💡 Reasoning:</p>
                  <p className="text-sm text-gray-600">{prediction.reasoning}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">🎯 Recommended Actions:</p>
                  <ul className="space-y-1">
                    {prediction.recommendedActions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
