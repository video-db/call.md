/**
 * Metrics Bar Component
 *
 * Shows recording metrics:
 * - Talk ratio (You vs Them with progress bar)
 */

import React from 'react';
import { useCopilotStore } from '../../stores/copilot.store';

export function MetricsBar() {
  const { metrics } = useCopilotStore();

  const mePercent = metrics ? Math.round(metrics.talkRatio.me * 100) : 50;
  const themPercent = metrics ? Math.round(metrics.talkRatio.them * 100) : 50;

  return (
    <div className="flex items-center h-[35px]">
      {/* Talk Ratio Pill */}
      <div className="bg-white border border-[#efefef] rounded-[40px] h-full px-[16px] py-[4px] flex items-center flex-1">
        <div className="flex items-center gap-[12px] w-full">
          <span className="text-[14px] text-[#464646] tracking-[0.07px] whitespace-nowrap">
            You: {mePercent}%
          </span>
          {/* Progress bar */}
          <div className="flex-1 h-[7px] bg-[#f0f0f5] rounded-[4px] overflow-hidden relative">
            {/* Me portion (orange) */}
            <div
              className="absolute top-0 left-0 h-full bg-[#ec5b16] rounded-l-[4px]"
              style={{ width: `${mePercent}%` }}
            />
            {/* Them portion (blue) */}
            <div
              className="absolute top-0 right-0 h-full bg-[#3b82f6] rounded-r-[4px]"
              style={{ width: `${themPercent}%` }}
            />
          </div>
          <span className="text-[14px] text-[#464646] tracking-[0.07px] whitespace-nowrap">
            Them: {themPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default MetricsBar;
