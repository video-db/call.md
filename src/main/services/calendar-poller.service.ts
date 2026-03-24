/**
 * Calendar Poller Service
 *
 * Polls Google Calendar every 20 seconds and shows native notifications
 * for meetings based on user's recording preferences.
 *
 * Notification Behaviors:
 * - always_ask: Shows "Start Now" / "Don't Record" buttons, click opens MeetingSetupFlow
 * - default_record: Auto-records at meeting start, "Don't Record" to skip
 * - no_notification: No notifications shown
 *
 * Also handles overlapping meetings (when recording + new meeting in <5 mins)
 */

import { Notification, BrowserWindow, app } from 'electron';
import { EventEmitter } from 'events';
import { logger } from '../lib/logger';
import { fetchUpcomingEvents, CalendarAuthError } from './google-calendar.service';
import { isAuthenticated } from './google-auth.service';
import { getCalendarPreferences } from '../db';
import type { UpcomingMeeting } from '../../shared/types/calendar.types';
import type { RecordingBehavior } from '../db/schema';

const log = logger.child({ module: 'calendar-poller' });

// Polling configuration
const POLL_INTERVAL_MS = 20_000; // 20 seconds
const DEFAULT_NOTIFY_MINUTES_BEFORE = 2; // Default: notify 2 minutes before meeting
const UPCOMING_HOURS = 24; // Fetch events within next 24 hours
const OVERLAPPING_THRESHOLD_MINS = 5; // Show overlapping notification if next meeting in <5 mins

class CalendarPollerService extends EventEmitter {
  private pollInterval: NodeJS.Timeout | null = null;
  private notifiedEventIds: Set<string> = new Set();
  private skippedEventIds: Set<string> = new Set(); // User clicked "Don't Record"
  private autoRecordTimers: Map<string, NodeJS.Timeout> = new Map(); // Scheduled auto-records
  private cachedEvents: UpcomingMeeting[] = [];
  private mainWindow: BrowserWindow | null = null;
  private isPolling: boolean = false;
  private currentRecordingEventId: string | null = null; // Track which meeting we're recording

  /**
   * Set the main window reference for showing on notification click
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Set the currently recording event (called when recording starts)
   */
  setCurrentRecordingEvent(eventId: string | null): void {
    this.currentRecordingEventId = eventId;
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.currentRecordingEventId !== null;
  }

  /**
   * Start polling for calendar events
   */
  async startPolling(): Promise<void> {
    if (this.pollInterval) {
      log.debug('Polling already started');
      return;
    }

    // Check if authenticated before starting
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      log.warn('Cannot start polling - not authenticated');
      return;
    }

    // Log notification support
    log.info({ notificationSupported: Notification.isSupported() }, 'Notification support check');

    this.isPolling = true;
    log.info('Starting calendar polling');

    // Poll immediately, then every interval
    await this.pollAndNotify();

    this.pollInterval = setInterval(async () => {
      await this.pollAndNotify();
    }, POLL_INTERVAL_MS);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    // Clear all scheduled auto-record timers
    for (const [eventId, timer] of this.autoRecordTimers) {
      clearTimeout(timer);
      log.debug({ eventId }, 'Cancelled auto-record timer');
    }
    this.autoRecordTimers.clear();

    this.isPolling = false;
    this.cachedEvents = [];
    log.info('Stopped calendar polling');
  }

  /**
   * Check if currently polling
   */
  getIsPolling(): boolean {
    return this.isPolling;
  }

  /**
   * Get cached events
   */
  getCachedEvents(): UpcomingMeeting[] {
    return this.cachedEvents;
  }

  /**
   * Poll for events and send notifications
   */
  private async pollAndNotify(): Promise<void> {
    try {
      log.debug('Polling calendar events');

      // Get user preferences from DB
      const prefs = getCalendarPreferences();
      const notifyMinutes = prefs?.notifyMinutesBefore ?? DEFAULT_NOTIFY_MINUTES_BEFORE;
      const recordingBehavior = prefs?.recordingBehavior ?? 'always_ask';

      // Fetch upcoming events
      this.cachedEvents = await fetchUpcomingEvents(UPCOMING_HOURS);

      // Prune old notification IDs (events that have passed)
      this.pruneOldNotifications();

      // If user chose "no_notification", skip notifications entirely
      if (recordingBehavior === 'no_notification') {
        log.debug('Recording behavior is no_notification - skipping notifications');
        this.emit('events-updated', this.cachedEvents);
        return;
      }

      // Check for overlapping meeting situation first
      if (this.isRecording()) {
        this.checkForOverlappingMeeting();
      }

      // Check for events starting soon
      const toNotify = this.checkForUpcomingNotifications(notifyMinutes);

      // Send notifications
      for (const event of toNotify) {
        this.sendEventNotification(event, recordingBehavior);
      }

      // Emit events updated for tray/UI
      this.emit('events-updated', this.cachedEvents);

      log.debug({ eventCount: this.cachedEvents.length, notifyCount: toNotify.length }, 'Poll complete');
    } catch (error) {
      const err = error as Error;
      log.error({ error: err.message }, 'Calendar poll failed');

      // Check if it's an auth error
      if (error instanceof CalendarAuthError) {
        log.warn('Auth error during polling - stopping and emitting auth-required');
        this.stopPolling();
        this.emit('auth-required');
      }
    }
  }

  /**
   * Check for events that should trigger a notification
   */
  private checkForUpcomingNotifications(notifyMinutes: number): UpcomingMeeting[] {
    const toNotify: UpcomingMeeting[] = [];
    const thresholdMs = notifyMinutes * 60 * 1000;

    for (const event of this.cachedEvents) {
      // Skip all-day events
      if (event.isAllDay) continue;

      // Skip events user has declined to record
      if (this.skippedEventIds.has(event.id)) continue;

      const msUntil = event.startTime.getTime() - Date.now();

      // Event is starting within threshold and we haven't notified yet
      if (msUntil > 0 && msUntil <= thresholdMs && !this.notifiedEventIds.has(event.id)) {
        this.notifiedEventIds.add(event.id);
        toNotify.push(event);
      }
    }

    return toNotify;
  }

  /**
   * Check for overlapping meeting scenario
   * When recording + next meeting starts in < 5 mins
   */
  private checkForOverlappingMeeting(): void {
    // Find the next upcoming meeting (not the one we're recording)
    const nextMeeting = this.cachedEvents.find(event => {
      if (event.isAllDay) return false;
      if (event.id === this.currentRecordingEventId) return false;
      if (this.skippedEventIds.has(event.id)) return false;

      const msUntil = event.startTime.getTime() - Date.now();
      return msUntil > 0 && msUntil <= OVERLAPPING_THRESHOLD_MINS * 60 * 1000;
    });

    if (nextMeeting && !this.notifiedEventIds.has(`overlap-${nextMeeting.id}`)) {
      this.notifiedEventIds.add(`overlap-${nextMeeting.id}`);
      this.sendOverlappingMeetingNotification(nextMeeting);
    }
  }

  /**
   * Prune notification IDs for events that have passed
   */
  private pruneOldNotifications(): void {
    const currentIds = new Set(this.cachedEvents.map(e => e.id));
    const now = Date.now();

    for (const id of this.notifiedEventIds) {
      // Keep overlap IDs a bit longer
      if (id.startsWith('overlap-')) {
        const eventId = id.replace('overlap-', '');
        if (!currentIds.has(eventId)) {
          this.notifiedEventIds.delete(id);
        }
        continue;
      }

      if (!currentIds.has(id)) {
        this.notifiedEventIds.delete(id);
      }
    }

    // Also clean up skipped events that have passed
    for (const id of this.skippedEventIds) {
      const event = this.cachedEvents.find(e => e.id === id);
      if (!event || event.startTime.getTime() < now) {
        this.skippedEventIds.delete(id);
      }
    }

    // Cancel auto-record timers for events that have passed
    for (const [eventId, timer] of this.autoRecordTimers) {
      const event = this.cachedEvents.find(e => e.id === eventId);
      if (!event || event.startTime.getTime() < now) {
        clearTimeout(timer);
        this.autoRecordTimers.delete(eventId);
      }
    }
  }

  /**
   * Send a native notification for an upcoming event
   */
  private sendEventNotification(event: UpcomingMeeting, recordingBehavior: RecordingBehavior): void {
    const minutes = event.minutesUntil;

    // Check if notifications are supported
    if (!Notification.isSupported()) {
      log.warn('Notifications are not supported on this system');
      return;
    }

    log.info({
      eventId: event.id,
      summary: event.summary,
      minutesUntil: minutes,
      recordingBehavior,
      notificationSupported: Notification.isSupported(),
    }, 'Sending notification');

    if (recordingBehavior === 'always_ask') {
      this.sendAlwaysAskNotification(event, minutes);
    } else if (recordingBehavior === 'default_record') {
      this.sendDefaultRecordNotification(event, minutes);
    }
  }

  /**
   * Send notification for "always_ask" behavior
   * Buttons: "Start Now" / "Don't Record"
   * Click body: Open MeetingSetupFlow
   */
  private sendAlwaysAskNotification(event: UpcomingMeeting, minutes: number): void {
    const body = minutes <= 1
      ? `Starting now. Would you like to record it?`
      : `Starting in ${minutes} minute${minutes === 1 ? '' : 's'}. Would you like to record it?`;

    const notification = new Notification({
      title: event.summary,
      body,
      urgency: 'critical',
      actions: [
        { type: 'button', text: 'Start Now' },
        { type: 'button', text: "Don't Record" },
      ],
    });

    notification.on('action', (_e, index) => {
      if (index === 0) {
        // "Start Now" - skip UX, start recording immediately
        log.info({ eventId: event.id }, 'User clicked Start Now');
        this.showMainWindow();
        this.emit('auto-start-recording', event);
      } else if (index === 1) {
        // "Don't Record" - skip this meeting
        log.info({ eventId: event.id }, 'User clicked Don\'t Record');
        this.skippedEventIds.add(event.id);
      }
    });

    notification.on('click', () => {
      // Click on notification body - open MeetingSetupFlow
      log.info({ eventId: event.id }, 'Notification clicked - opening meeting setup');
      this.showMainWindow();
      this.emit('open-meeting-setup', event);
    });

    notification.on('show', () => {
      log.info({ eventId: event.id }, 'Notification shown');
    });

    notification.on('failed', (error) => {
      log.error({ eventId: event.id, error }, 'Notification failed');
    });

    notification.on('close', () => {
      log.debug({ eventId: event.id }, 'Notification closed');
    });

    notification.show();
    log.debug({ eventId: event.id }, 'notification.show() called');
  }

  /**
   * Send notification for "default_record" behavior
   * Shows warning, auto-records at meeting start
   * Button: "Don't Record"
   */
  private sendDefaultRecordNotification(event: UpcomingMeeting, minutes: number): void {
    const body = minutes <= 1
      ? `Starting now. Recording will start automatically.`
      : `Starting in ${minutes} minute${minutes === 1 ? '' : 's'}. Recording will start automatically.`;

    const notification = new Notification({
      title: event.summary,
      body,
      urgency: 'critical',
      actions: [
        { type: 'button', text: "Don't Record" },
      ],
    });

    // Schedule auto-record at meeting start time
    this.scheduleAutoRecord(event);

    notification.on('action', (_e, index) => {
      if (index === 0) {
        // "Don't Record" - cancel auto-record and skip this meeting
        log.info({ eventId: event.id }, 'User clicked Don\'t Record - cancelling auto-record');
        this.skippedEventIds.add(event.id);
        this.cancelAutoRecord(event.id);
      }
    });

    notification.on('click', () => {
      // Click on notification body - just open app (recording will auto-start)
      log.info({ eventId: event.id }, 'Notification clicked - opening app');
      this.showMainWindow();
    });

    notification.on('show', () => {
      log.info({ eventId: event.id }, 'Notification shown');
    });

    notification.on('failed', (error) => {
      log.error({ eventId: event.id, error }, 'Notification failed');
    });

    notification.show();
    log.debug({ eventId: event.id }, 'notification.show() called');
  }

  /**
   * Send notification for overlapping meeting scenario
   * When user is recording and a new meeting starts soon
   */
  private sendOverlappingMeetingNotification(nextMeeting: UpcomingMeeting): void {
    const minutes = nextMeeting.minutesUntil;
    const body = `"${nextMeeting.summary}" starts in ${minutes} minute${minutes === 1 ? '' : 's'}. What would you like to do?`;

    const notification = new Notification({
      title: 'Next meeting starting soon',
      body,
      urgency: 'critical',
      actions: [
        { type: 'button', text: 'Remind in 5 mins' },
        { type: 'button', text: 'Stop & Start Next' },
      ],
    });

    notification.on('action', (_e, index) => {
      if (index === 0) {
        // "Remind in 5 mins" - snooze
        log.info({ eventId: nextMeeting.id }, 'User clicked Remind in 5 mins');
        // Remove the overlap notification marker so it can be shown again
        setTimeout(() => {
          this.notifiedEventIds.delete(`overlap-${nextMeeting.id}`);
        }, 5 * 60 * 1000);
      } else if (index === 1) {
        // "Stop & Start Next" - emit event for renderer to handle
        log.info({ eventId: nextMeeting.id }, 'User clicked Stop & Start Next');
        this.showMainWindow();

        // Find current meeting info
        const currentMeeting = this.currentRecordingEventId
          ? this.cachedEvents.find(e => e.id === this.currentRecordingEventId)
          : undefined;

        this.emit('overlapping-meeting', {
          currentMeeting,
          nextMeeting,
        });
      }
    });

    notification.on('click', () => {
      log.info({ eventId: nextMeeting.id }, 'Overlapping notification clicked');
      this.showMainWindow();
    });

    notification.show();
    log.info({ eventId: nextMeeting.id }, 'Overlapping meeting notification shown');
  }

  /**
   * Schedule auto-record at meeting start time
   */
  private scheduleAutoRecord(event: UpcomingMeeting): void {
    // Don't schedule if already scheduled
    if (this.autoRecordTimers.has(event.id)) {
      log.debug({ eventId: event.id }, 'Auto-record already scheduled');
      return;
    }

    const msUntilStart = event.startTime.getTime() - Date.now();

    if (msUntilStart <= 0) {
      // Meeting already started - trigger immediately (if not already recording)
      if (!this.isRecording()) {
        log.info({ eventId: event.id }, 'Meeting already started - triggering auto-record now');
        this.showMainWindow();
        this.emit('auto-start-recording', event);
      }
      return;
    }

    log.info({ eventId: event.id, msUntilStart }, 'Scheduling auto-record');

    const timer = setTimeout(() => {
      this.autoRecordTimers.delete(event.id);

      // Check if user skipped this meeting or if we're already recording
      if (this.skippedEventIds.has(event.id)) {
        log.info({ eventId: event.id }, 'Skipping auto-record - user declined');
        return;
      }

      if (this.isRecording()) {
        log.info({ eventId: event.id }, 'Skipping auto-record - already recording');
        return;
      }

      log.info({ eventId: event.id }, 'Auto-record timer fired - starting recording');
      this.showMainWindow();
      this.emit('auto-start-recording', event);
    }, msUntilStart);

    this.autoRecordTimers.set(event.id, timer);
  }

  /**
   * Cancel a scheduled auto-record
   */
  private cancelAutoRecord(eventId: string): void {
    const timer = this.autoRecordTimers.get(eventId);
    if (timer) {
      clearTimeout(timer);
      this.autoRecordTimers.delete(eventId);
      log.info({ eventId }, 'Cancelled auto-record');
    }
  }

  /**
   * Show and focus the main window
   */
  private showMainWindow(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      log.warn('Main window not available');
      return;
    }

    this.mainWindow.show();
    this.mainWindow.focus();

    // On macOS, also show the dock icon
    if (process.platform === 'darwin') {
      app.dock?.show();
    }
  }

  /**
   * Clear all cached state
   */
  reset(): void {
    this.notifiedEventIds.clear();
    this.skippedEventIds.clear();

    // Clear all auto-record timers
    for (const timer of this.autoRecordTimers.values()) {
      clearTimeout(timer);
    }
    this.autoRecordTimers.clear();

    this.cachedEvents = [];
    this.currentRecordingEventId = null;
  }
}

// Singleton instance
let instance: CalendarPollerService | null = null;

export function getCalendarPoller(): CalendarPollerService {
  if (!instance) {
    instance = new CalendarPollerService();
  }
  return instance;
}

export function resetCalendarPoller(): void {
  if (instance) {
    instance.stopPolling();
    instance.reset();
    instance = null;
  }
}

export { CalendarPollerService };
