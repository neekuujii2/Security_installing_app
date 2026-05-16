import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/axios';
import { cn, getStatusColor } from '../lib/utils';
import { Search, MapPin, Phone, Mail, Star } from 'lucide-react';

interface Technician {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'available' | 'busy' | 'off_duty';
  skills: string[];
  rating: number;
  totalJobs: number;
  avatar?: string;
  currentLocation?: { lat: number; lng: number };
}

export function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const response = await apiClient.get('/technicians');
        setTechnicians(response.data);
      } catch (error) {
        console.error('Failed to fetch technicians:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, []);

  const filteredTechnicians = technicians.filter((tech) => {
    const matchesSearch = tech.fullName.toLowerCase().includes(search.toLowerCase()) ||
      tech.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tech.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-action border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Technicians</h1>
        <p className="mt-1 text-slate-500">Manage field technician workforce</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search technicians..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-action"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-action"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="off_duty">Off Duty</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTechnicians.map((tech) => (
          <div
            key={tech.id}
            className="rounded-[28px] bg-white p-6 shadow-panel transition hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy text-white">
                {tech.avatar ? (
                  <img src={tech.avatar} alt={tech.fullName} className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <span className="text-xl font-semibold">{tech.fullName.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{tech.fullName}</h3>
                <span className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium', getStatusColor(tech.status))}>
                  {tech.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{tech.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{tech.phone}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {tech.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span className="text-sm font-medium">{tech.rating.toFixed(1)}</span>
              </div>
              <div className="text-sm text-slate-500">
                {tech.totalJobs} jobs completed
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTechnicians.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          No technicians found
        </div>
      )}
    </div>
  );
}