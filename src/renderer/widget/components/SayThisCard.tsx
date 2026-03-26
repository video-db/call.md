import React, { useState } from 'react';

function SpeechBubbleIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17 7C17 3.68629 13.4183 1 9 1C4.58172 1 1 3.68629 1 7C1 8.59135 1.7932 10.0348 3.10493 11.1115C3.03179 11.9877 2.77749 12.8443 2.3619 13.6286C2.2619 13.8166 2.41279 14.0418 2.62152 14.0058C4.34295 13.7099 5.88965 13.0271 6.98166 12.1626C7.63138 12.3815 8.32547 12.5 9.04348 12.5C13.4183 12.5 17 10.3137 17 7Z"
        stroke="#EC5B16"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
        border: '1px solid #EC5B16',
        background: '#EC5B16',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1 4L3.5 6.5L9 1"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

interface SayThisCardProps {
  text: string;
  onDismiss: () => void;
}

export function SayThisCard({ text, onDismiss }: SayThisCardProps) {
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
        background: 'rgba(236, 91, 22, 0.2)',
        border: '1px solid rgba(236, 91, 22, 0.3)',
        borderRadius: '16px',
        boxShadow: '0px 1px 15px 0px rgba(0,0,0,0.05)',
        padding: '8px 12px',
        gap: '8px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox area */}
      <div
        className="shrink-0 flex items-center justify-center cursor-pointer"
        style={{
          width: '19px',
          height: '33px',
          paddingTop: '6px',
        }}
        onClick={handleCheck}
      >
        {isHovered || isChecked ? (
          isChecked ? (
            <CheckboxChecked />
          ) : (
            <CheckboxEmpty />
          )
        ) : (
          <SpeechBubbleIcon />
        )}
      </div>
      {/* Content */}
      <p
        className="flex-1 text-black"
        style={{
          fontSize: '14px',
          lineHeight: '22px',
        }}
      >
        {text}
      </p>
    </div>
  );
}
