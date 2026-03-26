import React from 'react';

// Lightbulb icon matching Figma design
function LightbulbIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 2.5C6.54822 2.5 3.75 5.29822 3.75 8.75C3.75 10.9196 4.86607 12.8304 6.5625 13.9062V15.625C6.5625 16.3154 7.12214 16.875 7.8125 16.875H12.1875C12.8779 16.875 13.4375 16.3154 13.4375 15.625V13.9062C15.1339 12.8304 16.25 10.9196 16.25 8.75C16.25 5.29822 13.4518 2.5 10 2.5Z"
        stroke="#EC5B16"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.5 17.5H12.5" stroke="#EC5B16" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState() {
  return (
    <div
      className="w-full flex flex-col"
      style={{
        background: '#F5F5F8',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '16px',
        padding: '12px',
      }}
    >
      <div className="flex flex-col items-center gap-2 w-full">
        <LightbulbIcon />
        <span
          className="font-medium text-black whitespace-nowrap"
          style={{ fontSize: '13px', lineHeight: '16px' }}
        >
          Conversation is flowing well
        </span>
      </div>
      <p
        className="text-center w-full"
        style={{
          fontSize: '13px',
          lineHeight: '22px',
          color: '#969696',
          marginTop: '2px',
        }}
      >
        cards will appear when key moments are detected.
      </p>
    </div>
  );
}
