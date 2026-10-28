'use client';

import React, { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';

export default function AdminLogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/office-control/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors and proceed to login
    } finally {
      window.location.replace('/office-control/login');
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      title="Sign Out"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
      ) : (
        <LogOut className="w-3.5 h-3.5 text-rose-400" />
      )}
      <span>Logout</span>
    </button>
  );
}
