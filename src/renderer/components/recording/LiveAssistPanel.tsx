/**
 * Live Assist Panel Component
 *
 * Shows real-time AI-generated assists during recording:
 * - Say this (things to say)
 * - Ask this (questions to ask)
 * - MCP Findings section
 * - Visual Analysis control button
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';
import { useLiveAssist } from '../../hooks/useLiveAssist';
import { useMCP } from '../../hooks/useMCP';
import { useVisualIndexStore } from '../../stores/visual-index.store';
import { useSessionStore } from '../../stores/session.store';
import { trpc } from '../../api/trpc';

// Lightbulb icon for Live Assist header
function LightbulbIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 2.5C6.54822 2.5 3.75 5.29822 3.75 8.75C3.75 10.9196 4.86607 12.8304 6.5625 13.9062V15.625C6.5625 16.3154 7.12214 16.875 7.8125 16.875H12.1875C12.8779 16.875 13.4375 16.3154 13.4375 15.625V13.9062C15.1339 12.8304 16.25 10.9196 16.25 8.75C16.25 5.29822 13.4518 2.5 10 2.5Z"
        stroke="#EC5B16"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.5 17.5H12.5" stroke="#EC5B16" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Speech bubble icon for "Say this"
function SayThisIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.5 9.58333C17.5029 10.6832 17.2459 11.7682 16.75 12.75C16.162 13.9265 15.2581 14.916 14.1395 15.6077C13.021 16.2995 11.7319 16.6661 10.4167 16.6667C9.31678 16.6695 8.23176 16.4126 7.25 15.9167L2.5 17.5L4.08333 12.75C3.58744 11.7682 3.33047 10.6832 3.33333 9.58333C3.33393 8.26813 3.70051 6.97905 4.39227 5.86045C5.08402 4.74186 6.07355 3.83797 7.25 3.25C8.23176 2.75411 9.31678 2.49713 10.4167 2.5H10.8333C12.5703 2.59583 14.2109 3.32899 15.4409 4.55905C16.671 5.7891 17.4042 7.42973 17.5 9.16667V9.58333Z"
        stroke="#EC5B16"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Question mark icon for "Ask this"
function AskThisIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="7.5" stroke="#3B82F6" strokeWidth="1.5" />
      <path
        d="M7.5 7.5C7.5 6.11929 8.61929 5 10 5C11.3807 5 12.5 6.11929 12.5 7.5C12.5 8.88071 11.3807 10 10 10V11.25"
        stroke="#3B82F6"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="14" r="0.75" fill="#3B82F6" />
    </svg>
  );
}

// Display icon for Visual Analysis button
function DisplayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.125 3.125H16.875V13.125H3.125V3.125Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 13.125V16.875"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.25 16.875H13.75"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Checkmark icon
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.6667 3.5L5.25 9.91667L2.33333 7"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface InsightItemProps {
  text: string;
  checked: boolean;
  onToggle: () => void;
  variant: 'say' | 'ask';
}

function InsightItem({ text, checked, onToggle, variant }: InsightItemProps) {
  const isSay = variant === 'say';
  const bgColor = isSay ? 'bg-[#fff5ec]' : 'bg-[#d8e6fd]';
  const borderColor = isSay ? 'border-[rgba(236,91,22,0.2)]' : 'border-[rgba(59,130,246,0.2)]';
  const checkboxBg = checked
    ? isSay
      ? 'bg-[#ec5b16] border-[#ec5b16]'
      : 'bg-[#3b82f6] border-[#3b82f6]'
    : 'bg-white border-[#969696]';

  return (
    <div
      className={`${bgColor} border ${borderColor} rounded-[10px] px-[13px] py-[9px] flex gap-[12px] items-start cursor-pointer hover:opacity-90 transition-opacity`}
      onClick={onToggle}
    >
      <div
        className={`w-[16px] h-[16px] rounded-[4px] flex items-center justify-center shrink-0 border ${checkboxBg} mt-[3px]`}
      >
        {checked && <CheckIcon />}
      </div>
      <p className="flex-1 text-[14px] text-black leading-[22px]">{text}</p>
    </div>
  );
}

interface InsightSectionProps {
  title: string;
  icon: React.ReactNode;
  items: string[];
  checkedItems: Set<number>;
  onToggleItem: (index: number) => void;
  variant: 'say' | 'ask';
  emptyText: string;
  scrollRef: React.RefObject<HTMLDivElement>;
}

function InsightSection({
  title,
  icon,
  items,
  checkedItems,
  onToggleItem,
  variant,
  emptyText,
  scrollRef,
}: InsightSectionProps) {
  return (
    <div className="border border-[#efefef] rounded-[12px] overflow-hidden">
      {/* Header */}
      <div className="bg-[#f7f7f7] border-b border-[#efefef] px-[16px] py-[10px] flex items-center gap-[8px]">
        {icon}
        <span className="font-medium text-[15px] text-black">{title}</span>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="bg-white p-[16px] max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {items.length > 0 ? (
          <div className="flex flex-col gap-[10px]">
            {items.map((item, idx) => (
              <InsightItem
                key={`${variant}-${idx}`}
                text={item}
                checked={checkedItems.has(idx)}
                onToggle={() => onToggleItem(idx)}
                variant={variant}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-[20px]">
            <p className="text-[13px] text-[#969696] text-center">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function LiveAssistPanel() {
  const { sayThis, askThis } = useLiveAssist();
  const { activeResults, connectedServerCount } = useMCP();
  const visualIndexStore = useVisualIndexStore();
  const { sessionId, screenWsConnectionId, status } = useSessionStore();

  const isRecording = status === 'recording';
  const { isRunning, sceneIndexId } = visualIndexStore;

  // Local checkbox state
  const [checkedSayThis, setCheckedSayThis] = useState<Set<number>>(new Set());
  const [checkedAskThis, setCheckedAskThis] = useState<Set<number>>(new Set());

  // Refs for auto-scrolling
  const sayThisScrollRef = useRef<HTMLDivElement>(null);
  const askThisScrollRef = useRef<HTMLDivElement>(null);
  const prevSayThisLengthRef = useRef(0);
  const prevAskThisLengthRef = useRef(0);

  // tRPC mutations for visual index control
  const startVisualIndexMutation = trpc.visualIndex.start.useMutation();
  const pauseVisualIndexMutation = trpc.visualIndex.pause.useMutation();
  const resumeVisualIndexMutation = trpc.visualIndex.resume.useMutation();

  // Get the latest MCP result for display
  const latestMCPResult = activeResults.length > 0 ? activeResults[activeResults.length - 1] : null;
  const mcpFindings = latestMCPResult?.content?.text || latestMCPResult?.content?.markdown || '';

  // Toggle handlers
  const handleToggleSayThis = useCallback((index: number) => {
    setCheckedSayThis((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const handleToggleAskThis = useCallback((index: number) => {
    setCheckedAskThis((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Auto-scroll when new items are added
  useEffect(() => {
    if (sayThis.length > prevSayThisLengthRef.current && sayThisScrollRef.current) {
      sayThisScrollRef.current.scrollTop = sayThisScrollRef.current.scrollHeight;
    }
    prevSayThisLengthRef.current = sayThis.length;
  }, [sayThis.length]);

  useEffect(() => {
    if (askThis.length > prevAskThisLengthRef.current && askThisScrollRef.current) {
      askThisScrollRef.current.scrollTop = askThisScrollRef.current.scrollHeight;
    }
    prevAskThisLengthRef.current = askThis.length;
  }, [askThis.length]);

  // Visual Analysis button handler
  const handleVisualAnalysisClick = useCallback(async () => {
    if (!isRecording || !sessionId || !screenWsConnectionId) {
      return;
    }

    if (isRunning) {
      // Stop (pause) visual analysis
      try {
        const result = await pauseVisualIndexMutation.mutateAsync({ sessionId });
        if (result.success) {
          visualIndexStore.setRunning(false);
        }
      } catch (error) {
        console.error('[VisualIndex] Failed to pause:', error);
      }
    } else if (sceneIndexId) {
      // Restart (resume) visual analysis
      try {
        const result = await resumeVisualIndexMutation.mutateAsync({ sessionId });
        if (result.success) {
          visualIndexStore.setRunning(true);
        }
      } catch (error) {
        console.error('[VisualIndex] Failed to resume:', error);
      }
    } else {
      // Turn on (start) visual analysis
      try {
        const result = await startVisualIndexMutation.mutateAsync({
          sessionId,
          screenWsConnectionId,
        });
        if (result.success && result.sceneIndexId) {
          visualIndexStore.setSceneIndexId(result.sceneIndexId);
          visualIndexStore.setRunning(true);
        }
      } catch (error) {
        console.error('[VisualIndex] Failed to start:', error);
      }
    }
  }, [
    isRecording,
    sessionId,
    screenWsConnectionId,
    isRunning,
    sceneIndexId,
    visualIndexStore,
    startVisualIndexMutation,
    pauseVisualIndexMutation,
    resumeVisualIndexMutation,
  ]);

  // Loading state for visual analysis button
  const isVisualAnalysisLoading =
    startVisualIndexMutation.isPending ||
    pauseVisualIndexMutation.isPending ||
    resumeVisualIndexMutation.isPending;

  // Determine button text
  const getVisualAnalysisButtonText = () => {
    if (isVisualAnalysisLoading) return 'Loading...';
    if (isRunning) return 'Stop Visual Analysis';
    if (sceneIndexId) return 'Restart Visual Analysis';
    return 'Turn On Visual Analysis';
  };

  const showVisualAnalysisButton = isRecording && screenWsConnectionId;

  return (
    <div className="flex flex-col h-full gap-[20px] pt-[8px]">
      {/* Header */}
      <div className="flex items-center gap-[8px] shrink-0">
        <LightbulbIcon />
        <h2 className="flex-1 font-semibold text-[18px] text-black tracking-[0.09px]">
          Live Assist
        </h2>
        {showVisualAnalysisButton && (
          <button
            onClick={handleVisualAnalysisClick}
            disabled={isVisualAnalysisLoading}
            className={`flex items-center gap-[4px] px-[20px] py-[12px] rounded-[12px] shadow-[0px_1.272px_15.267px_0px_rgba(0,0,0,0.05)] transition-colors ${
              isVisualAnalysisLoading
                ? 'bg-[#ff4000]/70 cursor-not-allowed'
                : 'bg-[#ff4000] hover:bg-[#e63900]'
            }`}
          >
            {isVisualAnalysisLoading ? (
              <Loader2 className="w-[20px] h-[20px] text-white animate-spin" />
            ) : (
              <DisplayIcon />
            )}
            <span className="font-semibold text-[14px] text-white tracking-[-0.28px]">
              {getVisualAnalysisButtonText()}
            </span>
          </button>
        )}
      </div>

      {/* Panels */}
      <div className="flex-1 flex flex-col gap-[20px] min-h-0 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Say this section */}
        <InsightSection
          title="Say this"
          icon={<SayThisIcon />}
          items={sayThis}
          checkedItems={checkedSayThis}
          onToggleItem={handleToggleSayThis}
          variant="say"
          emptyText="No suggestions yet - keep the conversation going"
          scrollRef={sayThisScrollRef}
        />

        {/* Ask this section */}
        <InsightSection
          title="Ask this"
          icon={<AskThisIcon />}
          items={askThis}
          checkedItems={checkedAskThis}
          onToggleItem={handleToggleAskThis}
          variant="ask"
          emptyText="No questions yet - we'll suggest when relevant"
          scrollRef={askThisScrollRef}
        />

        {/* MCP Findings Section - only show if MCP servers are connected */}
        {connectedServerCount > 0 && (
          <div className="border border-[#efefef] rounded-[12px] overflow-hidden flex-1 min-h-[100px]">
            {/* MCP Findings Header */}
            <div className="bg-[#f7f7f7] border-b border-[#efefef] px-[16px] py-[10px]">
              <span className="font-medium text-[14px] text-black tracking-[0.07px]">
                MCP Findings
              </span>
            </div>

            {/* MCP Findings Content */}
            <div className="bg-white p-[16px]">
              {mcpFindings ? (
                <div className="prose prose-sm max-w-none text-[14px] text-black leading-[22px]">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          className="text-[#ec5b16] underline decoration-solid"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                      ul: ({ children }) => <ul className="list-disc ml-5 mb-2">{children}</ul>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                    }}
                  >
                    {mcpFindings}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center justify-center py-[14px]">
                  <p className="text-[13px] text-[#969696] text-center">
                    See live results triggered by conversation keywords
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveAssistPanel;
