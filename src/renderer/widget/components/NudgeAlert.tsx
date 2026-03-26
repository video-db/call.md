import React from 'react';

// Warning/Alert icon matching Figma design
function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8.57465 3.21665L1.51632 14.1667C1.37079 14.4187 1.29379 14.7044 1.29298 14.9954C1.29216 15.2864 1.36756 15.5726 1.51167 15.8254C1.65579 16.0783 1.86359 16.289 2.11441 16.4366C2.36523 16.5843 2.65032 16.6637 2.94132 16.6667H17.058C17.349 16.6637 17.6341 16.5843 17.8849 16.4366C18.1357 16.289 18.3435 16.0783 18.4876 15.8254C18.6317 15.5726 18.7071 15.2864 18.7063 14.9954C18.7055 14.7044 18.6285 14.4187 18.483 14.1667L11.4247 3.21665C11.2761 2.97174 11.0664 2.76925 10.8163 2.62913C10.5663 2.48901 10.2843 2.41553 9.99799 2.41553C9.71164 2.41553 9.42969 2.48901 9.17966 2.62913C8.92962 2.76925 8.71991 2.97174 8.57132 3.21665H8.57465Z"
        stroke="#CA8700"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 7.5V10.8333"
        stroke="#CA8700"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14.1667H10.0083"
        stroke="#CA8700"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Close icon (X)
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 4L4 12"
        stroke="#CA8700"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 4L12 12"
        stroke="#CA8700"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface NudgeAlertProps {
  message: string;
  onDismiss: () => void;
}

export function NudgeAlert({ message, onDismiss }: NudgeAlertProps) {
  return (
    <div
      className="w-full flex items-center"
      style={{
        height: '61px',
        padding: '8px 12px',
        background: '#FFF8EF',
        border: '1px solid #F5D7AB',
        borderRadius: '12px',
        boxShadow: '0px 1.272px 15.267px 0px rgba(0,0,0,0.05)',
        gap: '10px',
      }}
    >
      <div className="shrink-0">
        <AlertIcon />
      </div>
      <p
        className="flex-1"
        style={{
          fontSize: '13px',
          lineHeight: '1.5',
          color: '#CA8700',
        }}
      >
        {message}
      </p>
      <button
        onClick={onDismiss}
        className="shrink-0 flex items-center justify-center hover:opacity-70 transition-opacity"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <CloseIcon />
      </button>
    </div>
  );
}
