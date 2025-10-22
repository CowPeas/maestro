'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Threat, Mitigation } from '@/lib/db/schema';

interface ThreatWithMitigations extends Threat {
  mitigations: Mitigation[];
}

interface ThreatsListEnhancedProps {
  threats: ThreatWithMitigations[];
}

export default function ThreatsListEnhanced({ threats: initialThreats }: ThreatsListEnhancedProps) {
  const [threats, setThreats] = useState(initialThreats);
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const router = useRouter();

  // Filter and search threats
  const filteredThreats = useMemo(() => {
    return threats.filter(threat => {
      const matchesSearch = 
        threat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        threat.layer.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesClassification = 
        classificationFilter === 'all' || threat.classification === classificationFilter;
      
      const matchesStatus = 
        statusFilter === 'all' || threat.status === statusFilter;

      return matchesSearch && matchesClassification && matchesStatus;
    });
  }, [threats, searchTerm, classificationFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredThreats.length / pageSize);
  const paginatedThreats = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredThreats.slice(startIndex, startIndex + pageSize);
  }, [filteredThreats, currentPage, pageSize]);

  // Handle status update
  const handleStatusUpdate = async (threatId: number, newStatus: string) => {
    setUpdatingId(threatId);
    try {
      const response = await fetch(`/api/threats/${threatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const { threat: updatedThreat } = await response.json();
        setThreats(prev => 
          prev.map(t => t.id === threatId ? updatedThreat : t)
        );
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update threat:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  // Export functions
  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredThreats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maestro-threats-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Description', 'Classification', 'Status', 'Layer', 'Likelihood', 'Impact', 'Created'];
    const rows = filteredThreats.map(t => [
      t.id,
      `"${t.description.replace(/"/g, '""')}"`,
      t.classification,
      t.status,
      t.layer,
      t.likelihood,
      t.impact,
      new Date(t.createdAt).toISOString(),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maestro-threats-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search threats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          
          <div>
            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">All Risk Levels</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Export and Results */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {paginatedThreats.length} of {filteredThreats.length} threats
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportToJSON}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Export JSON
            </button>
            <button
              onClick={exportToCSV}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Threats List */}
      <div className="space-y-4">
        {paginatedThreats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No threats found matching your filters.
          </div>
        ) : (
          paginatedThreats.map((threat) => (
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
                    <select
                      value={threat.status}
                      onChange={(e) => handleStatusUpdate(threat.id, e.target.value)}
                      disabled={updatingId === threat.id}
                      className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(threat.status)} ${
                        updatingId === threat.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
                      }`}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
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
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border rounded text-sm text-gray-900"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
