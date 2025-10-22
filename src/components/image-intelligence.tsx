'use client';

import { useState, useEffect } from 'react';

interface GeolocationResult {
  location: string;
  coordinates: string | null;
  landmarks: string[];
  confidence: number;
  environmentalContext: string;
  securityIndicators: string[];
  fullAnalysis: string;
  reasoning: string;
}

export default function ImageIntelligence({ userId }: { userId: number }) {
  const [imageUrl, setImageUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<GeolocationResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch('/api/intelligence/history?limit=5');
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  }

  async function analyzeImage() {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }

    setAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/intelligence/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.analysis);
        await fetchHistory();
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setAnalyzing(false);
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 Analyze Image</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg or data:image/jpeg;base64,..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports: HTTP(S) URLs, base64 data URIs
            </p>
          </div>

          {imageUrl && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="max-h-64 mx-auto rounded"
                onError={() => setError('Failed to load image')}
              />
            </div>
          )}

          <button
            onClick={analyzeImage}
            disabled={analyzing || !imageUrl}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 font-medium shadow-lg"
          >
            {analyzing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing with Gemini 2.0 Flash...
              </span>
            ) : (
              '🚀 Analyze Location'
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📍 Analysis Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Location</div>
              <div className="text-lg font-bold text-gray-900">{result.location}</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Confidence</div>
              <div className={`text-2xl font-bold ${getConfidenceColor(result.confidence)}`}>
                {result.confidence}%
              </div>
            </div>

            {result.coordinates && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Coordinates</div>
                <div className="text-lg font-mono text-gray-900">{result.coordinates}</div>
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Environment</div>
              <div className="text-sm text-gray-900">{result.environmentalContext}</div>
            </div>
          </div>

          {result.landmarks.length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-2">🏛️ Landmarks Identified</h4>
              <div className="flex flex-wrap gap-2">
                {result.landmarks.map((landmark, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {landmark}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.securityIndicators.length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-2">🛡️ Security Indicators</h4>
              <ul className="space-y-1">
                {result.securityIndicators.map((indicator, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-red-600 mt-0.5">⚠️</span>
                    <span className="text-gray-700">{indicator}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-6">
            <h4 className="font-bold text-gray-900 mb-2">💡 Reasoning</h4>
            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">{result.reasoning}</p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-2">📄 Full Analysis</h4>
            <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
              {result.fullAnalysis}
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📚 Recent Analyses</h3>
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{item.location}</div>
                    <div className="text-sm text-gray-600">
                      Confidence: {item.confidence}% • {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{item.fileName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
