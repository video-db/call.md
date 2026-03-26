import React from 'react';

function MicIcon({ muted = false }: { muted?: boolean }) {
  const strokeColor = muted ? '#EF4444' : '#2D2D2D';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 1.66666C9.11594 1.66666 8.26809 2.01785 7.643 2.643C7.0179 3.26809 6.66671 4.11594 6.66671 5V10C6.66671 10.8841 7.0179 11.7319 7.643 12.357C8.26809 12.9821 9.11594 13.3333 10 13.3333C10.8841 13.3333 11.732 12.9821 12.357 12.357C12.9822 11.7319 13.3334 10.8841 13.3334 10V5C13.3334 4.11594 12.9822 3.26809 12.357 2.643C11.732 2.01785 10.8841 1.66666 10 1.66666Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.6667 8.33334V10C16.6667 11.7681 15.9643 13.4638 14.714 14.714C13.4638 15.9643 11.7681 16.6667 10 16.6667C8.23189 16.6667 6.53619 15.9643 5.28595 14.714C4.03571 13.4638 3.33333 11.7681 3.33333 10V8.33334"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 16.6667V18.3333"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {muted && (
        <path
          d="M3 3L17 17"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="3.5" width="3.75" height="13" rx="1" fill="#2D2D2D" />
      <rect x="11.25" y="3.5" width="3.75" height="13" rx="1" fill="#2D2D2D" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 4.5V15.5L16 10L6 4.5Z"
        fill="#2D2D2D"
        stroke="#2D2D2D"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="12" height="12" rx="2" fill="white" />
    </svg>
  );
}

interface WidgetFooterProps {
  onStop: () => void;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  isMicMuted?: boolean;
  onMuteMic?: () => void;
  onUnmuteMic?: () => void;
}

export function WidgetFooter({
  onStop,
  isPaused = false,
  onPause,
  onResume,
  isMicMuted = false,
  onMuteMic,
  onUnmuteMic,
}: WidgetFooterProps) {
  const handlePauseResume = () => {
    if (isPaused) {
      onResume?.();
    } else {
      onPause?.();
    }
  };

  const handleMicToggle = () => {
    if (isMicMuted) {
      onUnmuteMic?.();
    } else {
      onMuteMic?.();
    }
  };

  return (
    <div
      className="flex items-center justify-center bg-white"
      style={{
        height: '72px',
        padding: '12px 16px',
        gap: '8px',
        borderTop: '1px solid #EFEFEF',
      }}
    >
      {/* Mic Button */}
      <button
        onClick={handleMicToggle}
        className="flex items-center justify-center shrink-0 hover:bg-gray-100 transition-colors"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: isMicMuted ? '1px solid #EF4444' : '1px solid rgba(150, 150, 150, 0.2)',
          background: isMicMuted ? 'rgba(239, 68, 68, 0.1)' : 'white',
          cursor: 'pointer',
          padding: '10px',
        }}
        title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        <MicIcon muted={isMicMuted} />
      </button>

      {/* Pause/Resume Recording Button */}
      <button
        onClick={handlePauseResume}
        className="flex-1 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
        style={{
          height: '40px',
          borderRadius: '12px',
          border: '1px solid rgba(150, 150, 150, 0.2)',
          background: 'white',
          boxShadow: '0px 1px 15px 0px rgba(0,0,0,0.05)',
          cursor: 'pointer',
          paddingLeft: '12px',
          paddingRight: '16px',
        }}
      >
        {isPaused ? <PlayIcon /> : <PauseIcon />}
        <span
          className="font-semibold whitespace-nowrap"
          style={{
            fontSize: '14px',
            lineHeight: '1.4',
            color: '#2D2D2D',
            letterSpacing: '-0.28px',
          }}
        >
          {isPaused ? 'Resume Recording' : 'Pause Recording'}
        </span>
      </button>

      {/* Stop Button */}
      <button
        onClick={onStop}
        className="flex items-center justify-center gap-1 shrink-0 transition-all hover:bg-red-600"
        style={{
          background: '#EF4444',
          borderRadius: '12px',
          padding: '10px 30px 10px 24px',
          boxShadow: '0px 1px 15px 0px rgba(0,0,0,0.05)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <StopIcon />
        <span
          className="font-semibold text-white whitespace-nowrap"
          style={{
            fontSize: '14px',
            lineHeight: '1.4',
            letterSpacing: '-0.28px',
          }}
        >
          Stop
        </span>
      </button>
    </div>
  );
}
