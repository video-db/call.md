/**
 * NewSidebar Component
 *
 * New sidebar design matching the Figma mockup.
 * - Company logo placeholder
 * - Home icon (active state with orange background)
 * - Record icon
 * - Settings icon
 * - Logout at bottom
 */

import React from 'react';
import { LogOut } from 'lucide-react';
import { useConfigStore } from '../../stores/config.store';
import { useSessionStore } from '../../stores/session.store';
import { getElectronAPI } from '../../api/ipc';

type Tab = 'home' | 'history' | 'settings';

interface NewSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

// Home Icon
function HomeIcon({ active }: { active: boolean }) {
  const color = active ? '#ec5b16' : '#464646';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'rgba(236,91,22,0.15)' : 'none'}
      />
      <path
        d="M9 22V12h6v10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Past Recordings Icon (clock with history arrow)
function PastRecordingsIcon({ active }: { active: boolean }) {
  const color = active ? '#ec5b16' : '#464646';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        opacity="0.2"
        d="M20.25 12C20.25 13.6317 19.7661 15.2267 18.8596 16.5835C17.9531 17.9402 16.6646 18.9976 15.1571 19.622C13.6497 20.2464 11.9909 20.4098 10.3905 20.0915C8.79017 19.7731 7.32016 18.9874 6.16637 17.8336C5.01259 16.6798 4.22685 15.2098 3.90853 13.6095C3.5902 12.0092 3.75357 10.3504 4.378 8.84286C5.00242 7.33537 6.05984 6.0469 7.41655 5.14038C8.77325 4.23385 10.3683 3.75 12 3.75C14.188 3.75 16.2865 4.61919 17.8336 6.16637C19.3808 7.71354 20.25 9.81196 20.25 12Z"
        fill={active ? color : 'none'}
      />
      <path
        d="M12.75 7.49997V11.5753L16.1362 13.6068C16.3068 13.7093 16.4297 13.8753 16.4779 14.0683C16.5261 14.2614 16.4956 14.4656 16.3931 14.6362C16.2907 14.8068 16.1247 14.9297 15.9316 14.9778C15.7386 15.026 15.5343 14.9955 15.3637 14.8931L11.6137 12.6431C11.5028 12.5764 11.4109 12.4821 11.3472 12.3694C11.2834 12.2567 11.25 12.1294 11.25 12V7.49997C11.25 7.30105 11.329 7.11029 11.4697 6.96964C11.6103 6.82898 11.8011 6.74997 12 6.74997C12.1989 6.74997 12.3897 6.82898 12.5303 6.96964C12.671 7.11029 12.75 7.30105 12.75 7.49997ZM12 2.99997C10.8169 2.99702 9.6449 3.22875 8.55193 3.68174C7.45895 4.13474 6.46666 4.8 5.6325 5.63903C4.95094 6.32903 4.34531 6.99278 3.75 7.68747V5.99997C3.75 5.80105 3.67098 5.61029 3.53033 5.46964C3.38968 5.32898 3.19891 5.24997 3 5.24997C2.80109 5.24997 2.61032 5.32898 2.46967 5.46964C2.32902 5.61029 2.25 5.80105 2.25 5.99997V9.74997C2.25 9.94888 2.32902 10.1396 2.46967 10.2803C2.61032 10.4209 2.80109 10.5 3 10.5H6.75C6.94891 10.5 7.13968 10.4209 7.28033 10.2803C7.42098 10.1396 7.5 9.94888 7.5 9.74997C7.5 9.55105 7.42098 9.36029 7.28033 9.21964C7.13968 9.07898 6.94891 8.99997 6.75 8.99997H4.59375C5.26406 8.21059 5.93156 7.46715 6.69281 6.69653C7.73517 5.65417 9.0616 4.9421 10.5063 4.64929C11.9511 4.35648 13.4501 4.49591 14.816 5.05017C16.182 5.60443 17.3543 6.54893 18.1866 7.76566C19.0188 8.98239 19.474 10.4174 19.4953 11.8914C19.5166 13.3653 19.1031 14.8129 18.3064 16.0532C17.5098 17.2935 16.3652 18.2715 15.0159 18.865C13.6665 19.4586 12.1722 19.6413 10.7196 19.3904C9.26698 19.1395 7.92052 18.4661 6.84844 17.4543C6.77678 17.3866 6.6925 17.3337 6.60039 17.2986C6.50828 17.2634 6.41014 17.2468 6.3116 17.2495C6.21305 17.2523 6.11602 17.2745 6.02604 17.3148C5.93606 17.3551 5.8549 17.4127 5.78719 17.4843C5.71947 17.556 5.66654 17.6403 5.6314 17.7324C5.59626 17.8245 5.57961 17.9226 5.5824 18.0212C5.58518 18.1197 5.60735 18.2168 5.64763 18.3067C5.68792 18.3967 5.74553 18.4779 5.81719 18.5456C6.88542 19.5537 8.18414 20.285 9.6 20.6757C11.0159 21.0664 12.5058 21.1047 13.9399 20.7871C15.3739 20.4696 16.7085 19.8059 17.827 18.854C18.9456 17.9021 19.8142 16.6908 20.357 15.326C20.8998 13.9612 21.1003 12.4843 20.9411 11.0242C20.7818 9.56408 20.2677 8.16511 19.4434 6.9494C18.6192 5.73369 17.5099 4.73819 16.2125 4.04976C14.915 3.36134 13.4688 3.00092 12 2.99997Z"
        fill={color}
      />
    </svg>
  );
}

// Recording Indicator Icon - shown when recording is in progress
function RecordingIndicatorIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="#ec5b16"
        strokeWidth="1.5"
        fill="rgba(236,91,22,0.15)"
      />
      {/* Inner recording dot - pulsing red */}
      <circle
        cx="12"
        cy="12"
        r="5"
        fill="#d1242f"
        className="animate-pulse"
      />
    </svg>
  );
}


// Settings Icon
function SettingsIcon({ active }: { active: boolean }) {
  const color = active ? '#ec5b16' : '#464646';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke={color}
        strokeWidth="1.5"
        fill={active ? 'rgba(236,91,22,0.15)' : 'none'}
      />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Logout Icon
function LogoutIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
        stroke="#464646"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        stroke="#464646"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NewSidebar({ activeTab, onTabChange }: NewSidebarProps) {
  const configStore = useConfigStore();
  const { status } = useSessionStore();
  const isRecording = status === 'recording';

  const handleLogout = async () => {
    const api = getElectronAPI();
    if (api) {
      await api.app.logout();
    }
    configStore.clearAuth();
  };

  const tabs: { id: Tab; icon: (active: boolean) => React.ReactNode; label: string }[] = [
    {
      id: 'home',
      icon: (a) => isRecording ? <RecordingIndicatorIcon /> : <HomeIcon active={a} />,
      label: isRecording ? 'Recording' : 'Home',
    },
    {
      id: 'history',
      icon: (a) => <PastRecordingsIcon active={a} />,
      label: 'Past Recordings',
    },
    { id: 'settings', icon: (a) => <SettingsIcon active={a} />, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-[rgba(0,0,0,0.1)]">
      {/* Top section with logo and nav */}
      <div className="flex-1 flex flex-col items-center gap-[20px] p-[20px]">
        {/* Logo placeholder */}
        <div className="w-[40px] h-[40px] rounded-[9px] bg-[#efefef]" />

        {/* Navigation items */}
        {tabs.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`p-[4px] rounded-[6px] transition-colors ${
              activeTab === id ? 'bg-[#ffe9d3]' : 'hover:bg-[#f5f5f5]'
            }`}
            title={label}
          >
            {icon(activeTab === id)}
          </button>
        ))}
      </div>

      {/* Bottom section with logout */}
      <div className="flex flex-col items-center pb-[20px]">
        <button
          onClick={handleLogout}
          className="p-[4px] rounded-[6px] hover:bg-[#f5f5f5] transition-colors"
          title="Logout"
        >
          <LogoutIcon />
        </button>
      </div>
    </div>
  );
}

export default NewSidebar;
