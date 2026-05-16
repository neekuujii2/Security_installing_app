import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../lib/axios';
import { cn, formatDate, formatTime, getStatusColor, getPriorityColor } from '../lib/utils';
import { ArrowLeft, MapPin, User, Phone, Mail, Clock, Package, FileText, Camera } from 'lucide-react';

interface JobDetail {
  id: string;
  jobNumber: string;
  status: string;
  priority: string;
  jobType: string;
  description: string;
  scheduledAt: string;
  completedAt?: string;
  client: { id: string; organizationName: string; contactName: string; phone: string; email: string };
  site: { id: string; siteName: string; address: string; latitude: number; longitude: number };
  technicianUser?: { id: string; fullName: string; phone: string };
  survey?: {
    cameraCount: number;
    cameraModels: string[];
    dvrModel: string;
    cableLength: number;
    powerPoints: number;
    notes: string;
  };
  materials?: { id: string; name: string; quantity: number }[];
  beforePhotos?: string[];
  afterPhotos?: string[];
}

const statusTimeline = [
  { status: 'pending', label: 'Created', icon: FileText },
  { status: 'assigned', label: 'Assigned', icon: User },
  { status: 'in_progress', label: 'In Progress', icon: Package },
  { status: 'completed', label: 'Completed', icon: FileText },
];

export function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await apiClient.get(`/jobs/${id}`);
        setJob(response.data);
      } catch (error) {
        console.error('Failed to fetch job:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-action border-t-transparent" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">Job not found</p>
        <Link to="/jobs" className="mt-4 text-action hover:underline">
          Back to Jobs
        </Link>
      </div>
    );
  }

  const currentStatusIndex = statusTimeline.findIndex(s => s.status === job.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/jobs')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{job.jobNumber}</h1>
          <p className="text-slate-500">{job.client.organizationName}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={cn('rounded-full px-3 py-1 text-sm font-medium', getStatusColor(job.status))}>
          {job.status.replace('_', ' ')}
        </span>
        <span className={cn('rounded-full px-3 py-1 text-sm font-medium', getPriorityColor(job.priority))}>
          {job.priority} priority
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 capitalize">
          {job.jobType}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-[28px] bg-white p-6 shadow-panel">
            <h2 className="text-lg font-semibold text-slate-900">Job Details</h2>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-slate-500">Description</p>
                <p className="mt-1 text-slate-900">{job.description}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Scheduled</p>
                  <p className="mt-1 font-medium text-slate-900">{formatDate(job.scheduledAt)} at {formatTime(job.scheduledAt)}</p>
                </div>
                {job.completedAt && (
                  <div>
                    <p className="text-sm text-slate-500">Completed</p>
                    <p className="mt-1 font-medium text-slate-900">{formatDate(job.completedAt)} at {formatTime(job.completedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-6 shadow-panel">
            <h2 className="text-lg font-semibold text-slate-900">Site Information</h2>
            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <MapPin className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{job.site.siteName}</p>
                <p className="text-sm text-slate-500">{job.site.address}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {job.site.latitude.toFixed(4)}, {job.site.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {job.survey && (
            <div className="rounded-[28px] bg-white p-6 shadow-panel">
              <h2 className="text-lg font-semibold text-slate-900">Site Survey Data</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Camera Count</p>
                  <p className="mt-1 font-medium text-slate-900">{job.survey.cameraCount}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">DVR Model</p>
                  <p className="mt-1 font-medium text-slate-900">{job.survey.dvrModel}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Cable Length</p>
                  <p className="mt-1 font-medium text-slate-900">{job.survey.cableLength}m</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Power Points</p>
                  <p className="mt-1 font-medium text-slate-900">{job.survey.powerPoints}</p>
                </div>
              </div>
              {job.survey.cameraModels.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-slate-500">Camera Models</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {job.survey.cameraModels.map((model, i) => (
                      <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                        {model}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {job.survey.notes && (
                <div className="mt-4">
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="mt-1 text-slate-900">{job.survey.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] bg-white p-6 shadow-panel">
            <h2 className="text-lg font-semibold text-slate-900">Client</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-slate-400" />
                <span className="text-slate-900">{job.client.contactName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-400" />
                <span className="text-slate-600">{job.client.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-400" />
                <span className="text-slate-600">{job.client.email}</span>
              </div>
            </div>
          </div>

          {job.technicianUser && (
            <div className="rounded-[28px] bg-white p-6 shadow-panel">
              <h2 className="text-lg font-semibold text-slate-900">Assigned Technician</h2>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white font-semibold">
                  {job.technicianUser.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{job.technicianUser.fullName}</p>
                  <p className="text-sm text-slate-500">{job.technicianUser.phone}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-[28px] bg-white p-6 shadow-panel">
            <h2 className="text-lg font-semibold text-slate-900">Status Timeline</h2>
            <div className="mt-4 space-y-4">
              {statusTimeline.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                
                return (
                  <div key={step.status} className="flex items-center gap-4">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full',
                      isCompleted ? 'bg-action text-white' : 'bg-slate-100 text-slate-400'
                    )}>
                      <step.icon className="h-4 w-4" />
                    </div>
                    <div className={cn(
                      'flex-1 border-b pb-4',
                      index === statusTimeline.length - 1 && 'border-b-0 pb-0'
                    )}>
                      <p className={cn(
                        'font-medium',
                        isCompleted ? 'text-slate-900' : 'text-slate-400'
                      )}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-slate-500">Current status</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}