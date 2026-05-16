import { useState } from 'react';
import { useAuth } from '../store/hooks';
import { cn } from '../lib/utils';
import { User, Bell, Shield, Palette, Globe, Key } from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'api', label: 'API Keys', icon: Key },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-500">Manage your account preferences</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition',
                  activeTab === tab.id
                    ? 'bg-navy text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 rounded-[28px] bg-white p-6 shadow-panel">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
              
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-navy text-white text-2xl font-semibold">
                  {user?.fullName?.charAt(0)}
                </div>
                <div>
                  <button className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
                    Change Photo
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.fullName}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-action"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-action"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Phone</label>
                  <input
                    type="tel"
                    defaultValue={user?.phone || ''}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-action"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Role</label>
                  <input
                    type="text"
                    value={user?.role}
                    disabled
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button className="rounded-full bg-navy px-6 py-2.5 text-sm font-medium text-white hover:bg-navy/90">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>
              
              <div className="space-y-4">
                {[
                  { label: 'New job assignments', description: 'Get notified when a new job is assigned to you' },
                  { label: 'Job status updates', description: 'Receive updates when job status changes' },
                  { label: 'Low stock alerts', description: 'Get notified when inventory falls below threshold' },
                  { label: 'Report generation', description: 'Receive notification when report is ready' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                    <div>
                      <p className="font-medium text-slate-900">{item.label}</p>
                      <p className="text-sm text-slate-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-action peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Security Settings</h2>
              
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                      <p className="text-sm text-slate-500">Add an extra layer of security</p>
                    </div>
                    <button className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white">
                      Enable
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Change Password</p>
                      <p className="text-sm text-slate-500">Update your account password</p>
                    </div>
                    <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      Update
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Active Sessions</p>
                      <p className="text-sm text-slate-500">Manage your active login sessions</p>
                    </div>
                    <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Appearance</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Theme</label>
                <div className="mt-3 flex gap-4">
                  {['Light', 'Dark', 'System'].map((theme) => (
                    <button
                      key={theme}
                      className={cn(
                        'rounded-xl border-2 px-6 py-3 text-sm font-medium transition',
                        theme === 'Light'
                          ? 'border-navy bg-navy text-white'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">API Keys</h2>
              
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <Key className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm text-slate-600">No API keys generated yet</p>
                <button className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white">
                  Generate New Key
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}