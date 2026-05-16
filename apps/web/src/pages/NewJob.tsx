import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/axios';
import { ArrowLeft, MapPin, Users, Calendar, FileText } from 'lucide-react';

interface JobForm {
  clientId: string;
  siteId: string;
  jobType: string;
  priority: string;
  description: string;
  scheduledAt: string;
  notes: string;
}

const jobTypes = ['installation', 'maintenance', 'survey', 'repair'];
const priorities = ['low', 'medium', 'high', 'urgent'];

export function NewJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<JobForm>({
    clientId: '',
    siteId: '',
    jobType: 'installation',
    priority: 'medium',
    description: '',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [autoAssign, setAutoAssign] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiClient.post('/jobs', {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        autoAssign,
      });
      navigate('/jobs');
    } catch (error) {
      console.error('Failed to create job:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof JobForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/jobs')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Create New Job</h1>
          <p className="text-slate-500">Fill in the details to create a new job assignment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[28px] bg-white p-6 shadow-panel">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Client</label>
              <select
                value={form.clientId}
                onChange={(e) => updateField('clientId', e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-action"
              >
                <option value="">Select Client</option>
                <option value="client-1">ABC Bank</option>
                <option value="client-2">XYZ Corporation</option>
                <option value="client-3">DEF Industries</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Site</label>
              <select
                value={form.siteId}
                onChange={(e) => updateField('siteId', e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-action"
              >
                <option value="">Select Site</option>
                <option value="site-1">Connaught Place Branch</option>
                <option value="site-2">HQ Building</option>
                <option value="site-3">Warehouse Complex</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Job Type</label>
              <select
                value={form.jobType}
                onChange={(e) => updateField('jobType', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-action"
              >
                {jobTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => updateField('priority', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-action"
              >
                {priorities.map(priority => (
                  <option key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              required
              rows={4}
              placeholder="Describe the work to be done..."
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-action"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Scheduled Date & Time</label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => updateField('scheduledAt', e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-action"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Additional Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
              placeholder="Any additional instructions..."
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-action"
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
            <input
              type="checkbox"
              id="autoAssign"
              checked={autoAssign}
              onChange={(e) => setAutoAssign(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-action focus:ring-action"
            />
            <label htmlFor="autoAssign" className="flex-1">
              <span className="font-medium text-slate-900">Auto-assign to nearest technician</span>
              <p className="text-sm text-slate-500">System will find available technician within 50km</p>
            </label>
          </div>

          {autoAssign && (
            <div className="rounded-xl bg-blue-50 p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Smart Dispatch Ready</p>
                  <p className="text-sm text-blue-700">System will find the best available technician based on proximity and workload</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-action px-6 py-2.5 text-sm font-medium text-white hover:bg-action/90 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : autoAssign ? 'Create & Auto-assign' : 'Create Job'}
          </button>
        </div>
      </form>
    </div>
  );
}