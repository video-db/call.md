/**
 * Live Assist Types
 *
 * Types for the real-time meeting assist feature that analyzes
 * transcript chunks and provides contextual suggestions.
 */

export interface LiveInsights {
  say_this: string[];
  ask_this: string[];
}

export interface LiveInsightsEvent {
  insights: LiveInsights;
  processedAt: number;
}
