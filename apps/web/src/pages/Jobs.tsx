import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/axios';
import { cn, formatDate, getStatusColor, getPriorityColor } from '../lib/utils';
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Users,
  Clock,
  ChevronDown,
} from 'lucide-react';

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  priority: string;
  jobType: string;
  description: string;
  scheduledAt: string;
  client?: { organizationName: string };
  site?: { siteName: string; address: string };
  technicianUser?: { fullName: string };
}

const statusFilters = ['all', 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
const priorityFilters = ['all', 'low', 'medium', 'high', 'urgent'];

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (priorityFilter !== 'all') params.append('priority', priorityFilter);
        
        const response = await apiClient.get(`/jobs?${params.toString()}`);
        setJobs(response.data);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [statusFilter, priorityFilter]);

  const filteredJobs = jobs.filter((job) =>
    search
      ? job.jobNumber.toLowerCase().includes(search.toLowerCase()) ||
        job.client?.organizationName?.toLowerCase().includes(search.toLowerCase()) ||
        job.description.toLowerCase().includes(search.toLowerCase())
      : true
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-action border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
          <p className="mt-1 text-slate-500">Manage and track all job assignments</p>
        </div>
        <Link
          to="/new-job"
          className="flex items-center gap-2 rounded-full bg-action px-5 py-2.5 text-sm font-medium text-white hover:bg-action/90"
        >
          <Plus className="h-4 w-4" />
          New Job
        </Link>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-action"
          />
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none focus:border-action"
            >
              {statusFilters.map((status) => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : status.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-10 appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none focus:border-action"
            >
              {priorityFilters.map((priority) => (
                <option key={priority} value={priority}>
                  {priority === 'all' ? 'All Priority' : priority.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="rounded-[28px] bg-white shadow-panel">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Job #</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Client</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Site</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Priority</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Technician</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Scheduled</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No jobs found
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="font-mono text-sm font-medium text-action hover:underline"
                      >
                        {job.jobNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {job.client?.organizationName || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {job.site?.siteName || job.description.slice(0, 30)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', getStatusColor(job.status))}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', getPriorityColor(job.priority))}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {job.technicianUser?.fullName || 'Unassigned'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-500">{formatDate(job.scheduledAt)}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}