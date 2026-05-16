import { useState } from 'react';
import { useAuth } from '../store/hooks';
import { Shield, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('admin@smartsecurity.in');
  const [password, setPassword] = useState('demo');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@smartsecurity.in', role: 'Super Admin' },
    { email: 'dispatcher@smartsecurity.in', role: 'Dispatcher' },
    { email: 'tech1@smartsecurity.in', role: 'Technician' },
    { email: 'client@smartsecurity.in', role: 'Client' },
  ];

  return (
    <div className="min-h-screen bg-navy p-6 flex items-center justify-center">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8">
        <div className="rounded-[32px] border border-white/10 bg-white/10 p-8 backdrop-blur text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-action">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Smart Security</h1>
              <p className="text-sm text-white/60">Ecosystem</p>
            </div>
          </div>

          <h2 className="mt-8 text-4xl font-semibold leading-tight">
            Compliance-grade security operations without the paper trail.
          </h2>

          <p className="mt-5 text-base text-white/80">
            Dispatch technicians faster, validate geofence arrivals, enforce OTP 
            sign-off for high-security sites, and keep inventory and client reporting synchronized.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ['< 3 min', 'Dispatch target'],
              ['100 m', 'Geofence check-in'],
              ['0%', 'Paper workflow'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-slate-950/15 p-4">
                <div className="text-2xl font-semibold">{value}</div>
                <div className="mt-1 text-sm text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-8 shadow-panel">
          <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your credentials to access the dashboard
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-action focus:ring-1 focus:ring-action"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-action focus:ring-1 focus:ring-action"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-navy px-4 py-3 font-medium text-white hover:bg-navy/90 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Enter workspace'}
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Demo accounts:</p>
            <div className="mt-3 space-y-2">
              {demoAccounts.map((account) => (
                <div
                  key={account.email}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-600">{account.email}</span>
                  <span className="text-xs text-slate-400">{account.role}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">Password: any value works in demo</p>
          </div>
        </div>
      </div>
    </div>
  );
}