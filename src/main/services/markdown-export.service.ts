/**
 * Markdown Export Service
 *
 * Exports meeting transcripts and summaries to markdown files in a globally
 * accessible folder structure (~/.notter/) for AI agents and other tools.
 *
 * Directory structure:
 *   ~/.notter/
 *     ├── index.md (list of all meetings)
 *     └── meetings/
 *         └── 2024/
 *             └── 03/
 *                 └── 24/
 *                     └── <meeting_name>.md
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { createChildLogger } from '../lib/logger';
import type { PostMeetingSummary, KeyPoint } from './copilot/summary-generator.service';
import type { ConversationMetrics } from './copilot/conversation-metrics.service';

const logger = createChildLogger('markdown-export');

const NOTTER_DIR = path.join(os.homedir(), '.notter');
const MEETINGS_DIR = path.join(NOTTER_DIR, 'meetings');
const INDEX_FILE = path.join(NOTTER_DIR, 'index.md');

export interface MeetingExportData {
  recordingId: number;
  meetingName: string;
  meetingDescription?: string;
  startedAt: Date;
  duration: number; // seconds
  summary: PostMeetingSummary;
  metrics?: ConversationMetrics;
  transcript: Array<{
    speaker: 'me' | 'them';
    text: string;
    startTime: number;
  }>;
}

/**
 * Ensure the .notter directory structure exists
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Sanitize a filename by removing/replacing invalid characters
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 100); // Limit length
}

/**
 * Format duration as human-readable string
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

/**
 * Format timestamp as MM:SS
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate markdown content for a meeting
 */
function generateMeetingMarkdown(data: MeetingExportData): string {
  const lines: string[] = [];
  const dateStr = data.startedAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = data.startedAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  lines.push(`# ${data.meetingName}`);
  lines.push('');
  lines.push(`**Date:** ${dateStr}`);
  lines.push(`**Time:** ${timeStr}`);
  lines.push(`**Duration:** ${formatDuration(data.duration)}`);
  if (data.meetingDescription) {
    lines.push(`**Description:** ${data.meetingDescription}`);
  }
  lines.push('');

  if (data.metrics) {
    lines.push('## Conversation Metrics');
    lines.push('');
    lines.push(`- **Talk Ratio:** You ${Math.round(data.metrics.talkRatio.me * 100)}% / Them ${Math.round(data.metrics.talkRatio.them * 100)}%`);
    lines.push(`- **Speaking Pace:** ${data.metrics.pace} WPM`);
    lines.push(`- **Questions Asked:** ${data.metrics.questionsAsked}`);
    if (data.metrics.monologueDetected) {
      lines.push(`- **Monologue Detected:** Yes`);
    }
    lines.push('');
  }

  lines.push('## Summary');
  lines.push('');
  lines.push(data.summary.shortOverview);
  lines.push('');

  if (data.summary.keyPoints && data.summary.keyPoints.length > 0) {
    lines.push('## Key Discussion Points');
    lines.push('');
    for (const kp of data.summary.keyPoints) {
      lines.push(`### ${kp.topic}`);
      lines.push('');
      for (const point of kp.points) {
        lines.push(`- ${point}`);
      }
      lines.push('');
    }
  }

  if (data.summary.postMeetingChecklist && data.summary.postMeetingChecklist.length > 0) {
    lines.push('## Action Items');
    lines.push('');
    for (const item of data.summary.postMeetingChecklist) {
      lines.push(`- [ ] ${item}`);
    }
    lines.push('');
  }

  if (data.transcript && data.transcript.length > 0) {
    lines.push('## Transcript');
    lines.push('');
    for (const segment of data.transcript) {
      const speaker = segment.speaker === 'me' ? 'You' : 'Them';
      const time = formatTimestamp(segment.startTime);
      lines.push(`**[${time}] ${speaker}:** ${segment.text}`);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push(`*Exported by Notter on ${new Date().toISOString()}*`);

  return lines.join('\n');
}

/**
 * Get the file path for a meeting based on its date
 */
function getMeetingFilePath(meetingName: string, date: Date): string {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const filename = `${sanitizeFilename(meetingName)}.md`;

  return path.join(MEETINGS_DIR, year, month, day, filename);
}

/**
 * Parse an index entry from a line
 */
interface IndexEntry {
  date: string;
  name: string;
  path: string;
  duration: string;
}

function parseIndexEntries(): IndexEntry[] {
  if (!fs.existsSync(INDEX_FILE)) {
    return [];
  }

  const content = fs.readFileSync(INDEX_FILE, 'utf-8');
  const entries: IndexEntry[] = [];

  // Parse table rows (skip header and separator)
  const lines = content.split('\n');
  let inTable = false;

  for (const line of lines) {
    if (line.startsWith('| Date')) {
      inTable = true;
      continue;
    }
    if (line.startsWith('|---')) {
      continue;
    }
    if (inTable && line.startsWith('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 4) {
        // Extract path from markdown link [name](path)
        const linkMatch = parts[1].match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          entries.push({
            date: parts[0],
            name: linkMatch[1],
            path: linkMatch[2],
            duration: parts[2],
          });
        }
      }
    }
  }

  return entries;
}

/**
 * Update the index file with a new meeting entry
 */
function updateIndex(data: MeetingExportData, relativePath: string): void {
  const entries = parseIndexEntries();

  const dateStr = data.startedAt.toISOString().split('T')[0];
  const newEntry: IndexEntry = {
    date: dateStr,
    name: data.meetingName,
    path: relativePath,
    duration: formatDuration(data.duration),
  };

  const existingIndex = entries.findIndex(e => e.path === relativePath);
  if (existingIndex >= 0) {
    entries[existingIndex] = newEntry;
  } else {
    entries.unshift(newEntry); // Add to beginning (most recent first)
  }

  entries.sort((a, b) => b.date.localeCompare(a.date));

  const lines: string[] = [];
  lines.push('# Notter Meeting Index');
  lines.push('');
  lines.push('A chronological index of all recorded meetings.');
  lines.push('');
  lines.push(`*Last updated: ${new Date().toISOString()}*`);
  lines.push('');
  lines.push('| Date | Meeting | Duration | Path |');
  lines.push('|------|---------|----------|------|');

  for (const entry of entries) {
    lines.push(`| ${entry.date} | [${entry.name}](${entry.path}) | ${entry.duration} | \`${entry.path}\` |`);
  }

  lines.push('');

  fs.writeFileSync(INDEX_FILE, lines.join('\n'), 'utf-8');
  logger.debug({ entryCount: entries.length }, 'Index file updated');
}

/**
 * Export a meeting to markdown
 */
export async function exportMeetingToMarkdown(data: MeetingExportData): Promise<string> {
  // Ensure directory structure exists
  initializeNotterDir();

  try {
    const filePath = getMeetingFilePath(data.meetingName, data.startedAt);
    const dirPath = path.dirname(filePath);

    ensureDirectoryExists(dirPath);

    const markdown = generateMeetingMarkdown(data);

    fs.writeFileSync(filePath, markdown, 'utf-8');
    logger.info({ filePath, meetingName: data.meetingName }, 'Meeting exported to markdown');

    const relativePath = path.relative(NOTTER_DIR, filePath);
    updateIndex(data, relativePath);

    return filePath;
  } catch (error) {
    const err = error as Error;
    logger.error({ error: err.message, meetingName: data.meetingName }, 'Failed to export meeting to markdown');
    throw error;
  }
}

/**
 * Get the .notter directory path
 */
export function getNotterDir(): string {
  return NOTTER_DIR;
}

/**
 * Initialize the .notter directory structure
 */
export function initializeNotterDir(): void {
  ensureDirectoryExists(NOTTER_DIR);
  ensureDirectoryExists(MEETINGS_DIR);

  // Create index file if it doesn't exist
  if (!fs.existsSync(INDEX_FILE)) {
    const initialContent = [
      '# Notter Meeting Index',
      '',
      'A chronological index of all recorded meetings.',
      '',
      `*Last updated: ${new Date().toISOString()}*`,
      '',
      '| Date | Meeting | Duration | Path |',
      '|------|---------|----------|------|',
      '',
    ].join('\n');

    fs.writeFileSync(INDEX_FILE, initialContent, 'utf-8');
    logger.info({ path: NOTTER_DIR }, 'Initialized .notter directory');
  }
}
