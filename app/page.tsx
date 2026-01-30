'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has a preferred role in localStorage
    const savedRole = localStorage.getItem('novalance_active_role');
    if (savedRole === 'PO' || savedRole === 'FL') {
      router.replace(`/${savedRole}`);
    }
  }, [router]);

  // Show loading state immediately, don't wait for hydration
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-2xl space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Welcome to NovaLance
          </h1>
          <p className="text-slate-600">
            The Web3 freelance marketplace on Base
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Project Owner Card */}
          <Card
            className="p-5 cursor-pointer hover:shadow-xl transition-all group border-2 hover:border-brand-500"
            onClick={() => router.push('/PO')}
          >
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mb-3 group-hover:bg-brand-200 transition-colors">
              <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Project Owner</h2>
            <p className="text-slate-600 text-sm mb-4">
              Post jobs, define milestones, and hire talented freelancers for your projects.
            </p>
            <ul className="space-y-1.5 text-sm text-slate-600 mb-4">
              <li className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Create and manage job postings
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Define KPI-based milestones
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Secure escrow payments
              </li>
            </ul>
            <Button
              variant="primary"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/PO');
              }}
            >
              Enter as Project Owner
            </Button>
          </Card>

          {/* Freelancer Card */}
          <Card
            className="p-5 cursor-pointer hover:shadow-xl transition-all group border-2 hover:border-emerald-500"
            onClick={() => router.push('/FL')}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-3 group-hover:bg-emerald-200 transition-colors">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Freelancer</h2>
            <p className="text-slate-600 text-sm mb-4">
              Browse jobs, submit applications, and get paid for completing milestones.
            </p>
            <ul className="space-y-1.5 text-sm text-slate-600 mb-4">
              <li className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Browse available jobs
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply to projects matching your skills
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Get paid per milestone
              </li>
            </ul>
            <Button
              variant="success"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/FL');
              }}
            >
              Enter as Freelancer
            </Button>
          </Card>
        </div>

        {/* Info Text */}
        <p className="text-center text-xs text-slate-500">
          You can switch between roles anytime using the toggle in the header
        </p>
      </div>
    </div>
  );
}
