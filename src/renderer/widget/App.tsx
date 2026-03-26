import React, { useEffect, useState, useCallback } from 'react';
import { WidgetContainer } from './components/WidgetContainer';
import { WidgetHeader } from './components/WidgetHeader';
import { WidgetContent } from './components/WidgetContent';
import { WidgetFooter } from './components/WidgetFooter';
import type {
  InsightCard,
  WidgetSessionState as SessionState,
  WidgetNudge as Nudge,
  WidgetLiveAssistData,
} from '../../types/widget';

export function WidgetApp() {
  const [sessionState, setSessionState] = useState<SessionState>({
    isRecording: true,
    isPaused: false,
    isMicMuted: false,
    startTime: Date.now(),
  });
  const [sayThis, setSayThis] = useState<InsightCard[]>([]);
  const [askThis, setAskThis] = useState<InsightCard[]>([]);
  const [visualDescription, setVisualDescription] = useState<string>('');
  const [nudge, setNudge] = useState<Nudge | null>(null);

  useEffect(() => {
    const api = window.widgetAPI;
    if (!api) return;

    // Request initial state
    api.requestInitialState();

    // Set up listeners
    const unsubSession = api.onSessionState((state) => {
      setSessionState(state);
    });

    const unsubLiveAssist = api.onLiveAssist((data) => {
      setSayThis(data.sayThis);
      setAskThis(data.askThis);
    });

    const unsubVisual = api.onVisualAnalysis((data) => {
      setVisualDescription(data.description);
    });

    const unsubNudge = api.onNudge((n) => {
      setNudge(n);
    });

    return () => {
      unsubSession();
      unsubLiveAssist();
      unsubVisual();
      unsubNudge();
    };
  }, []);

  // Auto-dismiss nudge after 5 seconds
  useEffect(() => {
    if (!nudge) return;
    const timer = setTimeout(() => {
      setNudge(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [nudge]);

  const handlePause = useCallback(async () => {
    await window.widgetAPI?.pause();
  }, []);

  const handleResume = useCallback(async () => {
    await window.widgetAPI?.resume();
  }, []);

  const handleStop = useCallback(async () => {
    await window.widgetAPI?.stop();
  }, []);

  const handleMuteMic = useCallback(async () => {
    await window.widgetAPI?.muteMic();
  }, []);

  const handleUnmuteMic = useCallback(async () => {
    await window.widgetAPI?.unmuteMic();
  }, []);

  const handleDismissCard = useCallback(async (type: 'sayThis' | 'askThis', id: string) => {
    await window.widgetAPI?.dismissCard(type, id);
    if (type === 'sayThis') {
      setSayThis((prev) => prev.filter((c) => c.id !== id));
    } else {
      setAskThis((prev) => prev.filter((c) => c.id !== id));
    }
  }, []);

  const handleDismissNudge = useCallback(async () => {
    if (nudge) {
      await window.widgetAPI?.dismissNudge(nudge.id);
      setNudge(null);
    }
  }, [nudge]);

  return (
    <WidgetContainer>
      <WidgetHeader />
      <WidgetContent
        sayThis={sayThis}
        askThis={askThis}
        visualDescription={visualDescription}
        nudge={nudge}
        onDismissCard={handleDismissCard}
        onDismissNudge={handleDismissNudge}
      />
      <WidgetFooter
        onStop={handleStop}
        isPaused={sessionState.isPaused}
        onPause={handlePause}
        onResume={handleResume}
        isMicMuted={sessionState.isMicMuted}
        onMuteMic={handleMuteMic}
        onUnmuteMic={handleUnmuteMic}
      />
    </WidgetContainer>
  );
}
