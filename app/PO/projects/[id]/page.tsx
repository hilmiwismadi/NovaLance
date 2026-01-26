'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { getPOProjectById, formatCurrency } from '@/lib/mockData';

export default function POProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [approveKPIModalOpen, setApproveKPIModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<{ roleIndex: number; kpiIndex: number } | null>(null);

  const projectId = params.id as string;
  const project = getPOProjectById(projectId);

  useEffect(() => {
    setMounted(true);
  }, [projectId]);

  if (!mounted) return null;

  if (!project) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Project Not Found</h1>
        <p className="text-slate-600 mb-6">The project you're looking for doesn't exist.</p>
        <Link href="/PO/projects">
          <Button variant="primary">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const handleDeposit = () => {
    // TODO: Implement deposit logic
    setDepositModalOpen(false);
  };

  const handleApproveKPI = () => {
    if (selectedKPI) {
      // TODO: Implement approval logic
      console.log('Approving KPI:', selectedKPI);
      setApproveKPIModalOpen(false);
      setSelectedKPI(null);
    }
  };

  const openApproveModal = (roleIndex: number, kpiIndex: number) => {
    setSelectedKPI({ roleIndex, kpiIndex });
    setApproveKPIModalOpen(true);
  };

  const hiredRoles = project.roles.filter(r => r.assignedTo);
  const hiringRoles = project.roles.filter(r => r.status === 'hiring');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/PO/projects">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{project.title}</h1>
            <Badge variant={project.status === 'in-progress' ? 'warning' : project.status === 'completed' ? 'success' : 'default'}>
              {project.status}
            </Badge>
          </div>
          <p className="text-slate-600 mt-1">{project.description}</p>
        </div>
      </div>

      {/* Timeline & Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Timeline</h3>
          <div className="flex items-center gap-2 text-sm">
            {project.startDate && (
              <>
                <span className="text-slate-900">{new Date(project.startDate).toLocaleDateString()}</span>
                {project.endDate && <span className="text-slate-400">→</span>}
              </>
            )}
            {project.endDate && <span className="text-slate-900">{new Date(project.endDate).toLocaleDateString()}</span>}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Features</h3>
          <div className="flex flex-wrap gap-2">
            {project.features?.map((feature, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full">
                {feature}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Roles */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Team Roles ({project.roles.length})</h2>

          {project.roles.map((role, roleIndex) => {
            const completedKPIs = role.kpis.filter(k => k.status === 'completed' || k.status === 'approved').length;
            const totalKPIs = role.kpis.length;
            const progress = totalKPIs > 0 ? (completedKPIs / totalKPIs) * 100 : 0;

            return (
              <Card key={role.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{role.title}</h3>
                      <Badge variant={role.status === 'in-progress' ? 'warning' : role.status === 'hiring' ? 'primary' : 'success'}>
                        {role.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{role.description}</p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {role.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    {/* Assigned freelancer */}
                    {role.assignedToEns ? (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{role.assignedToEns[0]}</span>
                        </div>
                        <span className="text-slate-900 font-medium">{role.assignedToEns}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-amber-600">Looking for freelancer...</p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-600">Budget</p>
                    <p className="text-xl font-bold text-brand-600">
                      {formatCurrency(role.budget, role.currency)}
                    </p>
                  </div>
                </div>

                {/* KPIs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">KPIs ({completedKPIs}/{totalKPIs})</span>
                    <span className="text-slate-600">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>

                  <div className="space-y-2 mt-4">
                    {role.kpis.map((kpi, kpiIndex) => (
                      <div key={kpi.id} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-slate-900 text-sm">{kpi.name}</h4>
                              <Badge variant={kpi.status === 'approved' ? 'success' : kpi.status === 'completed' ? 'warning' : kpi.status === 'in-progress' ? 'primary' : 'default'} className="text-xs">
                                {kpi.status}
                              </Badge>
                              <span className="text-xs text-slate-600">{kpi.percentage}%</span>
                            </div>
                            {kpi.description && (
                              <p className="text-xs text-slate-600 mb-2">{kpi.description}</p>
                            )}
                            {kpi.deadline && (
                              <p className="text-xs text-slate-500">
                                Deadline: {new Date(kpi.deadline).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          {kpi.status === 'completed' && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => openApproveModal(roleIndex, kpiIndex)}
                            >
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Budget Card */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Project Budget</h3>
            <div className="space-y-3 mb-4">
              {project.roles.map((role, i) => (
                <div key={role.id} className="flex justify-between text-sm">
                  <span className="text-slate-600">{role.title || `Role ${i + 1}`}</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(role.budget, role.currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-lg font-bold text-brand-600">
                {formatCurrency(project.totalBudget, project.currency)}
              </span>
            </div>

            <Button variant="primary" className="w-full mt-4" onClick={() => setDepositModalOpen(true)}>
              Deposit to Escrow
            </Button>
          </Card>

          {/* Team Status */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Team Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Roles</span>
                <span className="font-medium text-slate-900">{project.roles.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Hired</span>
                <span className="font-medium text-emerald-600">{hiredRoles.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Hiring</span>
                <span className="font-medium text-amber-600">{hiringRoles.length}</span>
              </div>
            </div>

            {hiringRoles.length > 0 && (
              <Link href={`/PO/projects/${project.id}/applications`} className="block mt-4">
                <Button variant="outline" className="w-full">
                  View Applications
                </Button>
              </Link>
            )}
          </Card>
        </div>
      </div>

      {/* Deposit Modal */}
      <Modal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} title="Deposit to Escrow">
        <div className="space-y-4">
          <p className="text-slate-600">
            Funds will be held in escrow and released as KPIs are approved.
          </p>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              Total project budget: <strong>{formatCurrency(project.totalBudget, project.currency)}</strong>
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setDepositModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDeposit} className="flex-1">
              Deposit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve KPI Modal */}
      <Modal isOpen={approveKPIModalOpen} onClose={() => setApproveKPIModalOpen(false)} title="Approve KPI">
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to approve this KPI and release the payment to the freelancer?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Warning:</strong> This action cannot be undone. Payment will be released from escrow.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setApproveKPIModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="success" onClick={handleApproveKPI} className="flex-1">
              Approve & Release
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
