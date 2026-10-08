import React from 'react';

interface GlassTableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const GlassTable: React.FC<GlassTableProps> = ({
  headers,
  children,
  className = '',
}) => {
  return (
    <div
      className={`w-full overflow-x-auto rounded-[28px] border border-white/12 bg-white/[0.025] backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.35)] ${className}`}
    >
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.035]">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="py-4 px-5 font-semibold text-xs text-slate-300 uppercase tracking-wider whitespace-nowrap first:pl-6 last:pr-6"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  );
};
