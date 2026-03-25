/**
 * Live Assist Store
 *
 * Manages the state for real-time meeting insights generated
 * from transcript analysis every 20 seconds.
 */

import { create } from 'zustand';
import type { LiveInsights } from '../../shared/types/live-assist.types';

interface LiveAssistState {
  sayThis: string[];
  askThis: string[];
  isProcessing: boolean;
  lastProcessedAt: number | null;
  error: string | null;

  // Actions
  addInsights: (insights: LiveInsights) => void;
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useLiveAssistStore = create<LiveAssistState>((set) => ({
  sayThis: [],
  askThis: [],
  isProcessing: false,
  lastProcessedAt: null,
  error: null,

  addInsights: (insights) => set((state) => {
    // Deduplicate by checking existing items (case-insensitive)
    const existingSayThis = new Set(state.sayThis.map(s => s.toLowerCase()));
    const existingAskThis = new Set(state.askThis.map(s => s.toLowerCase()));

    const newSayThis = insights.say_this.filter(
      item => !existingSayThis.has(item.toLowerCase())
    );
    const newAskThis = insights.ask_this.filter(
      item => !existingAskThis.has(item.toLowerCase())
    );

    // Append new items to the end (max 15 per category)
    const combinedSayThis = [...state.sayThis, ...newSayThis].slice(-15);
    const combinedAskThis = [...state.askThis, ...newAskThis].slice(-15);

    return {
      sayThis: combinedSayThis,
      askThis: combinedAskThis,
      lastProcessedAt: Date.now(),
      error: null,
    };
  }),

  setProcessing: (isProcessing) => set({ isProcessing }),

  setError: (error) => set({ error, isProcessing: false }),

  clear: () => set({
    sayThis: [],
    askThis: [],
    isProcessing: false,
    lastProcessedAt: null,
    error: null,
  }),
}));
