/**
 * Google Calendar Integration Types
 */

// Google OAuth Tokens
export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in ms
}

// Google OAuth Config (loaded from resources/google_oauth.json)
export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  tokenUri: string;
  authUri: string;
}

// Calendar Event from Google Calendar API
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string; // ISO string for timed events
    date?: string; // YYYY-MM-DD for all-day events
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  hangoutLink?: string; // Google Meet link
  htmlLink?: string; // Link to event in Google Calendar
  status?: 'confirmed' | 'tentative' | 'cancelled';
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    self?: boolean;
  }>;
  organizer?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: 'video' | 'phone' | 'sip' | 'more';
      uri: string;
      label?: string;
    }>;
  };
}

// Simplified event for notifications and UI
export interface UpcomingMeeting {
  id: string;
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  minutesUntil: number;
  meetLink?: string;
  location?: string;
  htmlLink?: string;
  isAllDay: boolean;
}

// Calendar Auth State
export type CalendarAuthState =
  | { status: 'disconnected' }
  | { status: 'connecting' }
  | { status: 'connected'; email?: string }
  | { status: 'error'; error: string };

// Poller State
export interface CalendarPollerState {
  isPolling: boolean;
  lastPollAt?: number;
  upcomingEvents: UpcomingMeeting[];
  error?: string;
}

// IPC Response types
export interface CalendarSignInResult {
  success: boolean;
  error?: string;
}

export interface CalendarEventsResult {
  success: boolean;
  events?: UpcomingMeeting[];
  error?: string;
}

export interface CalendarAuthStatusResult {
  success: boolean;
  isSignedIn: boolean;
  error?: string;
}

// Calendar API for preload
export interface CalendarApi {
  signIn: () => Promise<CalendarSignInResult>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  isSignedIn: () => Promise<CalendarAuthStatusResult>;
  getUpcomingEvents: (hours?: number) => Promise<CalendarEventsResult>;
  // Notify poller about recording state (for overlapping meeting detection)
  setRecordingMeeting: (eventId: string | null) => Promise<{ success: boolean }>;
}

export interface CalendarEvents {
  onAuthRequired: (callback: () => void) => () => void;
  onEventsUpdated: (callback: (events: UpcomingMeeting[]) => void) => () => void;
  // Notification action events
  onOpenMeetingSetup: (callback: (meeting: UpcomingMeeting) => void) => () => void;
  onAutoStartRecording: (callback: (meeting: UpcomingMeeting) => void) => () => void;
  // Overlapping meeting event (recording active + new meeting starting)
  onOverlappingMeeting: (callback: (data: { currentMeeting?: UpcomingMeeting; nextMeeting: UpcomingMeeting }) => void) => () => void;
}

// Prepared Meeting - stored context for calendar events before they start
export interface PreparedMeetingQuestion {
  question: string;
  options?: string[];
  answer: string;
  customAnswer?: string;
}

export interface PreparedMeeting {
  calendarEventId: string;
  name: string;
  description?: string | null;
  probingQuestions?: PreparedMeetingQuestion[];
  checklist?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PreparedMeetingInput {
  calendarEventId: string;
  name: string;
  description?: string;
  probingQuestions?: PreparedMeetingQuestion[];
  checklist?: string[];
}

export interface PreparedMeetingsApi {
  get: (calendarEventId: string) => Promise<{ success: boolean; meeting?: PreparedMeeting; error?: string }>;
  getAll: () => Promise<{ success: boolean; meetings?: PreparedMeeting[]; error?: string }>;
  save: (data: PreparedMeetingInput) => Promise<{ success: boolean; meeting?: PreparedMeeting; error?: string }>;
  delete: (calendarEventId: string) => Promise<{ success: boolean; error?: string }>;
}
