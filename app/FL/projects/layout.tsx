'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface FLProjectsLayoutProps {
  children: React.ReactNode;
}

export default function FLProjectsLayout({ children }: FLProjectsLayoutProps) {
  const pathname = usePathname();

  const tabs = [
    { key: 'projects', label: 'Projects', href: '/FL/projects' },
    { key: 'applications', label: 'Applications', href: '/FL/projects/applications' },
    { key: 'portfolio', label: 'Portfolio', href: '/FL/projects/portfolio' },
  ];

  const getActiveTab = () => {
    if (pathname === '/FL/projects') return 'projects';
    if (pathname === '/FL/projects/applications') return 'applications';
    if (pathname === '/FL/projects/portfolio') return 'portfolio';
    return 'projects';
  };

  const activeTab = getActiveTab();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Tabs */}
      <div>
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            My Projects
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`px-4 py-2.5 text-sm font-medium transition-all relative ${
                activeTab === tab.key
                  ? 'text-brand-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t" />
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {children}
    </div>
  );
}
