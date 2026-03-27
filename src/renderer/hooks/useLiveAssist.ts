/**
 * useLiveAssist Hook
 *
 * Manages the live assist feature lifecycle and subscribes to
 * insight updates from the main process.
 */

import { useEffect, useRef } from 'react';
import { useLiveAssistStore } from '../stores/live-assist.store';
import { useSessionStore } from '../stores/session.store';
import { useMeetingSetupStore } from '../stores/meeting-setup.store';
import { getElectronAPI } from '../api/ipc';

export function useLiveAssist() {
  const store = useLiveAssistStore();
  const { status } = useSessionStore();
  const isRecording = status === 'recording';
  const wasRecordingRef = useRef(false);

  // Start/stop live assist based on recording state
  useEffect(() => {
    const api = getElectronAPI();
    if (!api) return;

    if (isRecording && !wasRecordingRef.current) {
      // Recording just started - get meeting context
      const meetingSetup = useMeetingSetupStore.getState();
      const context = {
        name: meetingSetup.name || undefined,
        description: meetingSetup.description || undefined,
        questions: meetingSetup.questions.length > 0 ? meetingSetup.questions : undefined,
        checklist: meetingSetup.checklist.length > 0 ? meetingSetup.checklist : undefined,
      };

      // Only pass context if at least one field has content
      const hasContext = context.name || context.description || context.questions || context.checklist;

      console.log('[LiveAssist] Starting live assist service', hasContext ? 'with context' : 'without context');
      api.liveAssist.start(hasContext ? context : undefined).catch(err => {
        console.error('[LiveAssist] Failed to start:', err);
      });
      wasRecordingRef.current = true;
    } else if (!isRecording && wasRecordingRef.current) {
      // Recording just stopped
      console.log('[LiveAssist] Stopping live assist service');
      api.liveAssist.stop().catch(err => {
        console.error('[LiveAssist] Failed to stop:', err);
      });
      store.clear();
      wasRecordingRef.current = false;
    }
  }, [isRecording, store]);

  // Subscribe to live assist updates
  useEffect(() => {
    const api = getElectronAPI();
    if (!api) return;

    console.log('[LiveAssist] Setting up event listener');

    const unsubscribe = api.liveAssistOn.onUpdate((event) => {
      console.log('[LiveAssist] Received insights:', {
        sayThis: event.insights.say_this.length,
        askThis: event.insights.ask_this.length,
      });
      store.addInsights(event.insights);
    });

    return () => {
      console.log('[LiveAssist] Cleaning up event listener');
      unsubscribe();
    };
  }, [store]);

  return {
    sayThis: store.sayThis,
    askThis: store.askThis,
    isProcessing: store.isProcessing,
    lastProcessedAt: store.lastProcessedAt,
    error: store.error,
    clear: store.clear,
  };
}

export default useLiveAssist;
