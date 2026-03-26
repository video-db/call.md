import { contextBridge, ipcRenderer } from 'electron';

export interface WidgetSessionState {
  isRecording: boolean;
  isPaused: boolean;
  isMicMuted: boolean;
  startTime: number | null;
}

export interface InsightCard {
  id: string;
  text: string;
  timestamp: number;
}

export interface WidgetLiveAssistData {
  sayThis: InsightCard[];
  askThis: InsightCard[];
}

export interface WidgetNudge {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'action';
  timestamp: number;
}

export interface WidgetApi {
  // Actions
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  hide: () => Promise<void>;
  muteMic: () => Promise<void>;
  unmuteMic: () => Promise<void>;
  dismissCard: (type: 'sayThis' | 'askThis', id: string) => Promise<void>;
  dismissNudge: (id: string) => Promise<void>;
  showMainWindow: () => Promise<void>;

  // Events
  onSessionState: (callback: (state: WidgetSessionState) => void) => () => void;
  onLiveAssist: (callback: (data: WidgetLiveAssistData) => void) => () => void;
  onVisualAnalysis: (callback: (data: { description: string }) => void) => () => void;
  onNudge: (callback: (nudge: WidgetNudge | null) => void) => () => void;

  // Initial state request
  requestInitialState: () => Promise<void>;
}

const widgetApi: WidgetApi = {
  // Actions
  pause: () => ipcRenderer.invoke('widget:pause'),
  resume: () => ipcRenderer.invoke('widget:resume'),
  stop: () => ipcRenderer.invoke('widget:stop'),
  hide: () => ipcRenderer.invoke('widget:hide'),
  muteMic: () => ipcRenderer.invoke('widget:mute-mic'),
  unmuteMic: () => ipcRenderer.invoke('widget:unmute-mic'),
  dismissCard: (type: 'sayThis' | 'askThis', id: string) =>
    ipcRenderer.invoke('widget:dismiss-card', type, id),
  dismissNudge: (id: string) => ipcRenderer.invoke('widget:dismiss-nudge', id),
  showMainWindow: () => ipcRenderer.invoke('widget:show-main-window'),

  // Events
  onSessionState: (callback: (state: WidgetSessionState) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: WidgetSessionState) => callback(state);
    ipcRenderer.on('widget:session-state', listener);
    return () => ipcRenderer.removeListener('widget:session-state', listener);
  },

  onLiveAssist: (callback: (data: WidgetLiveAssistData) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: WidgetLiveAssistData) => callback(data);
    ipcRenderer.on('widget:live-assist', listener);
    return () => ipcRenderer.removeListener('widget:live-assist', listener);
  },

  onVisualAnalysis: (callback: (data: { description: string }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: { description: string }) => callback(data);
    ipcRenderer.on('widget:visual-analysis', listener);
    return () => ipcRenderer.removeListener('widget:visual-analysis', listener);
  },

  onNudge: (callback: (nudge: WidgetNudge | null) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, nudge: WidgetNudge | null) => callback(nudge);
    ipcRenderer.on('widget:nudge', listener);
    return () => ipcRenderer.removeListener('widget:nudge', listener);
  },

  // Initial state request
  requestInitialState: () => ipcRenderer.invoke('widget:request-initial-state'),
};

contextBridge.exposeInMainWorld('widgetAPI', widgetApi);
