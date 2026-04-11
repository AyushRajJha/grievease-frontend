"use client";
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, Sparkles, ArrowLeft, AlertCircle, Moon, Sun, Menu, X
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import ComplaintSidebar from '@/components/ComplaintSidebar';
import ComplaintDetails from '@/components/ComplaintDetails';

const MAX_HISTORY = 10;

function saveToHistory(complaint) {
  if (!complaint) return;
  try {
    const stored = JSON.parse(localStorage.getItem('complaintHistory') || '[]');
    const entry = {
      id: String(complaint._id),
      category: complaint.category,
      priority: complaint.priority,
      department: complaint.department,
      timestamp: new Date().toISOString(),
    };
    const filtered = stored.filter(item => item.id !== entry.id);
    const updated = [entry, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem('complaintHistory', JSON.stringify(updated));
  } catch {
    // localStorage unavailable — skip silently
  }
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const { isDark, toggleTheme } = useTheme();

  const [inputId, setInputId] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [historyVersion, setHistoryVersion] = useState(0);

  const fetchComplaint = useCallback(async (id) => {
    const trimmed = (id || '').trim();
    if (!trimmed) {
      setError('Please enter a complaint ID.');
      return;
    }
    setLoading(true);
    setError('');
    setComplaint(null);

    try {
      const res = await fetch(`/api/complaints/${trimmed}`);
      const data = await res.json();
      if (data.success) {
        setComplaint(data.complaint);
        setActiveId(String(data.complaint._id));
        saveToHistory(data.complaint);
        setHistoryVersion(v => v + 1); // signal sidebar to refresh
      } else {
        setError(data.error === 'Invalid complaint ID'
          ? 'Invalid complaint ID format. Please check and try again.'
          : 'Complaint not found. Please verify your ID.');
      }
    } catch {
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch from ?id= query param on first load
  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setInputId(idFromUrl);
      fetchComplaint(idFromUrl);
    }
  }, [searchParams, fetchComplaint]);

  const handleSidebarSelect = (id) => {
    setInputId(id);
    fetchComplaint(id);
    setSidebarOpen(false); // collapse on mobile after selection
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 z-20">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">

          {/* Left — logo + back */}
          <div className="flex items-center space-x-4">
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle sidebar"
              className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg shadow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  GrievEase
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Complaint Tracking</p>
              </div>
            </div>
          </div>

          {/* Right — back + theme */}
          <div className="flex items-center space-x-3">
            <a
              href="/"
              className="flex items-center space-x-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </a>
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Body: sidebar + main ────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — fixed width on desktop, drawer on mobile */}
        <>
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          <div
            className={`
              fixed inset-y-0 left-0 z-40 w-72 pt-[65px] transition-transform duration-300 ease-in-out
              lg:static lg:inset-auto lg:z-auto lg:pt-0 lg:w-64 lg:flex-shrink-0
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            <div className="h-full lg:h-[calc(100vh-65px)] overflow-hidden">
              <ComplaintSidebar
                activeId={activeId}
                onSelect={handleSidebarSelect}
                refreshKey={historyVersion}
              />
            </div>
          </div>
        </>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 lg:py-10">
          <div className="max-w-2xl mx-auto">

            {/* Search bar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">Track Your Complaint</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Enter your complaint ID to view status and details</p>

              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={inputId}
                    onChange={(e) => setInputId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchComplaint(inputId)}
                    placeholder="Paste complaint ID here…"
                    aria-label="Complaint ID"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-mono text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all"
                  />
                </div>
                <button
                  onClick={() => fetchComplaint(inputId)}
                  disabled={loading}
                  aria-label="Track complaint"
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm flex items-center space-x-2 flex-shrink-0"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Track</span>
                </button>
              </div>

              {error && (
                <div role="alert" className="mt-3 flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-2.5 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-4" aria-live="polite" aria-label="Loading complaint details">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {/* Complaint details */}
            {!loading && complaint && (
              <ComplaintDetails complaint={complaint} />
            )}

            {/* Empty state */}
            {!loading && !complaint && !error && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 mb-4">
                  <Search className="w-8 h-8 text-indigo-400 dark:text-indigo-500" />
                </div>
                <p className="text-base font-semibold text-gray-500 dark:text-gray-400">No complaint loaded</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-xs mx-auto">
                  Enter a complaint ID above, or select a recent complaint from the sidebar.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
