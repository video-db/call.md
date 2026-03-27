/**
 * Live Assist Service
 *
 * Runs every 20 seconds during recording, analyzes recent transcript,
 * and generates contextual assists (things to say, questions to ask)
 * using an LLM.
 */

import { EventEmitter } from 'events';
import { logger } from '../lib/logger';
import { getLLMService } from './llm.service';
import type { LiveInsights } from '../../shared/types/live-assist.types';
import type { ProbingQuestion } from '../../shared/types/meeting-setup.types';

const log = logger.child({ module: 'live-assist' });

const LIVE_ASSIST_INTERVAL_MS = 20000; // 20 seconds

const SYSTEM_PROMPT = `You are a live meeting coach. You receive a rolling 20-second transcript from an ongoing meeting. Your job is to surface helpful nudges for the User.

IMPORTANT: All assistance must be directed to the "User" (labeled as [User] in the transcript). Only help the User — do NOT provide assistance for what the other meeting participants (labeled as [Them]) might need. Focus exclusively on what the User can say or ask.

---

## CONTEXT YOU MAY RECEIVE

You may receive additional context sections before the transcript:

- **MEETING CONTEXT**: Meeting name, purpose, prep notes, and goals. Use this to keep suggestions aligned with what the User wants to accomplish.
- **SCREEN CONTENT**: Description of what's on screen. Only use this if it's directly relevant to the current conversation — ignore generic UI descriptions or unrelated content.

---

## WHAT TO SURFACE

**say_this** - Things the User could say:
- A way to respond to something said
- An opportunity to summarize or steer the conversation
- A topic worth parking for later
- A decision that should be captured
- A commitment someone made that the User should acknowledge

**ask_this** - Questions the User could ask:
- A clarifying question worth asking
- A vague claim worth pinning down
- Follow-up questions to dig deeper

Only surface assists when the User would genuinely benefit. If the conversation is going smoothly and the User doesn't need help, return empty arrays.

---

## OUTPUT FORMAT

Return a JSON object with two arrays of strings:

{
  "say_this": [
    "That's a great point about the timeline - should we lock in Q3 as our target?"
  ],
  "ask_this": [
    "What specific metrics are behind that 15% number?"
  ]
}

---

## RULES

- Return 0-3 items per array. Quality over quantity.
- If the User genuinely doesn't need assistance, return empty arrays.
- Every suggestion must connect to something in the transcript.
- Write as ready-to-use first-person lines.
- Only output the JSON, nothing else.`;

export interface MeetingContext {
  name?: string;
  description?: string;
  questions?: ProbingQuestion[];
  checklist?: string[];
}

interface TranscriptChunk {
  text: string;
  source: 'mic' | 'system_audio';
  timestamp: number;
}

interface VisualIndexChunk {
  text: string;
  timestamp: number;
}

class LiveAssistService extends EventEmitter {
  private intervalTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private transcriptBuffer: TranscriptChunk[] = [];
  private visualIndexBuffer: VisualIndexChunk[] = [];
  private previousSayThis: Set<string> = new Set();
  private previousAskThis: Set<string> = new Set();
  private lastProcessedTimestamp = 0;
  private meetingContext: MeetingContext | null = null;

  /**
   * Start the live assist loop
   */
  start(context?: MeetingContext): void {
    if (this.isRunning) {
      log.warn('Live assist already running');
      return;
    }

    log.info({ context: context ? { name: context.name, hasDescription: !!context.description } : null }, 'Starting live assist service');
    this.isRunning = true;
    this.transcriptBuffer = [];
    this.visualIndexBuffer = [];
    this.previousSayThis.clear();
    this.previousAskThis.clear();
    this.lastProcessedTimestamp = Date.now();
    this.meetingContext = context || null;

    // Run immediately, then every 20 seconds
    this.processTranscript();
    this.intervalTimer = setInterval(() => {
      this.processTranscript();
    }, LIVE_ASSIST_INTERVAL_MS);
  }

  /**
   * Stop the live assist loop
   */
  stop(): void {
    if (!this.isRunning) return;

    log.info('Stopping live assist service');
    this.isRunning = false;

    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }

    this.transcriptBuffer = [];
    this.visualIndexBuffer = [];
    this.previousSayThis.clear();
    this.previousAskThis.clear();
    this.meetingContext = null;
  }

  /**
   * Add a transcript segment to the buffer
   */
  addTranscript(text: string, source: 'mic' | 'system_audio'): void {
    if (!this.isRunning) return;

    this.transcriptBuffer.push({
      text,
      source,
      timestamp: Date.now(),
    });

    // Keep only last 60 seconds of transcript for context
    const cutoff = Date.now() - 60000;
    this.transcriptBuffer = this.transcriptBuffer.filter(t => t.timestamp > cutoff);
  }

  /**
   * Add a visual index event to the buffer
   */
  addVisualIndex(text: string): void {
    if (!this.isRunning) return;

    this.visualIndexBuffer.push({
      text,
      timestamp: Date.now(),
    });

    // Keep only last 60 seconds of visual index for context
    const cutoff = Date.now() - 60000;
    this.visualIndexBuffer = this.visualIndexBuffer.filter(v => v.timestamp > cutoff);
  }

  /**
   * Build meeting context section for prompt (only if context exists)
   */
  private buildMeetingContextSection(): string {
    if (!this.meetingContext) return '';

    const parts: string[] = [];

    if (this.meetingContext.name) {
      parts.push(`Meeting: ${this.meetingContext.name}`);
    }

    if (this.meetingContext.description) {
      parts.push(`Purpose: ${this.meetingContext.description}`);
    }

    if (this.meetingContext.questions && this.meetingContext.questions.length > 0) {
      const answeredQuestions = this.meetingContext.questions
        .filter(q => q.answer)
        .map(q => `- ${q.question}: ${q.answer}`)
        .join('\n');
      if (answeredQuestions) {
        parts.push(`Key context from prep:\n${answeredQuestions}`);
      }
    }

    if (this.meetingContext.checklist && this.meetingContext.checklist.length > 0) {
      parts.push(`Goals to cover:\n${this.meetingContext.checklist.map(c => `- ${c}`).join('\n')}`);
    }

    if (parts.length === 0) return '';

    return `## MEETING CONTEXT\n${parts.join('\n\n')}\n\n---\n\n`;
  }

  /**
   * Build visual index section for prompt (only if recent visual data exists)
   */
  private buildVisualIndexSection(cutoff: number): string {
    const recentVisuals = this.visualIndexBuffer.filter(v => v.timestamp > cutoff);
    if (recentVisuals.length === 0) return '';

    const visualText = recentVisuals.map(v => v.text).join('\n');
    return `## SCREEN CONTENT (use only if relevant to the meeting)\n${visualText}\n\n---\n\n`;
  }

  /**
   * Process transcript and generate assists
   */
  private async processTranscript(): Promise<void> {
    if (!this.isRunning) return;

    // Get transcript from last 20 seconds
    const cutoff = Date.now() - LIVE_ASSIST_INTERVAL_MS;
    const recentChunks = this.transcriptBuffer.filter(t => t.timestamp > cutoff);

    if (recentChunks.length === 0) {
      log.debug('No recent transcript to process');
      return;
    }

    // Build transcript text with speaker labels
    const transcriptText = recentChunks
      .map(chunk => {
        const speaker = chunk.source === 'mic' ? 'User' : 'Them';
        return `[${speaker}]: ${chunk.text}`;
      })
      .join('\n');

    // Build context sections (only included if they have content)
    const meetingContextSection = this.buildMeetingContextSection();
    const visualIndexSection = this.buildVisualIndexSection(cutoff);

    const userPrompt = `${meetingContextSection}${visualIndexSection}## TRANSCRIPT\n${transcriptText}`;

    log.info({ chunkCount: recentChunks.length, textLength: transcriptText.length, hasContext: !!meetingContextSection, hasVisual: !!visualIndexSection }, 'Processing transcript for live assist');

    try {
      const llm = getLLMService();
      const response = await llm.chatCompletionJSON<LiveInsights>([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ]);

      if (!response.success || !response.data) {
        log.warn({ error: response.error }, 'Failed to get live assist response');
        return;
      }

      const { say_this, ask_this } = response.data;
      log.debug({ say_this, ask_this }, 'Insights generated for this chunk');

      // Filter out duplicates from previous rounds
      const newSayThis = (say_this || [])
        .filter(item => !this.previousSayThis.has(item.toLowerCase()))
        .slice(0, 3);

      const newAskThis = (ask_this || [])
        .filter(item => !this.previousAskThis.has(item.toLowerCase()))
        .slice(0, 3);

      // Track these to avoid repetition
      newSayThis.forEach(item => this.previousSayThis.add(item.toLowerCase()));
      newAskThis.forEach(item => this.previousAskThis.add(item.toLowerCase()));

      // Keep previous sets manageable (last 20 each)
      if (this.previousSayThis.size > 20) {
        const arr = Array.from(this.previousSayThis);
        this.previousSayThis = new Set(arr.slice(-20));
      }
      if (this.previousAskThis.size > 20) {
        const arr = Array.from(this.previousAskThis);
        this.previousAskThis = new Set(arr.slice(-20));
      }

      if (newSayThis.length > 0 || newAskThis.length > 0) {
        log.info({ sayCount: newSayThis.length, askCount: newAskThis.length }, 'Generated new live insights');
        this.emit('insights', {
          insights: { say_this: newSayThis, ask_this: newAskThis },
          processedAt: Date.now(),
        });
      }
    } catch (error) {
      log.error({ error }, 'Error processing transcript for live assist');
    }
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.transcriptBuffer = [];
    this.visualIndexBuffer = [];
    this.previousSayThis.clear();
    this.previousAskThis.clear();
    this.meetingContext = null;
  }
}

// Singleton instance
let instance: LiveAssistService | null = null;

export function getLiveAssistService(): LiveAssistService {
  if (!instance) {
    instance = new LiveAssistService();
  }
  return instance;
}

export function resetLiveAssistService(): void {
  if (instance) {
    instance.stop();
    instance.removeAllListeners();
    instance = null;
  }
}

export { LiveAssistService };
export type { TranscriptChunk };
