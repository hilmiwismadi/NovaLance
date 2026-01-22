import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function VerifyPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Verification Requests</h1>
        <p className="text-slate-600 mt-1">Manage your skill and project verifications</p>
      </div>

      {/* Overview */}
      <Card className="border-brand-200">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-brand-100 text-brand-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">How Verification Works</h2>
            <p className="text-sm text-slate-600">
              Verified skills and projects build trust with potential clients. Submit evidence of your work,
              and our community reviewers will verify your claims. Verified profiles get priority visibility.
            </p>
          </div>
        </div>
      </Card>

      {/* Pending Verifications */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Verifications</h2>
        <div className="space-y-4">
          <Card className="border-amber-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900">React Development</h3>
                  <Badge variant="warning">Pending Review</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Skill verification submitted on Jan 15, 2026
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                  <Button size="sm" variant="ghost">
                    Withdraw
                  </Button>
                </div>
              </div>
              <div className="ml-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-blue-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900">DeFi Dashboard Frontend</h3>
                  <Badge variant="pending">Action Required</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Project verification - please provide additional evidence
                </p>
                <div className="flex gap-2">
                  <Button size="sm">
                    Provide Evidence
                  </Button>
                  <Button size="sm" variant="ghost">
                    Withdraw
                  </Button>
                </div>
              </div>
              <div className="ml-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Start New Verification */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Start New Verification</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-300 transition-all cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-brand-100 text-brand-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900">Verify Skill</h3>
            </div>
            <p className="text-sm text-slate-600">Submit evidence for a skill you possess</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-300 transition-all cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900">Verify Project</h3>
            </div>
            <p className="text-sm text-slate-600">Verify a completed project on NovaLance</p>
          </div>
        </div>
      </Card>

      {/* Verification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">5</p>
          <p className="text-sm text-slate-600 mt-1">Verified Skills</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-600">12</p>
          <p className="text-sm text-slate-600 mt-1">Verified Projects</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-amber-600">98%</p>
          <p className="text-sm text-slate-600 mt-1">Success Rate</p>
        </Card>
      </div>
    </div>
  );
}
