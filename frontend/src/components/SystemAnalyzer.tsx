import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { analyzeSystem } from '../store/slices/threatsSlice';

const SystemAnalyzer: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await dispatch(analyzeSystem(input)).unwrap();
      setInput('');
    } catch (err) {
      setError('Failed to analyze system. Please try again.');
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
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            System Description
          </label>
          <textarea
            id="system-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Enter your system architecture or description here..."
            required
          />
        </div>
        {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze System'}
        </button>
      </form>
    </div>
  );
};

export default SystemAnalyzer; 