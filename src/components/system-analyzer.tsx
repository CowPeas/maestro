'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SystemAnalyzer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setSuccess(`Analysis completed! Found ${data.threatsCount} threats.`);
      setInput('');
      
      // Refresh the page to show new threats
      router.refresh();
    } catch (err) {
      setError((err as Error).message || 'Failed to analyze system');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="system-input"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            System Description
          </label>
          <textarea
            id="system-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            rows={6}
            placeholder="Describe your system architecture, components, data flows, and integrations...&#10;&#10;Example: We have a web application with a React frontend, Node.js backend API, PostgreSQL database, and Redis cache. Users authenticate via OAuth2, and we integrate with Stripe for payments..."
            required
            minLength={20}
          />
          <p className="mt-1 text-sm text-gray-500">
            Minimum 20 characters. Be as detailed as possible for better threat identification.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Analyzing system...
            </span>
          ) : (
            'Analyze System'
          )}
        </button>
      </form>
    </div>
  );
}
