'use client';

import React, { useState } from 'react';
import { ShieldAlert, Key, Copy, Check, Terminal } from 'lucide-react';

interface Props {
  missingConfig: string[];
}

export default function AdminSetupNotice({ missingConfig }: Props) {
  const [testPassword, setTestPassword] = useState('');
  const [generatedHash, setGeneratedHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateHash = async () => {
    if (!testPassword) return;
    try {
      const res = await fetch('/api/blog-admin/generate-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: testPassword }),
      });
      const data = await res.json();
      if (data.hash) {
        setGeneratedHash(data.hash);
      }
    } catch {
      // Fallback
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500 px-8 py-6 text-white text-center">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-white/30">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Admin Setup Required</h1>
          <p className="text-xs text-amber-100 mt-0.5">
            Server authentication environment variables must be configured in Vercel.
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 text-slate-800 text-xs sm:text-sm">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-2">
              Missing Server-Side Environment Variables:
            </h2>
            <ul className="space-y-1.5 font-mono text-xs text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-200">
              {missingConfig.map((v) => (
                <li key={v} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 text-slate-600 text-xs leading-relaxed">
            <p className="font-semibold text-slate-800">How to configure in Vercel:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Open your <strong>Vercel Dashboard</strong> → <strong>Project Settings</strong> →{' '}
                <strong>Environment Variables</strong>.
              </li>
              <li>Add the following 3 variables for Production &amp; Preview:</li>
            </ol>
          </div>

          {/* Table of variables */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 font-semibold text-slate-600">
                <tr>
                  <th className="p-2.5">Variable Name</th>
                  <th className="p-2.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                <tr>
                  <td className="p-2.5 text-[#004b87] font-bold">BLOG_ADMIN_USERNAME</td>
                  <td className="p-2.5 font-sans">Your chosen administrator username</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-[#004b87] font-bold">BLOG_ADMIN_PASSWORD_HASH</td>
                  <td className="p-2.5 font-sans">
                    A secure scrypt hash of your admin password (generate below)
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-[#004b87] font-bold">BLOG_ADMIN_SESSION_SECRET</td>
                  <td className="p-2.5 font-sans">
                    A random 32+ character key to sign session cookies
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quick Hash Generator Tool */}
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <Key className="w-4 h-4 text-emerald-600" />
              <span>Password Hash Generator Helper</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter your chosen admin password..."
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#004b87]"
              />
              <button
                type="button"
                onClick={handleGenerateHash}
                className="px-4 py-2 bg-[#004b87] hover:bg-[#003866] text-white rounded-lg text-xs font-semibold whitespace-nowrap"
              >
                Generate Hash
              </button>
            </div>

            {generatedHash && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">
                  Copy for BLOG_ADMIN_PASSWORD_HASH:
                </span>
                <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded font-mono text-[11px] text-slate-800 break-all border border-slate-200">
                  <span>{generatedHash}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedHash)}
                    className="p-1 text-slate-500 hover:text-[#004b87] shrink-0"
                    title="Copy hash"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

