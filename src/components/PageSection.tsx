import React from 'react';

interface PageSectionProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function PageSection({ title, subtitle, right, children, className = '' }: PageSectionProps) {
  return (
    <section className={`bg-white rounded-3xl p-6 border border-stone-100 shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-stone-800 truncate">{title}</h3>
          {subtitle ? <p className="text-xs text-stone-500 mt-1">{subtitle}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}
