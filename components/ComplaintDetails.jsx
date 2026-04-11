"use client";
import { useState } from 'react';
import {
  Copy, CheckCircle2, Clock, Building2, BarChart2, Zap,
  AlertCircle, Share2, Tag, FileText, Smile, Brain
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const PRIORITY_CONFIG = {
  High: { label: 'High', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-700', dot: 'bg-red-500' },
  Medium: { label: 'Medium', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700', dot: 'bg-yellow-500' },
  Low: { label: 'Low', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-700', dot: 'bg-blue-500' },
};

const URGENCY_CONFIG = {
  immediate: 'text-red-600 dark:text-red-400',
  high: 'text-orange-600 dark:text-orange-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-green-600 dark:text-green-400',
};

const SENTIMENT_CONFIG = {
  negative: { label: 'Negative', color: 'text-red-600 dark:text-red-400', icon: '😞' },
  neutral: { label: 'Neutral', color: 'text-gray-600 dark:text-gray-400', icon: '😐' },
  positive: { label: 'Positive', color: 'text-green-600 dark:text-green-400', icon: '😊' },
};

function getTimelineStages(complaint) {
  const createdAt = new Date(complaint.createdAt);
  const hoursPassed = (Date.now() - createdAt.getTime()) / 3600000;

  return [
    { id: 1, title: 'Submitted', description: 'Complaint received and recorded.', icon: '📋', completedAt: createdAt.toLocaleString(), done: true },
    { id: 2, title: 'Under Review', description: 'Team is reviewing your complaint.', icon: '🔍', completedAt: hoursPassed >= 1 ? new Date(createdAt.getTime() + 3600000).toLocaleString() : null, done: hoursPassed >= 1 },
    { id: 3, title: 'Assigned', description: `Assigned to ${complaint.department}.`, icon: '🏢', completedAt: hoursPassed >= 6 ? new Date(createdAt.getTime() + 21600000).toLocaleString() : null, done: hoursPassed >= 6 },
    { id: 4, title: 'In Progress', description: 'Department is actively working on it.', icon: '⚙️', completedAt: hoursPassed >= 24 ? new Date(createdAt.getTime() + 86400000).toLocaleString() : null, done: hoursPassed >= 24 },
    { id: 5, title: 'Resolved', description: 'Complaint successfully resolved.', icon: '✅', completedAt: null, done: false },
  ];
}

function getProgressPercent(stages) {
  const done = stages.filter(s => s.done).length;
  return Math.round((done / stages.length) * 100);
}

function InfoCard({ icon: Icon, label, value, valueClass = '' }) {
  return (
    <div className="flex items-start space-x-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
      <div className="p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
        <Icon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5 truncate ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

export default function ComplaintDetails({ complaint }) {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  if (!complaint) return null;

  const stages = getTimelineStages(complaint);
  const progress = getProgressPercent(stages);
  const doneCount = stages.filter(s => s.done).length;
  const priority = PRIORITY_CONFIG[complaint.priority] || PRIORITY_CONFIG.Low;
  const sentiment = SENTIMENT_CONFIG[complaint.sentiment?.toLowerCase()] || SENTIMENT_CONFIG.neutral;
  const urgencyClass = URGENCY_CONFIG[complaint.urgency?.toLowerCase()] || 'text-gray-600 dark:text-gray-400';

  const overallStatusLabel =
    doneCount === stages.length ? 'Resolved' :
    doneCount >= 3 ? 'In Progress' :
    doneCount >= 2 ? 'Under Review' : 'Submitted';

  const overallStatusStyle =
    doneCount === stages.length ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700' :
    doneCount >= 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700' :
    doneCount >= 2 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700' :
    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-700';

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(complaint._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  };

  const shareComplaint = async () => {
    const url = `${window.location.origin}/track?id=${complaint._id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'GrievEase Complaint', url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShareMsg('Link copied!');
      setTimeout(() => setShareMsg(''), 2000);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* Top bar — ID + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Complaint ID</p>
          <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{complaint._id}</p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={copyId}
            aria-label="Copy complaint ID"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy ID'}</span>
          </button>
          <button
            onClick={shareComplaint}
            aria-label="Share complaint"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{shareMsg || 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Progress + Status */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 px-5 py-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Resolution Progress</h3>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${overallStatusStyle}`}>
            {overallStatusLabel}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>Submitted</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{progress}%</span>
          <span>Resolved</span>
        </div>
      </div>

      {/* Info grid */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 px-5 py-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Complaint Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard icon={Tag} label="Category" value={complaint.category} />
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
            <div className="p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
              <AlertCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Priority</p>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-lg text-xs font-semibold ${priority.badge}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${priority.dot}`} />
                {priority.label}
              </span>
            </div>
          </div>
          <InfoCard icon={Building2} label="Department" value={complaint.department} />
          <InfoCard icon={Clock} label="Est. Resolution" value={complaint.estimatedTime} />
          <InfoCard
            icon={Clock}
            label="Submitted On"
            value={new Date(complaint.createdAt).toLocaleString()}
          />
          {complaint.urgency && (
            <div className="flex items-start space-x-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
              <div className="p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
                <Zap className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Urgency</p>
                <p className={`text-sm font-semibold capitalize mt-0.5 ${urgencyClass}`}>{complaint.urgency}</p>
              </div>
            </div>
          )}
          {typeof complaint.confidence === 'number' && (
            <InfoCard
              icon={Brain}
              label="AI Confidence"
              value={`${(complaint.confidence * 100).toFixed(1)}%`}
              valueClass="text-indigo-600 dark:text-indigo-400"
            />
          )}
          {complaint.sentiment && (
            <div className="flex items-start space-x-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
              <div className="p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
                <Smile className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sentiment</p>
                <p className={`text-sm font-semibold mt-0.5 ${sentiment.color}`}>
                  {sentiment.icon} {sentiment.label}
                </p>
              </div>
            </div>
          )}
          {complaint.emotion && (
            <InfoCard icon={Smile} label="Emotion" value={complaint.emotion} />
          )}
        </div>

        {/* Description */}
        {complaint.description && (
          <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</p>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{complaint.description}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 px-5 py-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-5">Complaint Timeline</h3>
        <ol aria-label="Status timeline" className="relative">
          {stages.map((stage, idx) => (
            <li key={stage.id} className="flex items-start space-x-4 pb-6 last:pb-0 relative">
              {/* Vertical connector */}
              {idx < stages.length - 1 && (
                <div
                  className={`absolute left-[18px] top-8 bottom-0 w-0.5 ${stage.done ? 'bg-indigo-200 dark:bg-indigo-800' : 'bg-gray-200 dark:bg-gray-700'}`}
                  aria-hidden="true"
                />
              )}

              {/* Icon bubble */}
              <div
                className={`relative z-10 w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-base transition-all ${
                  stage.done
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
                aria-hidden="true"
              >
                {stage.done ? '✅' : stage.icon}
              </div>

              {/* Text */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <p className={`text-sm font-semibold ${stage.done ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                    {stage.title}
                  </p>
                  {stage.done && stage.completedAt ? (
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{stage.completedAt}</span>
                  ) : !stage.done ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">Pending</span>
                  ) : null}
                </div>
                <p className={`text-xs mt-0.5 ${stage.done ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>
                  {stage.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
