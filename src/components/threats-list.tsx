'use client';

import { Threat, Mitigation } from '@/lib/db/schema';

interface ThreatWithMitigations extends Threat {
  mitigations: Mitigation[];
}

interface ThreatsListProps {
  threats: ThreatWithMitigations[];
}

export default function ThreatsList({ threats }: ThreatsListProps) {
  const getRiskColor = (classification: string) => {
    switch (classification) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-purple-100 text-purple-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {threats.map((threat) => (
        <div
          key={threat.id}
          className={`border rounded-lg p-4 ${getRiskColor(threat.classification)} border`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(threat.classification)}`}>
                  {threat.classification} Risk
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(threat.status)}`}>
                  {threat.status}
                </span>
                <span className="text-xs text-gray-600">
                  {threat.layer}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 mt-2">
                {threat.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
            <div>
              <span className="text-gray-600">Likelihood:</span>
              <div className="flex items-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${
                      i < threat.likelihood ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Impact:</span>
              <div className="flex items-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${
                      i < threat.impact ? 'text-red-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ))}
              </div>
            </div>
          </div>

          {threat.mitigations && threat.mitigations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                Mitigations ({threat.mitigations.length})
              </h4>
              <ul className="space-y-1">
                {threat.mitigations.slice(0, 3).map((mitigation) => (
                  <li
                    key={mitigation.id}
                    className="text-xs text-gray-600 flex items-start"
                  >
                    <span className="mr-2">•</span>
                    <span>{mitigation.description}</span>
                  </li>
                ))}
                {threat.mitigations.length > 3 && (
                  <li className="text-xs text-gray-500 italic">
                    + {threat.mitigations.length - 3} more...
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="mt-3 text-xs text-gray-500">
            Created: {new Date(threat.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
