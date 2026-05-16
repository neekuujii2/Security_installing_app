import { LiveMapDashboard } from '../components/map/LiveMapDashboard';

export function LiveMapPage() {
  return (
    <div className="h-[calc(100vh-8rem)]">
      <LiveMapDashboard className="rounded-2xl overflow-hidden" />
    </div>
  );
}