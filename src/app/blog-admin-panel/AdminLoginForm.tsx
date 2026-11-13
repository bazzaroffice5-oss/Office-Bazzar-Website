'use client';

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export default function AdminLoginForm() {
  const [username, setUsername] = useState('bazzaroffice5@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both administrator email/username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/blog-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      // Successful login -> reload page to enter dashboard
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#004b87] to-blue-600 text-white shadow-xl shadow-blue-900/40 border border-blue-400/30 mb-4">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>OfficeBazzar</span>
            <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 tracking-wider">
              CMS Admin
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Dedicated Content Management & SEO Publishing Suite
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8">
          <div className="border-b border-slate-800/80 pb-4 mb-6">
            <h2 className="text-sm font-semibold text-slate-200">Administrator Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your authorized credentials to access the blog dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Administrator Email / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="bazzaroffice5@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#004b87] to-blue-600 hover:from-[#003866] hover:to-blue-700 active:scale-[0.99] text-white flex items-center justify-center gap-2 text-xs font-bold tracking-wider uppercase transition-all shadow-lg shadow-blue-900/30 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Restricted CMS
            </span>
            <span>HTTPS Encrypted • Scrypt 64</span>
          </div>
        </div>

        {/* Security watermark footer */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          OfficeBazzar Dedicated Admin Application • Access strictly logged
        </p>
      </div>
    </div>
  );
}
