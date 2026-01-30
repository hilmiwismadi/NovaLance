'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import WalletConnectModal from '@/components/auth/WalletConnectModal';
import CurrencyDisplay from '@/components/ui/CurrencyDisplay';
import { mockUser, mockPOProjects, calculateProjectProgress, formatCurrency } from '@/lib/mockData';

// Get projects owned by current user
const ownerProjects = mockPOProjects.filter(
  p => p.owner.toLowerCase() === mockUser.address.toLowerCase()
);

// Separate active and completed projects
const activeProjects = ownerProjects.filter(p => p.status === 'hiring' || p.status === 'in-progress');
const completedProjects = ownerProjects.filter(p => p.status === 'completed');

export default function POProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check wallet connection status
    if (typeof window !== 'undefined') {
      const isWalletConnected = localStorage.getItem('po-wallet-connected');
      const storedWalletAddress = localStorage.getItem('po-wallet-address');
      if (isWalletConnected && storedWalletAddress) {
        setWalletConnected(true);
        setWalletAddress(storedWalletAddress);
      }
    }
  }, []);

  const handleWalletConnected = () => {
    setWalletConnected(true);
    setWalletAddress(localStorage.getItem('po-wallet-address') || '');
    setShowWalletModal(false);
  };

  const handleDisconnectWallet = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('po-wallet-connected');
      localStorage.removeItem('po-wallet-address');
    }
    setWalletConnected(false);
    setWalletAddress('');
  };

  const formatWalletAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!mounted) return null;

  return (
    <>
      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnected={handleWalletConnected}
      />

      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">Profile</h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5 sm:mt-1">
            Manage your profile and earnings as a Project Owner
          </p>
        </div>

        {/* Wallet Connection Status Card - Prominently Displayed */}
        <Card className={`p-4 sm:p-6 border-2 transition-all ${
          walletConnected
            ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
            : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
        }`}>
          <div className="flex items-start gap-4">
            {/* Wallet Icon */}
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
              walletConnected
                ? 'bg-gradient-to-br from-emerald-400 to-green-600'
                : 'bg-gradient-to-br from-amber-400 to-orange-600'
            }`}>
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Wallet Connection
                </h2>
                {walletConnected && (
                  <Badge variant="success" className="text-xs sm:text-sm">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Connected
                    </span>
                  </Badge>
                )}
              </div>

              {walletConnected ? (
                <>
                  <p className="text-sm text-slate-600 mb-2">Your wallet is connected and ready for transactions</p>
                  <div className="bg-white/60 rounded-lg p-3 mb-3 border border-emerald-200">
                    <p className="text-xs text-slate-600 mb-1">Connected Address</p>
                    <p className="font-mono text-sm sm:text-base font-semibold text-slate-900 break-all">
                      {walletAddress}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={handleDisconnectWallet}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Disconnect
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      View on Explorer
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600 mb-3">
                    Connect your wallet to manage payments, earn yield, and interact with smart contracts
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      size="lg"
                      className="text-xs sm:text-sm"
                      onClick={() => setShowWalletModal(true)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Connect Wallet
                    </Button>
                  </div>
                  <div className="mt-3 bg-amber-100/50 rounded-lg p-3 border border-amber-200">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-xs text-amber-800">
                        <p className="font-semibold mb-1">Why connect your wallet?</p>
                        <ul className="space-y-0.5 text-amber-700">
                          <li>• Secure project escrow payments</li>
                          <li>• Automatic milestone releases</li>
                          <li>• Earn yield on deposited funds (up to 15% APY)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

      {/* Profile Card */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              {mockUser.ens ? mockUser.ens[0].toUpperCase() : mockUser.address[2].toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 truncate">
                {mockUser.ens || `${mockUser.address.slice(0, 8)}...${mockUser.address.slice(-4)}`}
              </h2>
              {/* Wallet Status Badge */}
              {walletConnected ? (
                <Badge variant="success" className="text-xs">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Wallet Connected
                  </span>
                </Badge>
              ) : (
                <Badge variant="warning" className="text-xs">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Wallet Not Connected
                  </span>
                </Badge>
              )}
            </div>
            <p className="text-slate-600 text-xs sm:text-sm line-clamp-2">{mockUser.bio}</p>

            <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 flex-wrap">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold text-slate-900 text-sm">{mockUser.reviewCount}</span>
                <span className="text-slate-600 text-xs">reviews</span>
              </div>

              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-600 text-xs">Since {mockUser.memberSince}</span>
              </div>

              {/* Completion Rate Badge */}
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-full">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold text-emerald-700">
                  {completedProjects.length > 0 ? '100% completion' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 rounded-xl p-3 sm:p-4 text-center border border-brand-200/50">
          <p className="text-xl sm:text-2xl font-bold text-brand-600">{ownerProjects.length}</p>
          <p className="text-xs text-slate-600">Projects</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 sm:p-4 text-center border border-emerald-200/50">
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">{ownerProjects.reduce((sum, p) => sum + p.roles.length, 0)}</p>
          <p className="text-xs text-slate-600">Roles Hired</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-3 sm:p-4 text-center border border-amber-200/50">
          <p className="text-xl sm:text-2xl font-bold text-amber-600 inline-flex items-center justify-center gap-1">
            {ownerProjects.reduce((sum, p) => sum + p.totalBudget, 0) > 0 ? (
              <CurrencyDisplay
                amount={formatCurrency(ownerProjects.reduce((sum, p) => sum + p.totalBudget, 0), 'IDRX')}
                currency="IDRX"
              />
            ) : '0'}
          </p>
          <p className="text-xs text-slate-600">Total Budget</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 sm:p-4 text-center border border-blue-200/50">
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{activeProjects.length}</p>
          <p className="text-xs text-slate-600">Active</p>
        </div>
      </div>

      {/* Project History - Active Projects */}
      {activeProjects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Active Projects</h2>
            <span className="text-xs sm:text-sm text-slate-500">{activeProjects.length} in progress</span>
          </div>

          <div className="space-y-3">
            {activeProjects.map((project) => {
              const progress = calculateProjectProgress(project);
              const hiredRoles = project.roles.filter(r => r.assignedTo).length;

              return (
                <Link key={project.id} href={`/PO/projects/${project.id}`}>
                  <Card className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-brand-200">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{project.title}</h3>
                          <Badge
                            variant={project.status === 'in-progress' ? 'warning' : 'primary'}
                            className="text-xs shrink-0"
                          >
                            {project.status === 'in-progress' ? 'Active' : 'Hiring'}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{project.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm sm:text-base font-bold text-brand-600">{progress}%</p>
                        <p className="text-xs text-slate-500">Progress</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                      <div
                        className="bg-gradient-to-r from-brand-400 to-brand-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>{project.roles.length} role{project.roles.length > 1 ? 's' : ''}</span>
                      <span>{hiredRoles} hired</span>
                      <span className="font-semibold text-brand-600 inline-flex items-center gap-1">
                        <CurrencyDisplay amount={formatCurrency(project.totalBudget, 'IDRX')} currency="IDRX" />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Project History - Completed Projects */}
      {completedProjects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Completed Projects</h2>
            <span className="text-xs sm:text-sm text-emerald-600 font-medium">
              ✓ {completedProjects.length} delivered
            </span>
          </div>

          <div className="space-y-3">
            {completedProjects.map((project) => (
              <Card key={project.id} className="p-4 border-l-4 border-emerald-500">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{project.title}</h3>
                      <Badge variant="success" className="text-xs shrink-0">Completed</Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{project.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm sm:text-base font-bold text-emerald-600">✓ 100%</p>
                    <p className="text-xs text-slate-500">Delivered</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <span>{project.roles.length} role{project.roles.length > 1 ? 's' : ''}</span>
                  <span>All positions filled</span>
                  <span className="font-semibold text-emerald-600 inline-flex items-center gap-1">
                    <CurrencyDisplay amount={formatCurrency(project.totalBudget, 'IDRX')} currency="IDRX" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 rounded-xl p-3 sm:p-4 text-center border border-brand-200/50">
          <p className="text-xl sm:text-2xl font-bold text-brand-600">{ownerProjects.length}</p>
          <p className="text-xs text-slate-600">Projects</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 sm:p-4 text-center border border-emerald-200/50">
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">{ownerProjects.reduce((sum, p) => sum + p.roles.length, 0)}</p>
          <p className="text-xs text-slate-600">Roles Hired</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-3 sm:p-4 text-center border border-amber-200/50">
          <p className="text-xl sm:text-2xl font-bold text-amber-600 inline-flex items-center justify-center gap-1">
            {ownerProjects.reduce((sum, p) => sum + p.totalBudget, 0) > 0 ? (
              <CurrencyDisplay
                amount={formatCurrency(ownerProjects.reduce((sum, p) => sum + p.totalBudget, 0), 'IDRX')}
                currency="IDRX"
              />
            ) : '0'}
          </p>
          <p className="text-xs text-slate-600">Total Budget</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 sm:p-4 text-center border border-blue-200/50">
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{activeProjects.length}</p>
          <p className="text-xs text-slate-600">Active</p>
        </div>
      </div>

      {/* Wallet Summary Card - Links to Projects Page */}
      <Card className={`p-4 sm:p-6 border-2 transition-all ${
        walletConnected
          ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200'
          : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
              walletConnected
                ? 'bg-gradient-to-br from-emerald-400 to-green-600'
                : 'bg-gradient-to-br from-amber-400 to-orange-600'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Wallet & Earnings</p>
              <p className="text-xs text-slate-600">
                {walletConnected ? 'View your yield earnings' : 'Connect wallet to start earning'}
              </p>
            </div>
          </div>
          <Link href="/PO/projects">
            <Button variant={walletConnected ? "outline" : "primary"} size="sm" className="text-xs">
              {walletConnected ? 'View Earnings' : 'Connect Wallet'}
            </Button>
          </Link>
        </div>
      </Card>

      {/* No projects yet state */}
      {ownerProjects.length === 0 && (
        <Card className="p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects yet</h3>
          <p className="text-slate-600 mb-6">Create your first project to start building your reputation</p>
          <Link href="/PO/create-project">
            <Button variant="primary">Create Your First Project</Button>
          </Link>
        </Card>
      )}
    </div>
    </>
  );
}
