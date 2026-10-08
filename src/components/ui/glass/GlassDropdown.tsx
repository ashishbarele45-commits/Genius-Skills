import React, { useState, useRef, useEffect } from 'react';

interface GlassDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const GlassDropdown: React.FC<GlassDropdownProps> = ({
  trigger,
  children,
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2.5 w-60 rounded-[28px] bg-[#0f1115]/95 backdrop-blur-3xl border border-white/15 p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-50 animate-in fade-in zoom-in-95 duration-150 ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};
