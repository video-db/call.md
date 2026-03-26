import { ipcMain, BrowserWindow, app } from 'electron';
import { createChildLogger } from '../lib/logger';

const logger = createChildLogger('ipc-widget');
import { getWidgetWindow, sendToWidget, closeWidgetWindow } from '../windows/widget.window';

let mainWindowRef: BrowserWindow | null = null;

export function setWidgetMainWindow(window: BrowserWindow): void {
  mainWindowRef = window;
}

let widgetSessionState = {
  isRecording: false,
  isPaused: false,
  isMicMuted: false,
  startTime: null as number | null,
};

let widgetLiveAssist = {
  sayThis: [] as Array<{ id: string; text: string; timestamp: number }>,
  askThis: [] as Array<{ id: string; text: string; timestamp: number }>,
};

let widgetVisualAnalysis = {
  description: '',
};

let widgetNudge: { id: string; message: string; type: 'info' | 'warning' | 'action'; timestamp: number } | null = null;

let pauseRecordingFn: (() => Promise<void>) | null = null;
let resumeRecordingFn: (() => Promise<void>) | null = null;
let stopRecordingFn: (() => Promise<void>) | null = null;
let muteMicFn: (() => Promise<void>) | null = null;
let unmuteMicFn: (() => Promise<void>) | null = null;

export function setWidgetRecordingControls(
  pause: () => Promise<void>,
  resume: () => Promise<void>,
  stop: () => Promise<void>,
  muteMic: () => Promise<void>,
  unmuteMic: () => Promise<void>
): void {
  pauseRecordingFn = pause;
  resumeRecordingFn = resume;
  stopRecordingFn = stop;
  muteMicFn = muteMic;
  unmuteMicFn = unmuteMic;
}

export function setupWidgetIpcHandlers(): void {
  ipcMain.handle('widget:pause', async () => {
    if (pauseRecordingFn) {
      await pauseRecordingFn();
      updateWidgetSessionState({ isPaused: true });
    }
  });

  ipcMain.handle('widget:resume', async () => {
    if (resumeRecordingFn) {
      await resumeRecordingFn();
      // If mic was muted before pause, re-mute it after resuming all tracks
      if (widgetSessionState.isMicMuted && muteMicFn) {
        await muteMicFn();
      }
      updateWidgetSessionState({ isPaused: false });
    }
  });

  ipcMain.handle('widget:stop', async () => {
    if (stopRecordingFn) {
      await stopRecordingFn();
      closeWidgetWindow();
    }
  });

  ipcMain.handle('widget:mute-mic', async () => {
    if (muteMicFn) {
      await muteMicFn();
      updateWidgetSessionState({ isMicMuted: true });
    }
  });

  ipcMain.handle('widget:unmute-mic', async () => {
    if (unmuteMicFn) {
      await unmuteMicFn();
      updateWidgetSessionState({ isMicMuted: false });
    }
  });

  ipcMain.handle('widget:dismiss-card', async (_event, type: 'sayThis' | 'askThis', id: string) => {
    if (type === 'sayThis') {
      widgetLiveAssist.sayThis = widgetLiveAssist.sayThis.filter(card => card.id !== id);
    } else {
      widgetLiveAssist.askThis = widgetLiveAssist.askThis.filter(card => card.id !== id);
    }
    sendToWidget('widget:live-assist', widgetLiveAssist);
    logger.debug({ type, id }, 'Widget card dismissed');
  });

  ipcMain.handle('widget:dismiss-nudge', async (_event, id: string) => {
    if (widgetNudge?.id === id) {
      widgetNudge = null;
      sendToWidget('widget:nudge', null);
    }
    logger.debug({ id }, 'Widget nudge dismissed');
  });

  ipcMain.handle('widget:request-initial-state', async () => {
    const window = getWidgetWindow();
    if (window) {
      sendToWidget('widget:session-state', widgetSessionState);
      sendToWidget('widget:live-assist', widgetLiveAssist);
      sendToWidget('widget:visual-analysis', widgetVisualAnalysis);
      sendToWidget('widget:nudge', widgetNudge);
    }
  });

  ipcMain.handle('widget:show-main-window', async () => {
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.show();
      mainWindowRef.focus();
      if (process.platform === 'darwin') {
        app.dock?.show();
      }
    }
  });

  ipcMain.handle('widget:hide', async () => {
    const window = getWidgetWindow();
    if (window && !window.isDestroyed()) {
      window.hide();
    }
  });
}

export function removeWidgetIpcHandlers(): void {
  ipcMain.removeHandler('widget:pause');
  ipcMain.removeHandler('widget:resume');
  ipcMain.removeHandler('widget:stop');
  ipcMain.removeHandler('widget:mute-mic');
  ipcMain.removeHandler('widget:unmute-mic');
  ipcMain.removeHandler('widget:dismiss-card');
  ipcMain.removeHandler('widget:dismiss-nudge');
  ipcMain.removeHandler('widget:request-initial-state');
  ipcMain.removeHandler('widget:show-main-window');
  ipcMain.removeHandler('widget:hide');
}

export function updateWidgetSessionState(state: Partial<typeof widgetSessionState>): void {
  widgetSessionState = { ...widgetSessionState, ...state };
  sendToWidget('widget:session-state', widgetSessionState);
}

export function updateWidgetLiveAssist(data: { sayThis?: string[]; askThis?: string[] }): void {
  const timestamp = Date.now();

  logger.info({ sayCount: data.sayThis?.length || 0, askCount: data.askThis?.length || 0 }, 'Updating widget live assist');

  if (data.sayThis) {
    const newCards = data.sayThis.map((text, i) => ({
      id: `say-${timestamp}-${i}`,
      text,
      timestamp,
    }));
    widgetLiveAssist.sayThis = [...newCards, ...widgetLiveAssist.sayThis].slice(0, 5);
  }

  if (data.askThis) {
    const newCards = data.askThis.map((text, i) => ({
      id: `ask-${timestamp}-${i}`,
      text,
      timestamp,
    }));
    widgetLiveAssist.askThis = [...newCards, ...widgetLiveAssist.askThis].slice(0, 5);
  }

  logger.info({ totalSay: widgetLiveAssist.sayThis.length, totalAsk: widgetLiveAssist.askThis.length }, 'Sending live assist to widget');
  sendToWidget('widget:live-assist', widgetLiveAssist);
}

export function updateWidgetVisualAnalysis(description: string): void {
  widgetVisualAnalysis = { description };
  sendToWidget('widget:visual-analysis', widgetVisualAnalysis);
}

export function updateWidgetNudge(nudge: { id: string; message: string; type: 'info' | 'warning' | 'action' } | null): void {
  if (nudge) {
    widgetNudge = { ...nudge, timestamp: Date.now() };
  } else {
    widgetNudge = null;
  }
  sendToWidget('widget:nudge', widgetNudge);
}

export function clearWidgetState(): void {
  widgetSessionState = {
    isRecording: false,
    isPaused: false,
    isMicMuted: false,
    startTime: null,
  };
  widgetLiveAssist = { sayThis: [], askThis: [] };
  widgetVisualAnalysis = { description: '' };
  widgetNudge = null;
}
