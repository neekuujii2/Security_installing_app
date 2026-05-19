import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { socketClient } from '../../lib/socket';
import { cn } from '../../lib/utils';
import {
  User,
  Navigation,
  Filter,
  Layers,
  RefreshCw,
  Locate,
} from 'lucide-react';

interface Technician {
  id: string;
  fullName: string;
  status: 'available' | 'busy' | 'offline';
  lastPing: string;
  currentJob?: {
    id: string;
    jobNumber: string;
    client: string;
  };
  location: {
    lat: number;
    lng: number;
  };
}

interface JobPin {
  id: string;
  jobNumber: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
  location: {
    lat: number;
    lng: number;
  };
  client: string;
  siteName: string;
}

interface LiveMapDashboardProps {
  className?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

const statusColors = {
  available: '#10b981',
  busy: '#f59e0b',
  offline: '#6b7280',
};

const jobStatusColors = {
  pending: '#6b7280',
  assigned: '#3b82f6',
  in_progress: '#f59e0b',
  completed: '#10b981',
};

const TechnicianMarker = memo(({ technician, onClick, isSelected }: {
  technician: Technician;
  onClick: () => void;
  isSelected: boolean;
}) => {
  const color = statusColors[technician.status];
  const isOffline = Date.now() - new Date(technician.lastPing).getTime() > 5 * 60 * 1000;

  return (
    <Marker
      position={technician.location}
      onClick={onClick}
      icon={{
        path: google.maps.SymbolPath.CIRCLE,
        scale: isSelected ? 12 : 10,
        fillColor: isOffline ? '#ef4444' : color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      }}
    />
  );
});

const JobMarker = memo(({ job, onClick, isSelected }: {
  job: JobPin;
  onClick: () => void;
  isSelected: boolean;
}) => {
  return (
    <Marker
      position={job.location}
      onClick={onClick}
      icon={{
        path: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
        scale: isSelected ? 1.5 : 1,
        fillColor: jobStatusColors[job.status],
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        anchor: new google.maps.Point(12, 24),
      }}
    />
  );
});

export const LiveMapDashboard = memo(function LiveMapDashboard({ className }: LiveMapDashboardProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [jobs, setJobs] = useState<JobPin[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPin | null>(null);
  const [showTechnicians, setShowTechnicians] = useState(true);
  const [showJobs, setShowJobs] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [techRes, jobsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/technicians`).then(r => r.json()),
          fetch(`${API_BASE_URL}/jobs?status=pending,assigned,in_progress`).then(r => r.json()),
        ]);
        setTechnicians(techRes);
        setJobs(jobsRes);
      } catch (error) {
        console.error('Failed to fetch map data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const locationSocket = socketClient.connectToLocation(token);

    const handleLocationUpdate = (data: { technicianId: string; location: { lat: number; lng: number } }) => {
      setTechnicians(prev =>
        prev.map(tech =>
          tech.id === data.technicianId
            ? { ...tech, location: data.location, lastPing: new Date().toISOString() }
            : tech
        )
      );
    };

    locationSocket.on('technician:location_update', handleLocationUpdate);

    return () => {
      locationSocket.off('technician:location_update', handleLocationUpdate);
    };
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const centerOnTechnician = useCallback((tech: Technician) => {
    if (map) {
      map.panTo(tech.location);
      map.setZoom(15);
    }
  }, [map]);

  const filteredTechnicians = useMemo(() => {
    if (statusFilter === 'all') return technicians;
    return technicians.filter(t => t.status === statusFilter);
  }, [technicians, statusFilter]);

  if (loadError) {
    return (
      <div className={cn('flex items-center justify-center bg-slate-100', className)}>
        <p className="text-slate-500">Failed to load Google Maps</p>
      </div>
    );
  }

  if (!isLoaded || loading) {
    return (
      <div className={cn('flex items-center justify-center bg-slate-100', className)}>
        <div className="flex items-center gap-2 text-slate-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={5}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {showTechnicians && filteredTechnicians.map((tech) => (
          <TechnicianMarker
            key={tech.id}
            technician={tech}
            isSelected={selectedTechnician?.id === tech.id}
            onClick={() => {
              setSelectedTechnician(tech);
              setSelectedJob(null);
            }}
          />
        ))}

        {showJobs && jobs.map((job) => (
          <JobMarker
            key={job.id}
            job={job}
            isSelected={selectedJob?.id === job.id}
            onClick={() => {
              setSelectedJob(job);
              setSelectedTechnician(null);
            }}
          />
        ))}

        {selectedTechnician && (
          <InfoWindow
            position={selectedTechnician.location}
            onCloseClick={() => setSelectedTechnician(null)}
          >
            <div className="w-64 p-2">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: statusColors[selectedTechnician.status] }}
                />
                <span className="font-medium">{selectedTechnician.fullName}</span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>Status: {selectedTechnician.status}</p>
                {selectedTechnician.currentJob && (
                  <p className="mt-1">
                    Job: {selectedTechnician.currentJob.jobNumber} - {selectedTechnician.currentJob.client}
                  </p>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => centerOnTechnician(selectedTechnician)}
                  className="rounded bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
                >
                  Locate
                </button>
                <button className="rounded bg-gray-500 px-3 py-1 text-xs text-white hover:bg-gray-600">
                  View Profile
                </button>
              </div>
            </div>
          </InfoWindow>
        )}

        {selectedJob && (
          <InfoWindow
            position={selectedJob.location}
            onCloseClick={() => setSelectedJob(null)}
          >
            <div className="w-64 p-2">
              <p className="font-medium">{selectedJob.jobNumber}</p>
              <p className="text-sm text-gray-600">{selectedJob.client}</p>
              <p className="text-sm text-gray-500">{selectedJob.siteName}</p>
              <div className="mt-2">
                <span
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={{
                    backgroundColor: jobStatusColors[selectedJob.status] + '20',
                    color: jobStatusColors[selectedJob.status],
                  }}
                >
                  {selectedJob.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      <div className="absolute left-4 top-4 z-10 w-64 space-y-3 rounded-2xl bg-white p-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="font-medium text-slate-900">Filters</span>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showTechnicians}
              onChange={(e) => setShowTechnicians(e.target.checked)}
              className="rounded border-slate-300 text-action focus:ring-action"
            />
            Show Technicians
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showJobs}
              onChange={(e) => setShowJobs(e.target.checked)}
              className="rounded border-slate-300 text-action focus:ring-action"
            />
            Show Jobs
          </label>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => map?.setCenter(defaultCenter)}
          className="rounded-full bg-white p-2 shadow-lg hover:bg-slate-50"
          title="Reset View"
        >
          <Layers className="h-5 w-5 text-slate-600" />
        </button>
        <button
          onClick={() => map?.setZoom((map.getZoom() || 5) + 1)}
          className="rounded-full bg-white p-2 shadow-lg hover:bg-slate-50"
        >
          <Navigation className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4 rounded-full bg-white px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-slate-600">Available ({technicians.filter(t => t.status === 'available').length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-sm text-slate-600">Busy ({technicians.filter(t => t.status === 'busy').length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-slate-400" />
          <span className="text-sm text-slate-600">Offline ({technicians.filter(t => t.status === 'offline').length})</span>
        </div>
      </div>
    </div>
  );
});

export default LiveMapDashboard;
