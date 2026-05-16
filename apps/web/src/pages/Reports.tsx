import { useState } from 'react';
import { apiClient } from '../lib/axios';
import { cn, formatDate } from '../lib/utils';
import { FileText, Download, Eye, Calendar, Filter } from 'lucide-react';

interface Report {
  id: string;
  jobNumber: string;
  clientName: string;
  siteName: string;
  technicianName: string;
  completedAt: string;
  type: string;
  status: 'generated' | 'pending' | 'failed';
}

export function ReportsPage() {
  const [reports] = useState<Report[]>([
    { id: '1', jobNumber: 'SS-2024-0156', clientName: 'ABC Bank', siteName: 'Connaught Place Branch', technicianName: 'John Smith', completedAt: '2024-01-15T10:30:00Z', type: 'Installation', status: 'generated' },
    { id: '2', jobNumber: 'SS-2024-0155', clientName: 'XYZ Corp', siteName: 'HQ Building', technicianName: 'Jane Doe', completedAt: '2024-01-14T16:45:00Z', type: 'Maintenance', status: 'generated' },
    { id: '3', jobNumber: 'SS-2024-0154', clientName: 'DEF Ltd', siteName: 'Warehouse Complex', technicianName: 'Mike Johnson', completedAt: '2024-01-13T14:20:00Z', type: 'Survey', status: 'pending' },
  ]);

  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [reportType, setReportType] = useState('all');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      generated: 'bg-emerald-50 text-emerald-700',
      pending: 'bg-amber-50 text-amber-700',
      failed: 'bg-red-50 text-red-700',
    };
    return colors[status] || 'bg-slate-50 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-1 text-slate-500">View and download generated job reports</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500">From</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-action"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">To</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-action"
            />
          </div>
        </div>

        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-action"
        >
          <option value="all">All Types</option>
          <option value="installation">Installation</option>
          <option value="maintenance">Maintenance</option>
          <option value="survey">Survey</option>
        </select>
      </div>

      <div className="rounded-[28px] bg-white shadow-panel">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Job #</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Client</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Site</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Type</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Technician</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Completed</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-6 py-4">
                  <span className="font-mono text-sm font-medium text-action">{report.jobNumber}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-900">{report.clientName}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{report.siteName}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {report.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{report.technicianName}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{formatDate(report.completedAt)}</td>
                <td className="px-6 py-4">
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', getStatusColor(report.status))}>
                    {report.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {report.status === 'generated' && (
                      <>
                        <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="rounded-lg p-2 text-action hover:bg-slate-100" title="Download">
                          <Download className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}