"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  Building2,
  ClipboardList,
  Filter,
  LayoutDashboard,
  Mail,
  MapPin,
  Moon,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const STATUS_OPTIONS = ['Pending', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];

function normalizeValue(value, fallback = 'N/A') {
  const text = String(value || '').trim();
  return text || fallback;
}

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function formatId(value) {
  const id = String(value || '');
  return id.length > 16 ? `${id.slice(0, 8)}...${id.slice(-6)}` : id;
}

function MetricCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <div className={`p-2 rounded-xl ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

export default function AdminPage() {
  const { isDark, toggleTheme } = useTheme();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [updatingId, setUpdatingId] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    setActionMessage('');

    try {
      const response = await fetch('/api/complaints', { cache: 'no-store' });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch complaints');
      }

      setComplaints(Array.isArray(data.complaints) ? data.complaints : []);
    } catch (err) {
      setError(err.message || 'Unable to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const updateComplaintStatus = async (complaintId, status) => {
    setUpdatingId(complaintId);
    setActionMessage('');
    setError('');

    try {
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update complaint status');
      }

      setComplaints((prev) => prev.map((complaint) => (
        String(complaint._id) === complaintId ? data.complaint : complaint
      )));
      setActionMessage(`Complaint ${formatId(complaintId)} updated to ${status}.`);
    } catch (err) {
      setError(err.message || 'Unable to update complaint status');
    } finally {
      setUpdatingId('');
    }
  };

  const departmentCounts = complaints.reduce((acc, complaint) => {
    const department = normalizeValue(complaint.department, 'Unassigned');
    acc[department] = (acc[department] || 0) + 1;
    return acc;
  }, {});

  const departments = Object.keys(departmentCounts).sort((a, b) => a.localeCompare(b));
  const totalComplaints = complaints.length;
  const highPriorityComplaints = complaints.filter((complaint) => {
    const priority = normalizeValue(complaint.priority, '').toLowerCase();
    return priority === 'high' || priority === 'critical';
  }).length;
  const pendingComplaints = complaints.filter((complaint) => normalizeValue(complaint.status, 'Pending') === 'Pending').length;

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesDepartment = selectedDepartment === 'all' || normalizeValue(complaint.department) === selectedDepartment;
    const matchesPriority = selectedPriority === 'all' || normalizeValue(complaint.priority).toLowerCase() === selectedPriority;
    const haystack = [
      complaint._id,
      complaint.userName,
      complaint.userEmail,
      complaint.category,
      complaint.department,
      complaint.location,
      complaint.description,
    ]
      .map((item) => String(item || '').toLowerCase())
      .join(' ');

    const matchesSearch = !searchText.trim() || haystack.includes(searchText.trim().toLowerCase());
    return matchesDepartment && matchesPriority && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">GrievEase Admin Portal</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Department-wise complaint monitoring dashboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/track"
              className="hidden sm:flex items-center space-x-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Track</span>
            </Link>
            <Link
              href="/"
              className="flex items-center space-x-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400 mb-3">
                <Sparkles className="w-4 h-4" />
                Department Handling Flow
              </span>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">How the department assignment is handled</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                GrievEase first predicts the complaint category using the AI pipeline. Then the frontend maps that category to the responsible civic department,
                and this admin portal shows the live complaint queue department-wise so the assigned team can review and act on it.
              </p>
            </div>

            <button
              onClick={fetchComplaints}
              className="self-start inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh Queue
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="rounded-2xl border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">1. AI Classification</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Complaint text and image are analyzed to detect the most relevant civic category.</p>
            </div>
            <div className="rounded-2xl border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-5">
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">2. Department Mapping</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">The predicted category is mapped to a responsible department such as Sanitation, Electrical, Parks, or Fire.</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">3. Admin Queue</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">The assigned complaints appear in this admin portal so departments can monitor the queue and respond.</p>
            </div>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard icon={LayoutDashboard} label="Total Complaints" value={totalComplaints} accent="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300" />
          <MetricCard icon={ClipboardList} label="Pending Queue" value={pendingComplaints} accent="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300" />
          <MetricCard icon={AlertTriangle} label="High / Critical" value={highPriorityComplaints} accent="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300" />
          <MetricCard icon={Building2} label="Active Departments" value={departments.length} accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300" />
        </section>

        <section className="grid xl:grid-cols-[1.2fr_2fr] gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Department Queue Overview</h3>
            </div>

            {departments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No complaints available yet.</p>
            ) : (
              <div className="space-y-3">
                {departments.map((department) => (
                  <div key={department} className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{department}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Assigned by category-to-department logic</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-bold">
                      {departmentCounts[department]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Filter className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Queue Filters</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search by complaint ID, user, location, category..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="all">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Latest Complaint Queue</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Admin queue with real complaint status control</p>
            </div>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{filteredComplaints.length} shown</span>
          </div>

          {actionMessage && (
            <div className="mb-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              {actionMessage}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-5 text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 p-8 text-center text-gray-500 dark:text-gray-400">
              No complaints matched the selected filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => {
                const priority = normalizeValue(complaint.priority);
                const status = normalizeValue(complaint.status, 'Pending');
                const complaintId = String(complaint._id || '');

                return (
                  <div key={complaintId} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                            ID: {formatId(complaintId)}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold">
                            {normalizeValue(complaint.category)}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                            {normalizeValue(complaint.department)}
                          </span>
                        </div>

                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{normalizeValue(complaint.description)}</p>

                        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                            <User className="w-4 h-4 mt-0.5 text-indigo-500" />
                            <span>{normalizeValue(complaint.userName)}</span>
                          </div>
                          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                            <Mail className="w-4 h-4 mt-0.5 text-indigo-500" />
                            <span>{normalizeValue(complaint.userEmail)}</span>
                          </div>
                          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                            <MapPin className="w-4 h-4 mt-0.5 text-indigo-500" />
                            <span>{normalizeValue(complaint.location)}</span>
                          </div>
                          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                            <ClipboardList className="w-4 h-4 mt-0.5 text-indigo-500" />
                            <span>{formatDate(complaint.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full lg:w-56 space-y-3">
                        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Priority</p>
                          <p className="font-bold text-gray-900 dark:text-gray-100">{priority}</p>
                        </div>
                        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Status</p>
                          <p className="font-bold text-gray-900 dark:text-gray-100">{status}</p>
                        </div>
                        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Update Status</p>
                          <select
                            value={STATUS_OPTIONS.includes(status) ? status : 'Pending'}
                            onChange={(e) => updateComplaintStatus(complaintId, e.target.value)}
                            disabled={updatingId === complaintId}
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {updatingId === complaintId ? 'Saving status...' : 'Changes are saved directly to MongoDB.'}
                          </p>
                        </div>
                        <Link
                          href={`/track?id=${encodeURIComponent(complaintId)}`}
                          className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
                        >
                          Open in Tracking View
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
