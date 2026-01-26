'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { mockUser, mockProjects } from '@/lib/mockData';

// Filter projects where user is freelancer
const freelancerProjects = mockProjects.filter(p => p.userRole === 'freelancer');

// Calculate earnings
const totalEarnings = freelancerProjects
  .filter(p => p.status === 'completed')
  .reduce((sum, p) => sum + p.totalBudget, 0);

// Pending earnings (active jobs)
const pendingEarnings = freelancerProjects
  .filter(p => p.status === 'in-progress')
  .reduce((sum, p) => sum + p.totalBudget, 0);

export default function FLProfilePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-600 mt-1">Manage your freelancer profile and track earnings</p>
      </div>

      {/* Profile Card */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">
              {mockUser.ens ? mockUser.ens[0].toUpperCase() : mockUser.address[2].toUpperCase()}
            </span>
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">
              {mockUser.ens || `${mockUser.address.slice(0, 8)}...${mockUser.address.slice(-4)}`}
            </h2>
            <p className="text-slate-600">{mockUser.bio}</p>

            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold text-slate-900">{mockUser.reviewCount}</span>
                <span className="text-slate-600">reviews</span>
              </div>

              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-600">Since {mockUser.memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Skills & Expertise</h3>
          <div className="flex flex-wrap gap-2">
            {mockUser.skills.map((skill) => (
              <Badge key={skill} variant="success">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* Earnings Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">${totalEarnings}</p>
              <p className="text-sm text-slate-600">Total Earned</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">${pendingEarnings}</p>
              <p className="text-sm text-slate-600">Pending</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{mockUser.completedProjects}</p>
              <p className="text-sm text-slate-600">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Withdrawal */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Withdraw Earnings</h2>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600">Available to Withdraw</p>
              <p className="text-3xl font-bold text-slate-900">${totalEarnings}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 mb-4">
            <p className="text-sm text-slate-600">Wallet Address</p>
            <p className="font-mono text-slate-900 text-sm">{mockUser.address}</p>
          </div>

          {totalEarnings > 0 ? (
            <Button variant="success" className="w-full">
              Withdraw to Wallet
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              No Earnings to Withdraw
            </Button>
          )}
        </div>

        <p className="text-sm text-slate-600">
          Withdrawals are processed instantly on the Base network. Gas fees apply.
        </p>
      </Card>

      {/* Portfolio / On-chain CV */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">On-Chain CV</h2>
          <Button variant="outline" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Share Link
          </Button>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <div>
                <p className="font-medium text-slate-900">Your On-Chain Profile</p>
                <p className="text-sm text-slate-600">novalance.eth/profile/{mockUser.address.slice(0, 8)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{mockUser.completedProjects}</p>
              <p className="text-sm text-slate-600">Completed Projects</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{mockUser.reviewCount}</p>
              <p className="text-sm text-slate-600">Reviews Received</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Experience */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Experience</h2>
        <div className="space-y-4">
          {mockUser.experience.map((exp) => (
            <div key={exp.id} className="border-l-2 border-brand-200 pl-4">
              <h3 className="font-semibold text-slate-900">{exp.role}</h3>
              <p className="text-brand-600 font-medium">{exp.company}</p>
              <p className="text-sm text-slate-600">
                {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
              </p>
              {exp.description && (
                <p className="text-sm text-slate-600 mt-2">{exp.description}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
