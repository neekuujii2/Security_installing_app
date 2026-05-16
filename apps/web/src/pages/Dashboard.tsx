import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/hooks';
import { apiClient } from '../lib/axios';
import { cn, formatDate, getStatusColor, getPriorityColor } from '../lib/utils';
import {
  Briefcase,
  Users,
  AlertTriangle,
  Package,
  TrendingUp,
  Clock,
  MapPin,
  ArrowRight,
} from 'lucide-react';

interface DashboardStats {
  activeJobs: number;
  availableTechnicians: number;
  pendingRequests: number;
  lowStockAlerts: number;
}

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

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, jobsRes, inventoryRes] = await Promise.all([
          apiClient.get('/dashboard/summary'),
          apiClient.get('/jobs?limit=10'),
          apiClient.get('/inventory?lowStockOnly=true'),
        ]);
        setStats(statsRes.data);
        setJobs(jobsRes.data);
        setInventory(inventoryRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-action border-t-transparent" />
      </div>
    );
  }

  const isTechnician = user?.role === 'technician';

  const kpis = stats
    ? [
        { label: 'Active Jobs', value: stats.activeJobs, icon: Briefcase, hint: 'Live field execution' },
        { label: 'Available Techs', value: stats.availableTechnicians, icon: Users, hint: 'Ready for dispatch' },
        { label: 'Pending Requests', value: stats.pendingRequests, icon: Clock, hint: 'Need review' },
        { label: 'Low Stock', value: stats.lowStockAlerts, icon: AlertTriangle, hint: 'Action required', danger: stats.lowStockAlerts > 0 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isTechnician ? "Today's Jobs" : 'Operations Dashboard'}
          </h1>
          <p className="mt-1 text-slate-500">
            {isTechnician
              ? 'View and manage your assigned jobs'
              : 'Real-time overview of all operations'}
          </p>
        </div>
        {!isTechnician && (
          <Link
            to="/new-job"
            className="rounded-full bg-action px-5 py-2.5 text-sm font-medium text-white hover:bg-action/90"
          >
            + New Job
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={cn(
              'rounded-[28px] bg-white p-5 shadow-panel',
              kpi.danger && 'border-l-4 border-red-500'
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{kpi.label}</p>
              <div className={cn('rounded-lg p-2', kpi.danger ? 'bg-red-50' : 'bg-slate-50')}>
                <kpi.icon className={cn('h-5 w-5', kpi.danger ? 'text-red-500' : 'text-slate-600')} />
              </div>
            </div>
            <div className="mt-4 text-3xl font-semibold text-slate-900">{kpi.value}</div>
            <p className="mt-2 text-sm text-slate-500">{kpi.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[30px] bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                {isTechnician ? 'My Jobs' : 'Live Operations'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {isTechnician ? 'Your assigned jobs for today' : 'Active jobs across all sites'}
              </p>
            </div>
            <Link
              to="/jobs"
              className="flex items-center gap-1 text-sm font-medium text-action hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {jobs.length === 0 ? (
              <p className="py-8 text-center text-slate-500">No active jobs</p>
            ) : (
              jobs.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="block rounded-3xl border border-slate-100 p-4 transition hover:border-slate-200 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">{job.jobNumber}</span>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium uppercase', getStatusColor(job.status))}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="mt-2 font-medium text-slate-900">
                        {job.client?.organizationName || job.description}
                      </h4>
                      <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.site?.siteName || 'No site'}
                        </span>
                        {job.technicianUser && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {job.technicianUser.fullName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getPriorityColor(job.priority))}>
                        {job.priority}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(job.scheduledAt)}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          {!isTechnician && (
            <div className="rounded-[30px] bg-white p-6 shadow-panel">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Low Stock Items</h3>
                <Link
                  to="/inventory"
                  className="text-sm font-medium text-action hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {inventory.length === 0 ? (
                  <p className="py-4 text-sm text-slate-500">All items in stock</p>
                ) : (
                  inventory.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl bg-red-50 p-3">
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">{item.currentStock}</p>
                        <p className="text-xs text-slate-500">min: {item.minStockLevel}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {isTechnician && (
            <div className="rounded-[30px] bg-white p-6 shadow-panel">
              <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
              <div className="mt-4 space-y-2">
                <Link
                  to="/map"
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 hover:bg-slate-100"
                >
                  <MapPin className="h-5 w-5 text-action" />
                  <span className="text-sm font-medium text-slate-700">Open Live Map</span>
                </Link>
                <Link
                  to="/jobs"
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 hover:bg-slate-100"
                >
                  <Briefcase className="h-5 w-5 text-action" />
                  <span className="text-sm font-medium text-slate-700">View All Jobs</span>
                </Link>
              </div>
            </div>
          )}

          <div className="rounded-[30px] bg-gradient-to-br from-navy to-navy/80 p-6 text-white">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <h3 className="font-semibold">Performance</h3>
            </div>
            <p className="mt-3 text-sm text-white/80">
              Jobs completed this month: <span className="font-semibold text-white">24/28</span>
            </p>
            <p className="mt-1 text-sm text-white/80">
              Avg. response time: <span className="font-semibold text-white">2.4 min</span>
            </p>
            <div className="mt-4 h-2 rounded-full bg-white/20">
              <div className="h-2 w-[85%] rounded-full bg-action" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}