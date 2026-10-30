'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, AlertCircle, Shield, KeyRound, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect') || '/account';
  const { login, verifyOtp, sendOtp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);

    if (!email) {
      setErrorMsg('Please enter your business email address.');
      return;
    }

    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      router.push(redirectTarget);
    } else if (res.requiresOtp) {
      setOtpMode(true);
      setStatusMsg(res.message || 'A 6-digit verification code was sent to your email.');
    } else {
      setErrorMsg(res.message || 'Login failed. Please verify your credentials.');
    }
  };

  const handleSendOtpDirect = async () => {
    if (!email) {
      setErrorMsg('Please enter your email address to receive a verification code.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    const res = await sendOtp(email);
    setIsSubmitting(false);

    if (res.success) {
      setOtpMode(true);
      setStatusMsg(res.message || 'A 6-digit verification code was sent to your email.');
    } else {
      setErrorMsg(res.message || 'Failed to dispatch verification code.');
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!otp || otp.length < 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    const res = await verifyOtp(email, otp);
    setIsSubmitting(false);

    if (res.success) {
      router.push(redirectTarget);
    } else {
      setErrorMsg(res.message || 'Invalid or expired verification code.');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center mx-auto shadow-md">
            <LogIn className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Sign In to OfficeBazzar
          </h1>
          <p className="text-xs text-slate-500">
            Access enterprise procurement pricing, tax invoices &amp; order tracking.
          </p>
        </div>

        {statusMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {otpMode ? (
          <form onSubmit={handleOtpVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-3.5 py-3 text-center tracking-widest font-mono text-lg font-bold border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              />
              <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                Sent to <strong className="text-slate-800">{email}</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.length < 6}
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-md cursor-pointer"
            >
              {isSubmitting ? 'Verifying Code...' : 'Verify & Sign In'}
            </button>

            <div className="flex justify-between items-center pt-1 text-xs">
              <button
                type="button"
                onClick={handleSendOtpDirect}
                disabled={isSubmitting}
                className="text-amber-600 hover:underline cursor-pointer"
              >
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtpMode(false);
                  setOtp('');
                  setStatusMsg(null);
                }}
                className="text-slate-500 hover:underline cursor-pointer"
              >
                Switch to Password Sign In
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Business Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="procurement@company.com"
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={handleSendOtpDirect}
                  className="text-[11px] text-amber-600 hover:underline cursor-pointer"
                >
                  Sign in with OTP instead
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-md cursor-pointer"
            >
              {isSubmitting ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        )}

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-900 shrink-0" />
          <span>Sessions are secured with encrypted HTTP cookies. No credentials stored in browser.</span>
        </div>

        <div className="pt-2 text-center text-xs text-slate-500">
          Don&apos;t have a corporate account?{' '}
          <Link href="/register" className="font-semibold text-blue-900 hover:underline">
            Register Business Account &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-[#d9232d] rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
