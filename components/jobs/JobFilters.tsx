'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';

type FilterState = {
  search: string;
  category: string;
  budgetMin: string;
  budgetMax: string;
};

interface JobFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export default function JobFilters({ onFilterChange }: JobFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    budgetMin: '',
    budgetMax: '',
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <Card className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Search</label>
          <input
            type="text"
            placeholder="Search jobs..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full px-4 py-2 rounded-xl glass-input text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-4 py-2 rounded-xl glass-input text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="all">All Categories</option>
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="writing">Writing</option>
            <option value="marketing">Marketing</option>
            <option value="audit">Security Audit</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Budget Range</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.budgetMin}
              onChange={(e) => handleFilterChange('budgetMin', e.target.value)}
              className="w-1/2 px-3 py-2 rounded-xl glass-input text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.budgetMax}
              onChange={(e) => handleFilterChange('budgetMax', e.target.value)}
              className="w-1/2 px-3 py-2 rounded-xl glass-input text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
