/**
 * Transcription Panel Component
 *
 * Design matching Figma:
 * - Header with transcript icon
 * - Timestamp badges (orange for You, blue for Them)
 * - Visual Analysis entries with blue styling
 * - Auto-scroll on new items
 */

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranscriptionStore, TranscriptItem } from '../../stores/transcription.store';
import { useVisualIndexStore, VisualIndexItem } from '../../stores/visual-index.store';
import { useSessionStore } from '../../stores/session.store';

// Sparkle icon for Meeting Transcript
function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 2.5L11.5 7L16.25 8.125L12.5 11.25L13.125 16.25L10 13.75L6.875 16.25L7.5 11.25L3.75 8.125L8.5 7L10 2.5Z"
        stroke="#EC5B16"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(236, 91, 22, 0.1)"
      />
    </svg>
  );
}

interface TranscriptMessageProps {
  item: TranscriptItem;
}

function TranscriptMessage({ item }: TranscriptMessageProps) {
  const isMe = item.source === 'mic';

  // Format relative timestamp (MM:SS from recording start)
  const formatRelativeTime = (timestamp: number) => {
    const startTime = useSessionStore.getState().startTime;
    if (!startTime) return '0:00';
    const relativeMs = timestamp - startTime;
    const totalSeconds = Math.max(0, Math.floor(relativeMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-[8px]">
      {/* Speaker row */}
      <div className="bg-[#f9fafb] rounded-[10px] px-[8px] py-[6px] flex items-center gap-[12px]">
        {/* Timestamp badge */}
        <div
          className={`px-[8px] py-[4px] rounded-[7px] ${
            isMe ? 'bg-[#ffe9d3]' : 'bg-[rgba(45,140,255,0.2)]'
          }`}
        >
          <span
            className={`font-semibold text-[13px] leading-[16px] ${
              isMe ? 'text-[#ec5b16]' : 'text-[#2d8cff]'
            }`}
          >
            {formatRelativeTime(item.timestamp)}
          </span>
        </div>
        {/* Speaker name */}
        <span className="font-medium text-[13px] text-black leading-[16px]">
          {isMe ? 'You' : 'Them'}
        </span>
      </div>
      {/* Text content */}
      <p className="text-[14px] text-black leading-[22px]">{item.text}</p>
    </div>
  );
}

interface VisualAnalysisEntryProps {
  item: VisualIndexItem;
}

function VisualAnalysisEntry({ item }: VisualAnalysisEntryProps) {
  // Format relative timestamp using when the item was received (same as transcripts)
  const formatRelativeTime = () => {
    const startTime = useSessionStore.getState().startTime;
    if (!startTime) return '0:00';
    const relativeMs = item.timestamp - startTime;
    const totalSeconds = Math.max(0, Math.floor(relativeMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#eff6ff] border border-[#5095fb] rounded-[10px] p-[12px] flex flex-col gap-[12px]">
      {/* Header row */}
      <div className="flex items-center gap-[12px]">
        <div className="bg-white px-[8px] py-[4px] rounded-[7px]">
          <span className="font-semibold text-[13px] text-[#5095fb] leading-[16px]">
            {formatRelativeTime()}
          </span>
        </div>
        <span className="font-medium text-[13px] text-black leading-[16px]">Visual Analysis</span>
      </div>
      {/* Content with markdown rendering */}
      <div className="text-[14px] text-black leading-[24px] prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
        <ReactMarkdown>{item.text}</ReactMarkdown>
      </div>
    </div>
  );
}

interface PendingMessageProps {
  text: string;
  source: 'mic' | 'system_audio';
}

function PendingMessage({ text, source }: PendingMessageProps) {
  const isMe = source === 'mic';

  return (
    <div className="flex flex-col gap-[8px] opacity-70">
      {/* Speaker row */}
      <div className="bg-[#f9fafb] rounded-[10px] px-[8px] py-[6px] flex items-center gap-[12px]">
        <div
          className={`px-[8px] py-[4px] rounded-[7px] animate-pulse ${
            isMe ? 'bg-[#ffe9d3]' : 'bg-[rgba(45,140,255,0.2)]'
          }`}
        >
          <span
            className={`font-semibold text-[13px] leading-[16px] ${
              isMe ? 'text-[#ec5b16]' : 'text-[#2d8cff]'
            }`}
          >
            ...
          </span>
        </div>
        <span className="font-medium text-[13px] text-black leading-[16px]">
          {isMe ? 'You' : 'Them'}
        </span>
      </div>
      {/* Text content */}
      <p className="text-[14px] text-black leading-[22px] italic">{text}</p>
    </div>
  );
}

// Merge and sort transcript items with visual items by timestamp
interface MergedItem {
  type: 'transcript' | 'visual';
  timestamp: number;
  data: TranscriptItem | VisualIndexItem;
}

function mergeItems(transcripts: TranscriptItem[], visuals: VisualIndexItem[]): MergedItem[] {
  const merged: MergedItem[] = [
    ...transcripts.map((t) => ({ type: 'transcript' as const, timestamp: t.timestamp, data: t })),
    ...visuals.map((v) => ({ type: 'visual' as const, timestamp: v.timestamp, data: v })),
  ];
  return merged.sort((a, b) => a.timestamp - b.timestamp);
}

export function TranscriptionPanel() {
  const { items, enabled, pendingMic, pendingSystemAudio } = useTranscriptionStore();
  const { items: visualItems } = useVisualIndexStore();
  const { status } = useSessionStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevItemCountRef = useRef(0);

  const isRecording = status === 'recording';

  // Merge transcript and visual items sorted by timestamp
  const mergedItems = mergeItems(items, visualItems);
  const totalItemCount = mergedItems.length + (pendingMic ? 1 : 0) + (pendingSystemAudio ? 1 : 0);

  // Auto-scroll to bottom when new items arrive
  useEffect(() => {
    if (totalItemCount > prevItemCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevItemCountRef.current = totalItemCount;
  }, [totalItemCount]);

  return (
    <div className="border border-[#efefef] rounded-[12px] flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-[#efefef] px-[16px] py-[10px] flex items-center gap-[8px] shrink-0 rounded-t-[12px]">
        <SparkleIcon />
        <span className="font-medium text-[15px] text-black">Meeting Transcript</span>
      </div>

      {/* Transcript Content */}
      <div
        ref={scrollRef}
        className="flex-1 bg-white overflow-y-auto p-[16px] flex flex-col gap-[10px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {mergedItems.length === 0 && !pendingMic && !pendingSystemAudio ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-[64px] h-[64px] rounded-full bg-[#f7f7f7] flex items-center justify-center mb-4">
              <SparkleIcon />
            </div>
            <p className="text-[#464646] font-medium text-[14px]">
              {enabled
                ? isRecording
                  ? 'Waiting for speech...'
                  : 'Start recording to see transcription'
                : 'Enable transcription to see live text'}
            </p>
          </div>
        ) : (
          <>
            {mergedItems.map((item) =>
              item.type === 'transcript' ? (
                <TranscriptMessage key={(item.data as TranscriptItem).id} item={item.data as TranscriptItem} />
              ) : (
                <VisualAnalysisEntry key={(item.data as VisualIndexItem).id} item={item.data as VisualIndexItem} />
              )
            )}

            {/* Pending transcripts */}
            {pendingMic && <PendingMessage text={pendingMic} source="mic" />}
            {pendingSystemAudio && <PendingMessage text={pendingSystemAudio} source="system_audio" />}
          </>
        )}
      </div>
    </div>
  );
}

export default TranscriptionPanel;
