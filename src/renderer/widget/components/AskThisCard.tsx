import React, { useState } from 'react';

function QuestionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="7.5" stroke="#3B82F6" strokeWidth="1.5" />
      <path
        d="M7.5 7.5C7.5 6.11929 8.61929 5 10 5C11.3807 5 12.5 6.11929 12.5 7.5C12.5 8.88071 11.3807 10 10 10V11.25"
        stroke="#3B82F6"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="14" r="0.75" fill="#3B82F6" />
    </svg>
  );
}

function CheckboxEmpty() {
  return (
    <div
      style={{
        width: '16px',
        height: '16px',
        borderRadius: '4px',
        border: '1px solid #969696',
        background: 'white',
      }}
    />
  );
}

function CheckboxChecked() {
  return (
    <div
      style={{
        width: '16px',
        height: '16px',
        borderRadius: '4px',
        border: '1px solid #3B82F6',
        background: '#3B82F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

interface AskThisCardProps {
  text: string;
  onDismiss: () => void;
}

export function AskThisCard({ text, onDismiss }: AskThisCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleCheck = () => {
    setIsChecked(true);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      className="w-full flex items-start"
      style={{
        background: 'rgba(59, 130, 246, 0.2)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '16px',
        boxShadow: '0px 1px 15px 0px rgba(0,0,0,0.05)',
        padding: '8px 12px',
        gap: '8px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="shrink-0 flex items-center justify-center cursor-pointer"
        style={{ width: '19px', height: '33px', paddingTop: '6px' }}
        onClick={handleCheck}
      >
        {isHovered || isChecked ? (
          isChecked ? <CheckboxChecked /> : <CheckboxEmpty />
        ) : (
          <QuestionIcon />
        )}
      </div>
      <p className="flex-1 text-black" style={{ fontSize: '14px', lineHeight: '22px' }}>
        {text}
      </p>
    </div>
  );
}
