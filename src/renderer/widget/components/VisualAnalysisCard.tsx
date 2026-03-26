import React from 'react';

function DisplayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16.6667 3.33334H3.33333C2.41286 3.33334 1.66666 4.07954 1.66666 5V12.5C1.66666 13.4205 2.41286 14.1667 3.33333 14.1667H16.6667C17.5871 14.1667 18.3333 13.4205 18.3333 12.5V5C18.3333 4.07954 17.5871 3.33334 16.6667 3.33334Z"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14.1667V17.5"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.66666 17.5H13.3333"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface VisualAnalysisCardProps {
  description: string;
}

export function VisualAnalysisCard({ description }: VisualAnalysisCardProps) {
  return (
    <div
      className="w-full flex flex-col"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(247, 247, 247, 0.95)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '15px',
        boxShadow: '0px 1px 15px 0px rgba(0,0,0,0.05)',
        padding: '8px 12px',
        gap: '10px',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 w-full">
        <DisplayIcon />
        <span
          className="font-medium text-black whitespace-nowrap"
          style={{ fontSize: '13px', lineHeight: '16px' }}
        >
          Visual Analysis
        </span>
      </div>
      {/* Description */}
      <p
        className="w-full text-black"
        style={{
          fontSize: '14px',
          lineHeight: '22px',
        }}
      >
        {description}
      </p>
    </div>
  );
}
