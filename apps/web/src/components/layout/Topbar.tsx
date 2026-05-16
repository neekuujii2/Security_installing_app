import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/hooks';
import { cn } from '../../lib/utils';
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Search,
} from 'lucide-react';

interface TopbarProps {
  sidebarCollapsed: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  { id: '1', title: 'Job Assigned', message: 'New job #SS-2024-0156 assigned to Tech John', time: '2 min ago', read: false },
  { id: '2', title: 'Low Stock Alert', message: 'Camera stock below minimum level', time: '15 min ago', read: false },
  { id: '3', title: 'Job Completed', message: 'Job #SS-2024-0155 completed successfully', time: '1 hour ago', read: true },
];

export function Topbar({ sidebarCollapsed }: TopbarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <header
      className={cn(
        'fixed top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 transition-all duration-300',
        sidebarCollapsed ? 'left-20' : 'left-64'
      )}
      style={{ right: 0 }}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search jobs, technicians..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-80 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-action focus:ring-1 focus:ring-action"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <Bell className="h-5 w-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-100 p-4">
                <h3 className="font-semibold text-slate-900">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {mockNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'border-b border-slate-50 p-4 hover:bg-slate-50',
                      !notif.read && 'bg-blue-50/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'mt-1 h-2 w-2 rounded-full',
                        notif.read ? 'bg-slate-300' : 'bg-action'
                      )} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{notif.message}</p>
                        <p className="mt-2 text-xs text-slate-400">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3">
                <button className="w-full rounded-lg py-2 text-center text-sm font-medium text-action hover:bg-slate-50">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 rounded-full p-1.5 pr-3 hover:bg-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-slate-900">{user?.fullName}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{user?.fullName}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <div className="py-2">
                <button
                  onClick={() => navigate('/settings')}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}