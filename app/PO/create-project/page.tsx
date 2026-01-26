'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

interface FeatureInput {
  id: string;
  text: string;
}

interface KPIInput {
  id: string;
  name: string;
  percentage: number;
  description: string;
  deadline: string;
}

interface RoleInput {
  id: string;
  title: string;
  description: string;
  budget: string;
  currency: string;
  skills: string[];
  skillInput: string;
  kpis: KPIInput[];
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Project level
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('IDRX');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [features, setFeatures] = useState<FeatureInput[]>([]);
  const [featureInput, setFeatureInput] = useState('');

  // Roles level
  const [roles, setRoles] = useState<RoleInput[]>([
    {
      id: 'role-1',
      title: '',
      description: '',
      budget: '',
      currency: 'IDRX',
      skills: [],
      skillInput: '',
      kpis: [
        { id: 'kpi-1', name: '', percentage: 0, description: '', deadline: '' },
      ],
    },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Feature handlers
  const addFeature = () => {
    if (featureInput.trim()) {
      setFeatures([...features, { id: `f-${Date.now()}`, text: featureInput.trim() }]);
      setFeatureInput('');
    }
  };

  const removeFeature = (id: string) => {
    setFeatures(features.filter(f => f.id !== id));
  };

  // Role handlers
  const addRole = () => {
    setRoles([
      ...roles,
      {
        id: `role-${Date.now()}`,
        title: '',
        description: '',
        budget: '',
        currency: 'IDRX',
        skills: [],
        skillInput: '',
        kpis: [
          { id: `kpi-${Date.now()}`, name: '', percentage: 0, description: '', deadline: '' },
        ],
      },
    ]);
  };

  const removeRole = (index: number) => {
    if (roles.length > 1) {
      setRoles(roles.filter((_, i) => i !== index));
    }
  };

  const updateRole = (index: number, field: keyof RoleInput, value: any) => {
    const updated = [...roles];
    updated[index] = { ...updated[index], [field]: value };
    setRoles(updated);
  };

  // Skill handlers (per role)
  const addSkill = (roleIndex: number) => {
    const role = roles[roleIndex];
    if (role.skillInput.trim() && !role.skills.includes(role.skillInput.trim())) {
      const updated = [...roles];
      updated[roleIndex] = {
        ...role,
        skills: [...role.skills, role.skillInput.trim()],
        skillInput: '',
      };
      setRoles(updated);
    }
  };

  const removeSkill = (roleIndex: number, skill: string) => {
    const updated = [...roles];
    updated[roleIndex] = {
      ...updated[roleIndex],
      skills: updated[roleIndex].skills.filter(s => s !== skill),
    };
    setRoles(updated);
  };

  // KPI handlers (per role)
  const addKPI = (roleIndex: number) => {
    const role = roles[roleIndex];
    const updated = [...roles];
    updated[roleIndex] = {
      ...role,
      kpis: [
        ...role.kpis,
        { id: `kpi-${Date.now()}`, name: '', percentage: 0, description: '', deadline: '' },
      ],
    };
    setRoles(updated);
  };

  const removeKPI = (roleIndex: number, kpiIndex: number) => {
    const role = roles[roleIndex];
    if (role.kpis.length > 1) {
      const updated = [...roles];
      updated[roleIndex] = {
        ...role,
        kpis: role.kpis.filter((_, i) => i !== kpiIndex),
      };
      setRoles(updated);
    }
  };

  const updateKPI = (roleIndex: number, kpiIndex: number, field: keyof KPIInput, value: string | number) => {
    const updated = [...roles];
    updated[roleIndex].kpis[kpiIndex] = {
      ...updated[roleIndex].kpis[kpiIndex],
      [field]: value,
    };
    setRoles(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all role KPIs add up to 100
    for (let i = 0; i < roles.length; i++) {
      const totalPercentage = roles[i].kpis.reduce((sum, kpi) => sum + kpi.percentage, 0);
      if (totalPercentage !== 100) {
        alert(`Role "${roles[i].title || 'Role ' + (i + 1)}" KPIs must add up to 100%. Currently: ${totalPercentage}%`);
        return;
      }
    }

    // Calculate total budget
    const totalBudget = roles.reduce((sum, role) => sum + parseFloat(role.budget || '0'), 0);

    // TODO: Create project via API
    console.log({
      title,
      description,
      currency,
      startDate,
      endDate,
      features: features.map(f => f.text),
      roles: roles.map(role => ({
        title: role.title,
        description: role.description,
        budget: parseFloat(role.budget),
        currency: role.currency,
        skills: role.skills,
        kpis: role.kpis,
      })),
      totalBudget,
    });

    // Navigate to projects list
    router.push('/PO/projects');
  };

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Create New Project</h1>
        <p className="text-slate-600 mt-1">Define your project, team roles, and KPIs</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Project Information */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-sm font-bold text-brand-600">1</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Project Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Money Tracker App"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project in detail..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                >
                  <option value="IDRX">IDRX</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Features
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  placeholder="Add a feature (e.g., Expense tracking)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                />
                <Button type="button" variant="outline" onClick={addFeature}>
                  Add
                </Button>
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {features.map((feature) => (
                    <Badge key={feature.id} variant="outline" className="cursor-pointer" onClick={() => removeFeature(feature.id)}>
                      {feature.text}
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Step 2: Team Roles */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                <span className="text-sm font-bold text-brand-600">2</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Team Roles</h2>
            </div>
            <Button type="button" variant="outline" onClick={addRole}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Role
            </Button>
          </div>

          <div className="space-y-6">
            {roles.map((role, roleIndex) => {
              const totalKPIPercentage = role.kpis.reduce((sum, kpi) => sum + kpi.percentage, 0);

              return (
                <div key={role.id} className="border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Role {roleIndex + 1}</h3>
                    {roles.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRole(roleIndex)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    )}
                  </div>

                  {/* Role Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Role Title *
                      </label>
                      <input
                        type="text"
                        value={role.title}
                        onChange={(e) => updateRole(roleIndex, 'title', e.target.value)}
                        placeholder="e.g., Frontend Developer"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Budget ({currency}) *
                      </label>
                      <input
                        type="number"
                        value={role.budget}
                        onChange={(e) => updateRole(roleIndex, 'budget', e.target.value)}
                        placeholder="2000000"
                        min="0"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Role Description *
                    </label>
                    <textarea
                      value={role.description}
                      onChange={(e) => updateRole(roleIndex, 'description', e.target.value)}
                      placeholder="Describe the role requirements and responsibilities..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none"
                      rows={3}
                      required
                    />
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Required Skills
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={role.skillInput}
                        onChange={(e) => updateRole(roleIndex, 'skillInput', e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(roleIndex))}
                        placeholder="Add skills (e.g., React, TypeScript)"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                      />
                      <Button type="button" variant="outline" onClick={() => addSkill(roleIndex)}>
                        Add
                      </Button>
                    </div>
                    {role.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {role.skills.map((skill) => (
                          <Badge key={skill} variant="default" className="cursor-pointer" onClick={() => removeSkill(roleIndex, skill)}>
                            {skill}
                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* KPIs */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-slate-700">
                        KPIs (Key Performance Indicators)
                      </label>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${totalKPIPercentage === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {totalKPIPercentage}% / 100%
                        </span>
                        <Button type="button" variant="outline" size="sm" onClick={() => addKPI(roleIndex)}>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add KPI
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {role.kpis.map((kpi, kpiIndex) => (
                        <div key={kpi.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-900">KPI {kpiIndex + 1}</span>
                            {role.kpis.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeKPI(roleIndex, kpiIndex)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-slate-700 mb-1">
                                KPI Name *
                              </label>
                              <input
                                type="text"
                                value={kpi.name}
                                onChange={(e) => updateKPI(roleIndex, kpiIndex, 'name', e.target.value)}
                                placeholder="e.g., Setup & Architecture"
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-sm"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">
                                Percentage *
                              </label>
                              <input
                                type="number"
                                value={kpi.percentage || ''}
                                onChange={(e) => updateKPI(roleIndex, kpiIndex, 'percentage', parseInt(e.target.value) || 0)}
                                placeholder="20"
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-sm"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">
                                Deadline *
                              </label>
                              <input
                                type="date"
                                value={kpi.deadline}
                                onChange={(e) => updateKPI(roleIndex, kpiIndex, 'deadline', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-sm"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Description
                            </label>
                            <textarea
                              value={kpi.description}
                              onChange={(e) => updateKPI(roleIndex, kpiIndex, 'description', e.target.value)}
                              placeholder="Describe what needs to be completed..."
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none text-sm"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Budget Summary */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Budget Summary</h2>
          <div className="space-y-3">
            {roles.map((role, i) => (
              <div key={role.id} className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {role.title || `Role ${i + 1}`}
                </span>
                <span className="font-medium text-slate-900">
                  {parseInt(role.budget || '0').toLocaleString()} {currency}
                </span>
              </div>
            ))}
            <div className="pt-3 border-t border-slate-200 flex justify-between">
              <span className="font-semibold text-slate-900">Total Budget</span>
              <span className="text-xl font-bold text-brand-600">
                {roles.reduce((sum, role) => sum + parseInt(role.budget || '0'), 0).toLocaleString()} {currency}
              </span>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Create Project
          </Button>
        </div>
      </form>
    </div>
  );
}
