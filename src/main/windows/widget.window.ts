import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { createChildLogger } from '../lib/logger';
import { loadAppConfig, saveAppConfig } from '../lib/config';

const logger = createChildLogger('widget-window');

let widgetWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV !== 'production' && !require('electron').app.isPackaged;

const WIDGET_WIDTH = 378;
const WIDGET_DEFAULT_HEIGHT = 500;
const WIDGET_MIN_HEIGHT = 200;
const WIDGET_MARGIN = 20;

interface WidgetPosition {
  x: number;
  y: number;
}

function loadWidgetPosition(): WidgetPosition | null {
  const config = loadAppConfig();
  return config.widgetPosition || null;
}

function saveWidgetPosition(position: WidgetPosition): void {
  const config = loadAppConfig();
  saveAppConfig({ ...config, widgetPosition: position });
}

function getDefaultPosition(): WidgetPosition {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  return {
    x: width - WIDGET_WIDTH - WIDGET_MARGIN,
    y: height - WIDGET_DEFAULT_HEIGHT - WIDGET_MARGIN,
  };
}

function validatePosition(position: WidgetPosition): WidgetPosition {
  const displays = screen.getAllDisplays();
  let isValid = false;

  for (const display of displays) {
    const { x, y, width, height } = display.bounds;
    if (
      position.x >= x &&
      position.x < x + width &&
      position.y >= y &&
      position.y < y + height
    ) {
      isValid = true;
      break;
    }
  }

  return isValid ? position : getDefaultPosition();
}

export function createWidgetWindow(): BrowserWindow {
  logger.info('Creating widget window');

  if (widgetWindow && !widgetWindow.isDestroyed()) {
    logger.info('Widget window already exists, showing');
    widgetWindow.show();
    return widgetWindow;
  }

  const savedPosition = loadWidgetPosition();
  const position = savedPosition ? validatePosition(savedPosition) : getDefaultPosition();

  widgetWindow = new BrowserWindow({
    width: WIDGET_WIDTH,
    height: WIDGET_DEFAULT_HEIGHT,
    minWidth: WIDGET_WIDTH,
    maxWidth: WIDGET_WIDTH,
    minHeight: WIDGET_MIN_HEIGHT,
    x: position.x,
    y: position.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      // __dirname is dist/main/windows, preload is at dist/preload
      preload: path.join(__dirname, '..', '..', 'preload', 'widget.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Critical: Visible on fullscreen apps (macOS)
  widgetWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  });

  // Set window level above everything
  widgetWindow.setAlwaysOnTop(true, 'floating', 1);

  // Load the widget HTML
  if (isDev) {
    const VITE_DEV_PORT = 51730;
    widgetWindow.loadURL(`http://localhost:${VITE_DEV_PORT}/widget.html`);
  } else {
    // __dirname is dist/main/windows, renderer is at dist/renderer
    widgetWindow.loadFile(path.join(__dirname, '..', '..', 'renderer', 'widget.html'));
  }

  // Save position on move
  widgetWindow.on('moved', () => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      const [x, y] = widgetWindow.getPosition();
      saveWidgetPosition({ x, y });
    }
  });

  widgetWindow.on('closed', () => {
    widgetWindow = null;
  });

  widgetWindow.once('ready-to-show', () => {
    widgetWindow?.show();
  });

  return widgetWindow;
}

export function showWidgetWindow(): void {
  logger.info('showWidgetWindow called');
  if (!widgetWindow || widgetWindow.isDestroyed()) {
    createWidgetWindow();
  } else {
    widgetWindow.show();
  }
}

export function hideWidgetWindow(): void {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.hide();
  }
}

export function closeWidgetWindow(): void {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.close();
    widgetWindow = null;
  }
}

export function getWidgetWindow(): BrowserWindow | null {
  return widgetWindow && !widgetWindow.isDestroyed() ? widgetWindow : null;
}

export function sendToWidget(channel: string, data: unknown): void {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    logger.debug({ channel }, 'Sending to widget');
    widgetWindow.webContents.send(channel, data);
  } else {
    logger.warn({ channel }, 'Widget window not available, cannot send');
  }
}
