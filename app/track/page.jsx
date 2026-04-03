"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, Building2, Sparkles, Search, AlertCircle, ArrowLeft } from 'lucide-react';

function TrackingContent() {
  const searchParams = useSearchParams();
  const [complaintId, setComplaintId] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setComplaintId(idFromUrl);
      fetchComplaint(idFromUrl);
    }
  }, [searchParams]);

  const fetchComplaint = async (id) => {
    if (!id.trim()) {
      setError('Please enter a complaint ID');
      return;
    }
    setLoading(true);
    setError('');
    setComplaint(null);

    try {
      const response = await fetch(`/api/complaints/${id}`);
      const data = await response.json();

      if (data.success) {
        setComplaint(data.complaint);
      } else {
        setError('Complaint not found. Please check your ID and try again.');
      }
    } catch (err) {
      setError('Failed to fetch complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTimelineStages = (complaint) => {
    if (!complaint) return [];

    const createdAt = new Date(complaint.createdAt);
    const now = new Date();
    const hoursPassed = (now - createdAt) / (1000 * 60 * 60);

    const stages = [
      {
        id: 1,
        title: 'Complaint Submitted',
        description: 'Your complaint has been received and recorded in our system.',
        icon: '📋',
        completedAt: createdAt.toLocaleString(),
        done: true,
      },
      {
        id: 2,
        title: 'Under Review',
        description: 'Our team is reviewing your complaint and verifying the details.',
        icon: '🔍',
        completedAt: hoursPassed >= 1 ? new Date(createdAt.getTime() + 1 * 60 * 60 * 1000).toLocaleString() : null,
        done: hoursPassed >= 1,
      },
      {
        id: 3,
        title: 'Assigned to Department',
        description: `Complaint has been assigned to ${complaint.department}.`,
        icon: '🏢',
        completedAt: hoursPassed >= 6 ? new Date(createdAt.getTime() + 6 * 60 * 60 * 1000).toLocaleString() : null,
        done: hoursPassed >= 6,
      },
      {
        id: 4,
        title: 'In Progress',
        description: 'The department is actively working on resolving your complaint.',
        icon: '⚙️',
        completedAt: hoursPassed >= 24 ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toLocaleString() : null,
        done: hoursPassed >= 24,
      },
      {
        id: 5,
        title: 'Resolved',
        description: 'Your complaint has been successfully resolved. Thank you for your patience!',
        icon: '✅',
        completedAt: null,
        done: false,
      },
    ];

    return stages;
  };

  const getOverallStatus = (stages) => {
    const doneCount = stages.filter(s => s.done).length;
    if (doneCount === stages.length) return { label: 'Resolved', color: 'text-green-600', bg: 'bg-green-100' };
    if (doneCount >= 3) return { label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (doneCount >= 2) return { label: 'Under Review', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Submitted', color: 'text-purple-600', bg: 'bg-purple-100' };
  };

  const stages = complaint ? getTimelineStages(complaint) : [];
  const status = complaint ? getOverallStatus(stages) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  GrievEase
                </h1>
                <p className="text-sm text-gray-600">Complaint Tracking</p>
              </div>
            </div>
            <a
              href="/"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Track Your Complaint</h2>
          <p className="text-gray-500 mb-6">Enter your complaint ID to see the current status</p>
          <div className="flex space-x-3">
            <input
              type="text"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              placeholder="Enter your Complaint ID..."
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              onKeyDown={(e) => e.key === 'Enter' && fetchComplaint(complaintId)}
            />
            <button
              onClick={() => fetchComplaint(complaintId)}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>Track</span>
            </button>
          </div>
          {error && (
            <div className="mt-4 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Complaint Details + Timeline */}
        {complaint && (
          <div className="space-y-6 animate-fadeIn">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Complaint Details</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-semibold text-gray-900">{complaint.category}</p>
                </div>
                <div>
                  <p className="text-gray-500">Priority</p>
                  <p className={`font-semibold ${
                    complaint.priority === 'High' ? 'text-red-600' :
                    complaint.priority === 'Medium' ? 'text-yellow-600' : 'text-blue-600'
                  }`}>{complaint.priority}</p>
                </div>
                <div>
                  <p className="text-gray-500">Department</p>
                  <p className="font-semibold text-gray-900">{complaint.department}</p>
                </div>
                <div>
                  <p className="text-gray-500">Est. Resolution</p>
                  <p className="font-semibold text-gray-900">{complaint.estimatedTime}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Submitted On</p>
                  <p className="font-semibold text-gray-900">{new Date(complaint.createdAt).toLocaleString()}</p>
                </div>
                {complaint.description && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Description</p>
                    <p className="font-semibold text-gray-900">{complaint.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Complaint Timeline</h3>
              <div className="relative">
                {stages.map((stage, index) => (
                  <div key={stage.id} className="flex items-start space-x-4 mb-6 last:mb-0">
                    {/* Line connector */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                        stage.done ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {stage.done ? '✅' : stage.icon}
                      </div>
                      {index < stages.length - 1 && (
                        <div className={`w-0.5 h-8 mt-1 ${stage.done ? 'bg-green-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-semibold ${stage.done ? 'text-gray-900' : 'text-gray-400'}`}>
                          {stage.title}
                        </h4>
                        {stage.done && stage.completedAt && (
                          <span className="text-xs text-green-600 font-medium">{stage.completedAt}</span>
                        )}
                        {!stage.done && (
                          <span className="text-xs text-gray-400">Pending</span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${stage.done ? 'text-gray-600' : 'text-gray-400'}`}>
                        {stage.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <TrackingContent />
    </Suspense>
  );
}
