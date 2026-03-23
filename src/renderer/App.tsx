import { useState } from 'react';
import { NewSidebar } from './components/layout/NewSidebar';
import { AuthView } from './components/auth/AuthView';
import { TopStatusBar } from './components/recording/TopStatusBar';
import { TranscriptionPanel } from './components/transcription/TranscriptionPanel';
import { HistoryView } from './components/history/HistoryView';
import { HomeView } from './components/home/HomeView';
import { useConfigStore } from './stores/config.store';
import { useSession } from './hooks/useSession';
import { useSessionStore } from './stores/session.store';
import { usePermissions } from './hooks/usePermissions';
import { useGlobalRecorderEvents } from './hooks/useGlobalRecorderEvents';
import { useCopilot } from './hooks/useCopilot';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Button } from './components/ui/button';
import { ErrorToast } from './components/ui/error-toast';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  NudgeToast,
  CallSummaryView,
} from './components/copilot';
import { useCopilotStore } from './stores/copilot.store';
import { useMeetingSetupStore } from './stores/meeting-setup.store';
import { MCPServersPanel } from './components/settings/MCPServersPanel';
import { CalendarPanel } from './components/settings/CalendarPanel';
import { CalendarAuthBanner } from './components/calendar';
import { MeetingSetupFlow, MeetingInfoPanel } from './components/meeting-setup';
import { StepIndicators } from './components/auth/AuthView';
import { CalendarSetupView } from './components/auth/CalendarSetupView';
import { RecordingPreferencesView } from './components/auth/RecordingPreferencesView';

type Tab = 'home' | 'history' | 'settings';

// Shield icon for permissions
function ShieldIcon() {
  return (
    <svg
      width="50"
      height="50"
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="50" height="50" rx="12" fill="#EC5B16" />
      <path
        d="M25 14L15 18V26C15 31.52 19.16 36.74 25 38C30.84 36.74 35 31.52 35 26V18L25 14Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M21 25L24 28L29 22"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PermissionsView() {
  const { status, requestMicPermission, openSettings } = usePermissions();

  return (
    <div className="h-full w-full bg-[#f8f8fa] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Orange gradient glow */}
      <div
        className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[600px] h-[567px] rounded-[300px] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, rgba(236,91,22,0.08) 0%, rgba(236,91,22,0) 70%)',
        }}
      />

      {/* Step indicators */}
      <div className="absolute top-[32px]">
        <StepIndicators currentStep={1} />
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center w-full max-w-[380px] px-6 relative z-10">
        {/* Icon and heading */}
        <div className="flex flex-col items-center gap-[16px] mb-[32px]">
          <ShieldIcon />
          <div className="flex flex-col items-center gap-[8px]">
            <h1 className="text-[22px] font-semibold text-black text-center tracking-[-0.44px] leading-[33px]">
              Permissions Required
            </h1>
            <p className="text-[14px] font-normal text-[#464646] text-center leading-[21px]">
              Meeting Copilot needs access to record your screen and microphone.
            </p>
          </div>
        </div>

        {/* Permission items */}
        <div className="w-full flex flex-col gap-[12px]">
          {/* Microphone permission */}
          <div className="flex items-center justify-between p-[16px] bg-white border border-[#e0e0e8] rounded-[12px]">
            <div className="flex items-center gap-[12px]">
              <div className="w-[40px] h-[40px] bg-[#f8f8fa] rounded-[10px] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-medium text-black">Microphone</p>
                <p className="text-[12px] text-[#969696]">Required for voice recording</p>
              </div>
            </div>
            {status.microphone ? (
              <div className="flex items-center gap-[6px] px-[12px] py-[6px] bg-[#e8f5e9] rounded-[8px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="text-[13px] font-medium text-[#22c55e]">Granted</span>
              </div>
            ) : (
              <button
                onClick={requestMicPermission}
                className="px-[16px] py-[8px] bg-[#ff4000] hover:bg-[#e63900] text-white text-[13px] font-medium rounded-[8px] transition-colors"
              >
                Grant
              </button>
            )}
          </div>

          {/* Screen Recording permission */}
          <div className="flex items-center justify-between p-[16px] bg-white border border-[#e0e0e8] rounded-[12px]">
            <div className="flex items-center gap-[12px]">
              <div className="w-[40px] h-[40px] bg-[#f8f8fa] rounded-[10px] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" x2="16" y1="21" y2="21" />
                  <line x1="12" x2="12" y1="17" y2="21" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-medium text-black">Screen Recording</p>
                <p className="text-[12px] text-[#969696]">Required for screen capture</p>
              </div>
            </div>
            {status.screen ? (
              <div className="flex items-center gap-[6px] px-[12px] py-[6px] bg-[#e8f5e9] rounded-[8px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="text-[13px] font-medium text-[#22c55e]">Granted</span>
              </div>
            ) : (
              <button
                onClick={() => openSettings('screen')}
                className="px-[16px] py-[8px] bg-[#ff4000] hover:bg-[#e63900] text-white text-[13px] font-medium rounded-[8px] transition-colors"
              >
                Open Settings
              </button>
            )}
          </div>
        </div>

        {/* Info message */}
        {!status.screen && (
          <div className="mt-[20px] p-[16px] bg-[#fff8f5] border border-[#ffe4d9] rounded-[12px] flex items-start gap-[12px]">
            <AlertCircle className="h-5 w-5 text-[#ec5b16] flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-[#464646] leading-[20px]">
              Screen Recording permission must be granted in System Preferences. Click "Open Settings" and enable Meeting Copilot in the list.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface RecordingViewProps {
  onBack?: () => void;
}

function RecordingView({ onBack }: RecordingViewProps) {
  const { isCallActive, callSummary } = useCopilotStore();
  const { status } = useSession();
  const meetingSetupStore = useMeetingSetupStore();

  const isRecording = status === 'recording';
  const isProcessing = status === 'processing' || status === 'stopping';
  const isIdle = status === 'idle';

  useCopilot();

  // Reset meeting setup when starting a new call
  const handleStartNewCall = () => {
    useCopilotStore.getState().reset();
    meetingSetupStore.reset();
  };

  // Go back to home
  const handleGoBack = () => {
    useCopilotStore.getState().reset();
    meetingSetupStore.reset();
    onBack?.();
  };

  // Show call summary view if call ended and summary available
  if (callSummary && !isCallActive) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <TopStatusBar />
        <div className="flex-1 overflow-hidden p-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-semibold">Call Complete</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleGoBack}>
                  Back to Home
                </Button>
                <Button variant="outline" size="sm" onClick={handleStartNewCall}>
                  Start New Call
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              <CallSummaryView />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show processing state while generating summary (only after recording stopped)
  if (isProcessing) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <TopStatusBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Generating Call Summary</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Analyzing your conversation and preparing insights...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If idle, go back to home (user shouldn't see RecordingView when idle)
  if (isIdle) {
    // This shouldn't happen often since App.tsx checks isActivelyRecording
    // but if we end up here, just go back
    onBack?.();
    return null;
  }

  // Show recording view with transcription and meeting info
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Top Status Bar */}
      <TopStatusBar />

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Column - Transcription */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0">
            <TranscriptionPanel />
          </div>
        </div>

        {/* Right Column - Meeting Info Panel */}
        <div className="w-80 flex flex-col shrink-0 overflow-hidden">
          <MeetingInfoPanel />
        </div>
      </div>
    </div>
  );
}

function SettingsView() {
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'account' | 'calendar' | 'mcpServers'
  >('account');
  const configStore = useConfigStore();

  const settingsTabs = [
    { id: 'account' as const, label: 'Account' },
    { id: 'calendar' as const, label: 'Calendar' },
    { id: 'mcpServers' as const, label: 'MCP Servers' },
  ];

  return (
    <div className="space-y-4 h-full overflow-auto">
      {/* Settings Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {settingsTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeSettingsTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSettingsTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl">
        {activeSettingsTab === 'account' && (
          <div className="max-w-md space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{configStore.userName || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">API Key</p>
                  <p className="font-mono text-xs">
                    {configStore.apiKey ? `${configStore.apiKey.slice(0, 8)}...` : 'Not set'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Meeting Copilot is a desktop app for recording meetings with real-time
                  transcription and AI-powered insights.
                </p>
                <p className="text-xs text-muted-foreground">
                  Built with Electron, React, and VideoDB.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSettingsTab === 'calendar' && <CalendarPanel />}

        {activeSettingsTab === 'mcpServers' && <MCPServersPanel />}
      </div>
    </div>
  );
}

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showRecordingPrefs, setShowRecordingPrefs] = useState(false);
  const [showMeetingSetup, setShowMeetingSetup] = useState(false);

  const configStore = useConfigStore();
  const sessionStore = useSessionStore();
  const { status: sessionStatus } = useSession();
  const { allGranted, loading: permissionsLoading } = usePermissions();

  // Global listener for recorder events - persists during navigation
  useGlobalRecorderEvents();

  const isAuthenticated = configStore.isAuthenticated();

  // Handle clearing session errors
  const handleDismissError = () => {
    sessionStore.setError(null);
  };

  // Check if we need to show calendar setup (onboarding not complete)
  const needsCalendarSetup = isAuthenticated && allGranted && !configStore.onboardingComplete;

  // Check if actively recording or processing
  const isActivelyRecording = sessionStatus === 'recording' || sessionStatus === 'processing' || sessionStatus === 'stopping' || sessionStatus === 'starting';

  // Handle start recording button from HomeView - show MeetingSetupFlow
  const handleStartRecording = () => {
    setShowMeetingSetup(true);
  };

  // Handle returning from recording/setup mode
  const handleExitRecordingMode = () => {
    setShowMeetingSetup(false);
    sessionStore.reset();
  };

  const renderContent = () => {
    // Step 0: Auth
    if (!isAuthenticated) {
      return <AuthView />;
    }

    // Step 1: Permissions (loading state)
    if (permissionsLoading) {
      return (
        <div className="h-full w-full bg-[#f8f8fa] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Orange gradient glow */}
          <div
            className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[600px] h-[567px] rounded-[300px] pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at center, rgba(236,91,22,0.08) 0%, rgba(236,91,22,0) 70%)',
            }}
          />
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-[#ec5b16] animate-spin" />
            <p className="text-[14px] text-[#464646]">Checking permissions...</p>
          </div>
        </div>
      );
    }

    // Step 1: Permissions
    if (!allGranted && activeTab === 'home') {
      return <PermissionsView />;
    }

    // Step 2: Calendar setup (only on home tab and during onboarding)
    if (needsCalendarSetup && activeTab === 'home' && !showRecordingPrefs) {
      return (
        <CalendarSetupView
          onConnected={() => setShowRecordingPrefs(true)}
          onSkip={() => {}}
        />
      );
    }

    // Step 3: Recording preferences (after calendar connected)
    if (showRecordingPrefs && activeTab === 'home') {
      return (
        <RecordingPreferencesView
          onComplete={() => {
            setShowRecordingPrefs(false);
            configStore.completeOnboarding();
          }}
        />
      );
    }

    // If actively recording, show RecordingView
    if (isActivelyRecording && activeTab === 'home') {
      return <RecordingView onBack={handleExitRecordingMode} />;
    }

    // If showing meeting setup flow (after clicking Start Recording from HomeView)
    if (showMeetingSetup && activeTab === 'home') {
      return (
        <div className="flex flex-col h-full bg-white">
          <div className="flex-1 flex items-center justify-center overflow-auto py-8">
            <MeetingSetupFlow onCancel={() => setShowMeetingSetup(false)} />
          </div>
        </div>
      );
    }

    // Main app
    switch (activeTab) {
      case 'home':
        return (
          <HomeView
            onStartRecording={handleStartRecording}
            onNavigateToHistory={() => setActiveTab('history')}
            onNavigateToSettings={() => setActiveTab('settings')}
          />
        );
      case 'history':
        return <HistoryView />;
      case 'settings':
        return <SettingsView />;
    }
  };

  // Determine if we're in the setup flow (auth, permissions, calendar setup, or recording prefs)
  const isSetupFlow = !isAuthenticated ||
    (activeTab === 'home' && (permissionsLoading || !allGranted || needsCalendarSetup || showRecordingPrefs));

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Title bar - minimal for setup flow, hidden in main app (new design has no title bar) */}
      <div
        className={`flex items-center shrink-0 drag-region relative ${
          isSetupFlow
            ? 'h-[50px] bg-[#f8f8fa] border-b border-black/10'
            : 'h-[50px] bg-white border-b border-black/10'
        }`}
      >
        {/* Space for traffic lights */}
        <div className="absolute left-0 w-20 shrink-0" />
      </div>

      {/* Calendar Auth Banner (shows when calendar needs reconnection) */}
      {isAuthenticated && !isSetupFlow && <CalendarAuthBanner />}

      {/* Main layout below titlebar */}
      <div className="flex flex-1 overflow-hidden">
        {isAuthenticated && !isSetupFlow && (
          <NewSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        )}
        <div className="flex-1 overflow-hidden">{renderContent()}</div>
      </div>

      {/* Global Copilot Components */}
      {isAuthenticated && <NudgeToast position="bottom" />}
      <ErrorToast
        message={sessionStore.error}
        onDismiss={handleDismissError}
        position="bottom"
      />
    </div>
  );
}
