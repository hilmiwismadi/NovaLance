import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white/70 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 rounded-xl text-white placeholder-white/30
                   focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50
                   disabled:opacity-50 disabled:cursor-not-allowed
                   ${error ? 'border-red-500/50' : 'border-white/10'}
                   glass-input ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white/70 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-2.5 rounded-xl text-white placeholder-white/30
                   focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50
                   disabled:opacity-50 disabled:cursor-not-allowed resize-none
                   ${error ? 'border-red-500/50' : 'border-white/10'}
                   glass-input ${className}`}
        rows={4}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
