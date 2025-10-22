'use client';

import { useEffect, useState } from 'react';

interface Alert {
  id: number;
  title: string;
  description: string;
  severity: string;
  layer: string;
  status: string;
  detectedAt: Date;
}

interface Stats {
  activeAlerts: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  todayCount: number;
}

export default function DetectionMonitor({ userId }: { userId: number }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchAlerts() {
    try {
      const res = await fetch('/api/detection/alerts');
      const data = await res.json();
      setAlerts(data.alerts);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runScan() {
    setScanning(true);
    try {
      const res = await fetch('/api/detection/scan', { method: 'POST' });
      const data = await res.json();
      alert(`✅ Scan complete: ${data.detections.length} new alerts`);
      await fetchAlerts();
    } catch (error) {
      alert('❌ Scan failed');
    } finally {
      setScanning(false);
    }
  }

  async function handleAlert(id: number, action: string) {
    try {
      await fetch(`/api/detection/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await fetchAlerts();
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      Critical: 'bg-red-100 text-red-800 border-red-500',
      High: 'bg-orange-100 text-orange-800 border-orange-500',
      Medium: 'bg-yellow-100 text-yellow-800 border-yellow-500',
      Low: 'bg-green-100 text-green-800 border-green-500',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-blue-600">{stats?.activeAlerts || 0}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-red-600">{stats?.criticalCount || 0}</div>
          <div className="text-sm text-gray-600">Critical</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-orange-600">{stats?.highCount || 0}</div>
          <div className="text-sm text-gray-600">High</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-yellow-600">{stats?.mediumCount || 0}</div>
          <div className="text-sm text-gray-600">Medium</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-green-600">{stats?.lowCount || 0}</div>
          <div className="text-sm text-gray-600">Low</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-purple-600">{stats?.todayCount || 0}</div>
          <div className="text-sm text-gray-600">Today</div>
        </div>
      </div>

      {/* Scan Button */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">🔍 AI Anomaly Scanner</h3>
            <p className="text-sm text-gray-600">Scan for threat patterns and anomalies using Gemini AI</p>
          </div>
          <button
            onClick={runScan}
            disabled={scanning}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition disabled:opacity-50 font-medium shadow-lg"
          >
            {scanning ? '⏳ Scanning...' : '🚀 Run Scan'}
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🚨 Active Alerts ({alerts.length})</h3>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No active alerts. System is secure! ✅</div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="text-sm text-gray-600">{alert.layer}</span>
                      <span className="text-xs text-gray-500">{new Date(alert.detectedAt).toLocaleString()}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{alert.title}</h4>
                    <p className="text-sm text-gray-700">{alert.description}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleAlert(alert.id, 'acknowledge')}
                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                    >
                      ✓ Ack
                    </button>
                    <button
                      onClick={() => handleAlert(alert.id, 'resolve')}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      ✓ Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
