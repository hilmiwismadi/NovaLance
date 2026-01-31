'use client';

import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Accordion from '@/components/ui/Accordion';
import { Input } from '@/components/ui/Input';

// Get the position of an element relative to the viewport
function getDropdownPosition(element: HTMLElement): { top: number; left: number; width: number } {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
  };
}

interface FilterState {
  searchTerm: string;
  selectedSkills: string[];
}

interface ExpandableFilterProps {
  allSkills: string[];
  onFilterChange: (filters: FilterState) => void;
  resultCount?: number;
  totalCount?: number;
  className?: string;
}

function ExpandableFilter({
  allSkills,
  onFilterChange,
  resultCount,
  totalCount,
  className = '',
}: ExpandableFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [portalContainer, setPortalContainer] = useState<Element | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set up portal container on mount
  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  // Memoized suggestions
  const suggestions = useMemo(() => {
    if (!skillInput.trim()) return [];

    const input = skillInput.toLowerCase().trim();
    return allSkills.filter(
      skill =>
        skill.toLowerCase().includes(input) &&
        !selectedSkills.includes(skill)
    );
  }, [skillInput, allSkills, selectedSkills]);

  // Memoized active filters count
  const activeFiltersCount = useMemo(() => {
    return selectedSkills.length + (searchTerm ? 1 : 0);
  }, [selectedSkills, searchTerm]);

  // Close suggestions when clicking outside - no longer needed since we use backdrop
  // The backdrop div handles this now

  // Memoized callbacks
  const selectSkill = useCallback((skill: string) => {
    if (!selectedSkills.includes(skill)) {
      const newSkills = [...selectedSkills, skill];
      setSelectedSkills(newSkills);
      onFilterChange({
        searchTerm,
        selectedSkills: newSkills,
      });
    }
    setSkillInput('');
    setShowSuggestions(false);
  }, [selectedSkills, searchTerm, onFilterChange]);

  const removeSkill = useCallback((skill: string) => {
    const newSkills = selectedSkills.filter(s => s !== skill);
    setSelectedSkills(newSkills);
    onFilterChange({
      searchTerm,
      selectedSkills: newSkills,
    });
  }, [selectedSkills, searchTerm, onFilterChange]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    onFilterChange({
      searchTerm: value,
      selectedSkills,
    });
  }, [selectedSkills, onFilterChange]);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedSkills([]);
    setSkillInput('');
    onFilterChange({
      searchTerm: '',
      selectedSkills: [],
    });
  }, [onFilterChange]);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleClearInput = useCallback(() => {
    setSkillInput('');
  }, []);

  const handleSkillInputChange = useCallback((value: string) => {
    setSkillInput(value);
    if (inputRef.current && value) {
      setDropdownPosition(getDropdownPosition(inputRef.current));
    }
    setShowSuggestions(true);
  }, []);

  const handleSkillInputFocus = useCallback(() => {
    if (inputRef.current) {
      setDropdownPosition(getDropdownPosition(inputRef.current));
    }
    setShowSuggestions(true);
  }, []);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <>
    <Card className={`bg-white/40 backdrop-blur-sm ${className}`}>
      <Accordion
        title="Search & Filter Jobs"
        subtitle={hasActiveFilters ? `${resultCount || 0} of ${totalCount || 0} jobs` : 'Find your next opportunity'}
        isOpen={isOpen}
        onToggle={toggleOpen}
        allowOverflow={true}
        badge={
          hasActiveFilters ? (
            <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
              {activeFiltersCount} active
            </span>
          ) : null
        }
        actionButton={
          hasActiveFilters ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded-md hover:bg-brand-50 transition-colors"
            >
              Clear all
            </button>
          ) : null
        }
      >
        <div className="space-y-4">
          {/* Search Input */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">
              Search Jobs
            </label>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by title or description..."
            />
          </div>

          {/* Skills Autocomplete Input */}
          <div className="relative" ref={suggestionsRef}>
            <label className="block text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">
              Filter by Skills
            </label>

            {/* Selected Skills Pills */}
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 border border-emerald-300 px-2.5 py-0.5 rounded-md text-sm hover:bg-emerald-200 transition-all hover:shadow-sm cursor-pointer"
                  >
                    {skill}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Skill Input */}
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                value={skillInput}
                onChange={(e) => handleSkillInputChange(e.target.value)}
                onFocus={handleSkillInputFocus}
                placeholder="Type to search skills... (e.g., 'fig' for Figma)"
                className="pr-10"
              />
              {skillInput && (
                <button
                  onClick={handleClearInput}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Result Count */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{resultCount || 0}</span> of{' '}
                <span className="font-semibold text-slate-900">{totalCount || 0}</span> jobs
              </p>
            </div>
          )}
        </div>
      </Accordion>
    </Card>

    {/* Fixed Position Suggestions Dropdown - Renders outside the Card via Portal to avoid z-index issues */}
    {portalContainer && showSuggestions && dropdownPosition && createPortal(
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setShowSuggestions(false)}
        />
        {/* Suggestions Dropdown */}
        <div
          className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-slate-200 max-h-48 overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
        >
          {suggestions.length > 0 ? (
            suggestions.map((skill) => (
              <button
                key={skill}
                onClick={() => selectSkill(skill)}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between group"
              >
                <span className="text-slate-700 group-hover:text-slate-900">
                  {skill}
                </span>
                <svg className="w-4 h-4 text-slate-400 group-hover:text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">
              No skills found matching "{skillInput}"
            </div>
          )}
        </div>
      </>,
      portalContainer
    )}
  </>
  );
}

export default memo(ExpandableFilter);
