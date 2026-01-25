'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import ProjectCard from '@/components/projects/ProjectCard';
import { mockProjects } from '@/lib/mockData';

type TabValue = 'all' | 'owner' | 'freelancer';

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('all');

  const filteredProjects = mockProjects.filter(project => {
    if (activeTab === 'all') return true;
    if (activeTab === 'owner') return project.userRole === 'owner' || project.userRole === 'both';
    if (activeTab === 'freelancer') return project.userRole === 'freelancer' || project.userRole === 'both';
    return true;
  });

  const stats = {
    total: mockProjects.length,
    active: mockProjects.filter(p => p.status === 'in-progress').length,
    completed: mockProjects.filter(p => p.status === 'completed').length,
    asOwner: mockProjects.filter(p => p.userRole === 'owner' || p.userRole === 'both').length,
    asFreelancer: mockProjects.filter(p => p.userRole === 'freelancer' || p.userRole === 'both').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">My Projects</h1>
        <p className="text-slate-600 mt-1">Manage your projects as both owner and freelancer</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-sm text-slate-600 mt-1">Total Projects</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-slate-600 mt-1">Active</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-600">{stats.asOwner}</p>
          <p className="text-sm text-slate-600 mt-1">As Owner</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-purple-600">{stats.asFreelancer}</p>
          <p className="text-sm text-slate-600 mt-1">As Freelancer</p>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <div className="flex gap-2 overflow-x-auto">
          {[
            { value: 'all', label: 'All Projects' },
            { value: 'owner', label: 'As Owner' },
            { value: 'freelancer', label: 'As Freelancer' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as TabValue)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.value
                  ? 'bg-brand-100 text-brand-600 border border-brand-200'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects yet</h3>
          <p className="text-slate-600 mb-6">
            {activeTab === 'owner'
              ? "You haven't posted any jobs yet."
              : activeTab === 'freelancer'
              ? "You haven't been hired for any projects yet."
              : "Start by posting a job or applying to one."}
          </p>
        </Card>
      )}
    </div>
  );
}
