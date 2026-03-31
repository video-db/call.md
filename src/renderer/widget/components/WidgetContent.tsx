import React, { useEffect, useRef } from 'react';
import { SayThisCard } from './SayThisCard';
import { AskThisCard } from './AskThisCard';
import { EmptyState } from './EmptyState';
import { NudgeAlert } from './NudgeAlert';

interface InsightCard {
  id: string;
  text: string;
  timestamp: number;
}

interface Nudge {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'action';
  timestamp: number;
}

interface WidgetContentProps {
  sayThis: InsightCard[];
  askThis: InsightCard[];
  nudge?: Nudge | null;
  onDismissCard: (type: 'sayThis' | 'askThis', id: string) => void;
  onDismissNudge?: () => void;
}

// Combine and sort cards by timestamp, interleaving Say This and Ask This
function getInterleavedCards(
  sayThis: InsightCard[],
  askThis: InsightCard[]
): Array<{ type: 'sayThis' | 'askThis'; card: InsightCard }> {
  const allCards: Array<{ type: 'sayThis' | 'askThis'; card: InsightCard }> = [
    ...sayThis.map((card) => ({ type: 'sayThis' as const, card })),
    ...askThis.map((card) => ({ type: 'askThis' as const, card })),
  ];

  // Sort by timestamp, newest first
  allCards.sort((a, b) => b.card.timestamp - a.card.timestamp);

  return allCards;
}

export function WidgetContent({
  sayThis,
  askThis,
  nudge,
  onDismissCard,
  onDismissNudge,
}: WidgetContentProps) {
  const hasCards = sayThis.length > 0 || askThis.length > 0;
  const isEmpty = !hasCards;

  const interleavedCards = getInterleavedCards(sayThis, askThis);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTimeRef = useRef<number>(0);

  const handleScroll = () => {
    lastScrollTimeRef.current = Date.now();
  };

  // Auto-scroll to top when new cards arrive (if user hasn't scrolled recently)
  useEffect(() => {
    const timeSinceLastScroll = Date.now() - lastScrollTimeRef.current;
    if (timeSinceLastScroll > 2000 && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [sayThis, askThis]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 min-h-0 flex flex-col overflow-y-auto"
      style={{
        padding: '20px 16px',
        gap: '16px',
        background: 'rgba(247, 247, 247, 0.9)',
        border: '1px solid #EFEFEF',
        borderTop: 'none',
      }}
    >
      {/* Nudge Alert - shown at top when present */}
      {nudge && onDismissNudge && (
        <NudgeAlert message={nudge.message} onDismiss={onDismissNudge} />
      )}

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {/* Interleaved Say This / Ask This cards */}
          {interleavedCards.map(({ type, card }) =>
            type === 'sayThis' ? (
              <SayThisCard
                key={card.id}
                text={card.text}
                onDismiss={() => onDismissCard('sayThis', card.id)}
              />
            ) : (
              <AskThisCard
                key={card.id}
                text={card.text}
                onDismiss={() => onDismissCard('askThis', card.id)}
              />
            )
          )}
        </>
      )}
    </div>
  );
}
