"use client";
import { useState, useEffect } from 'react';
import { Search, Trash2, Clock, ChevronRight, FileText, X, AlertCircle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const PRIORITY_STYLES = {
  High: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  Low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};

const PRIORITY_DOT = {
  High: 'bg-red-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-blue-500',
};

function timeAgo(dateString) {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ComplaintSidebar({ activeId, onSelect }) {
  const { isDark } = useTheme();
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('complaintHistory') || '[]');
      setHistory(stored);
    } catch {
      setHistory([]);
    }
  }, [activeId]); // re-read when active selection changes (new item may have been added)

  const filtered = history.filter((item) => {
    const q = query.toLowerCase();
    return (
      item.id.toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q) ||
      (item.department || '').toLowerCase().includes(q)
    );
  });

  const clearHistory = () => {
    localStorage.removeItem('complaintHistory');
    setHistory([]);
    setShowClearConfirm(false);
  };

  return (
    <aside
      aria-label="Recent complaints"
      className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
    >
      {/* Sidebar header */}
      <div className="px-4 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Recent Complaints</span>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              aria-label="Clear history"
              className="p-1 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search complaints…"
            aria-label="Search complaints"
            className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Clear confirmation */}
      {showClearConfirm && (
        <div className="mx-3 mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs">
          <p className="text-red-700 dark:text-red-300 font-medium mb-2">Clear all history?</p>
          <div className="flex space-x-2">
            <button
              onClick={clearHistory}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-lg font-semibold transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 py-1.5 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <nav
        aria-label="Complaint history list"
        className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2 scrollbar-thin"
      >
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            {query ? (
              <>
                <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs text-gray-400 dark:text-gray-500">No complaints match "{query}"</p>
              </>
            ) : (
              <>
                <FileText className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" />
                <p className="text-sm font-medium text-gray-400 dark:text-gray-500">No history yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Complaints you track will appear here</p>
              </>
            )}
          </div>
        )}

        {filtered.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`View complaint ${item.category || item.id}`}
              className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-150 group flex items-start space-x-3 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent'
              }`}
            >
              {/* Priority dot */}
              <span
                className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[item.priority] || 'bg-gray-400'}`}
                aria-hidden="true"
              />

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${
                  isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {item.category || 'Unknown Category'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate font-mono mt-0.5">
                  #{item.id.slice(-8)}
                </p>
                <div className="flex items-center space-x-1.5 mt-1.5">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${PRIORITY_STYLES[item.priority] || 'bg-gray-100 text-gray-600'}`}>
                    {item.priority || 'N/A'}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(item.timestamp)}</span>
                </div>
              </div>

              <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 mt-1 transition-transform duration-150 ${
                isActive ? 'text-indigo-500 translate-x-0.5' : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500'
              }`} />
            </button>
          );
        })}
      </nav>

      {/* Footer count */}
      {history.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700/60">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            {history.length} complaint{history.length !== 1 ? 's' : ''} in history
          </p>
        </div>
      )}
    </aside>
  );
}
