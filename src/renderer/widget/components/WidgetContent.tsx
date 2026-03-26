import React from 'react';
import { VisualAnalysisCard } from './VisualAnalysisCard';
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
  visualDescription: string;
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
  visualDescription,
  nudge,
  onDismissCard,
  onDismissNudge,
}: WidgetContentProps) {
  const hasCards = sayThis.length > 0 || askThis.length > 0;
  const isEmpty = !hasCards && !visualDescription;

  const interleavedCards = getInterleavedCards(sayThis, askThis);

  return (
    <div
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
          {/* Visual Analysis - sticky at top */}
          {visualDescription && (
            <VisualAnalysisCard description={visualDescription} />
          )}

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
