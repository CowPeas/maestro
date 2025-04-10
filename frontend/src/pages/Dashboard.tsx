import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import SystemAnalyzer from '../components/SystemAnalyzer';

const Dashboard: React.FC = () => {
  const username = useSelector((state: RootState) => state.auth.user);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {username}!</h1>
        <p className="mt-2 text-gray-600">
          This is your MAESTRO dashboard. Here you can analyze and manage system threats.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">System Analysis</h2>
        <SystemAnalyzer />
      </div>
    </div>
  );
};

export default Dashboard; 