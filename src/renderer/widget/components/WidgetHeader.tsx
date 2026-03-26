import React from 'react';

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 2L11.5 7L16.5 8.5L11.5 10L10 15L8.5 10L3.5 8.5L8.5 7L10 2Z"
        stroke="#EC5B16"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12L15.75 14.25L18 15L15.75 15.75L15 18L14.25 15.75L12 15L14.25 14.25L15 12Z"
        stroke="#EC5B16"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PopOutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 3H5C3.89543 3 3 3.89543 3 5V17C3 18.1046 3.89543 19 5 19H17C18.1046 19 19 18.1046 19 17V13"
        stroke="#969696"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 3H19V9"
        stroke="#969696"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 3L10 12"
        stroke="#969696"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="8" stroke="#969696" strokeWidth="1.5" />
      <path
        d="M8 8L14 14"
        stroke="#969696"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 8L8 14"
        stroke="#969696"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WidgetHeader() {
  const handlePopOut = () => {
    window.widgetAPI?.showMainWindow();
  };

  const handleClose = () => {
    window.widgetAPI?.hide();
  };

  return (
    <div
      className="flex items-center justify-between bg-white"
      style={{
        height: '51px',
        padding: '12px 16px',
        gap: '12px',
        borderBottom: '1px solid #EFEFEF',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      {/* Left: Sparkle icon + Title */}
      <div className="flex items-center gap-2 flex-1">
        <SparkleIcon />
        <span
          className="font-medium text-black whitespace-nowrap"
          style={{ fontSize: '15px', lineHeight: 'normal' }}
        >
          Live Assist
        </span>
      </div>

      {/* Right: Icons */}
      <div
        className="flex items-center"
        style={{ gap: '14px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handlePopOut}
          className="flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          title="Open main window"
        >
          <PopOutIcon />
        </button>
        <button
          onClick={handleClose}
          className="flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          title="Hide widget"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
