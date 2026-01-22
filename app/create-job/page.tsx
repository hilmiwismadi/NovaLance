'use client';

import Link from 'next/link';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

interface MilestoneInput {
  name: string;
  percentage: number;
}

export default function CreateJobPage() {
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { name: '', percentage: 50 },
    { name: '', percentage: 50 },
  ]);

  const addMilestone = () => {
    if (milestones.length < 5) {
      setMilestones([...milestones, { name: '', percentage: 0 }]);
    }
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      const newMilestones = milestones.filter((_, i) => i !== index);
      redistributePercentages(newMilestones);
    }
  };

  const updateMilestone = (index: number, field: keyof MilestoneInput, value: string | number) => {
    const newMilestones = [...milestones];
    newMilestones[index][field] = value as never;
    setMilestones(newMilestones);
  };

  const redistributePercentages = (currentMilestones: MilestoneInput[]) => {
    const equalPercentage = Math.floor(100 / currentMilestones.length);
    const remainder = 100 - equalPercentage * currentMilestones.length;
    return currentMilestones.map((m, i) => ({
      ...m,
      percentage: equalPercentage + (i === 0 ? remainder : 0),
    }));
  };

  const balancePercentages = () => {
    const total = milestones.reduce((sum, m) => sum + m.percentage, 0);
    if (total !== 100) {
      const redistributed = redistributePercentages(milestones);
      setMilestones(redistributed);
    }
  };

  const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/jobs">
          <Button variant="ghost" size="sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Job</h1>
          <p className="text-white/60 text-sm">Post a job and find the right freelancer</p>
        </div>
      </div>

      <form className="space-y-6">
        {/* Job Details */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Job Details</h2>
          <div className="space-y-4">
            <Input
              label="Job Title"
              placeholder="e.g., Frontend Developer for DeFi Dashboard"
              required
            />
            <Textarea
              label="Description"
              placeholder="Describe the project, requirements, and expectations..."
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Budget Amount"
                type="number"
                placeholder="500"
                required
              />
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Currency</label>
                <select className="w-full px-4 py-2.5 rounded-xl glass-input text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                  <option value="USDC" className="bg-gray-900">USDC</option>
                  <option value="ETH" className="bg-gray-900">ETH</option>
                  <option value="DAI" className="bg-gray-900">DAI</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Skills */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Required Skills</h2>
          <Input
            label="Skills (comma separated)"
            placeholder="React, TypeScript, Solidity..."
          />
          <p className="text-xs text-white/40 mt-2">Add skills to help freelancers find your job</p>
        </Card>

        {/* Milestones */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Milestones</h2>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${totalPercentage === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                {totalPercentage}% allocated
              </span>
              {totalPercentage !== 100 && (
                <button
                  type="button"
                  onClick={balancePercentages}
                  className="text-xs text-brand-400 hover:text-brand-300"
                >
                  Auto-balance
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex-1 space-y-2">
                  <Input
                    label={`Milestone ${index + 1} Name`}
                    value={milestone.name}
                    onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                    placeholder="e.g., Design Phase"
                  />
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      Percentage: {milestone.percentage}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={milestone.percentage}
                      onChange={(e) => updateMilestone(index, 'percentage', parseInt(e.target.value))}
                      className="w-full accent-brand-500"
                    />
                  </div>
                </div>
                {milestones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMilestone(index)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {milestones.length < 5 && (
            <button
              type="button"
              onClick={addMilestone}
              className="mt-4 w-full py-2 px-4 rounded-xl border border-dashed border-white/20 text-white/60 hover:text-white hover:border-brand-500/50 hover:bg-brand-500/5 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Milestone
            </button>
          )}
        </Card>

        {/* Summary */}
        <Card className="border-brand-500/30">
          <h2 className="text-lg font-semibold text-white mb-4">Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Total Milestones</span>
              <span className="text-white">{milestones.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Budget Allocation</span>
              <span className={totalPercentage === 100 ? 'text-green-400' : 'text-yellow-400'}>
                {totalPercentage}%
              </span>
            </div>
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-white/40">
                By posting this job, you agree to lock the full budget in escrow.
                Funds will be released to the freelancer as milestones are approved.
              </p>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Link href="/jobs" className="flex-1">
            <Button variant="outline" className="w-full" type="button">
              Cancel
            </Button>
          </Link>
          <Button className="flex-1" type="submit">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Post Job & Lock Budget
          </Button>
        </div>
      </form>
    </div>
  );
}
