/** Today's desk-wide numbers. The quality sheet (brief 13) adds the 14-day series in step 8. */
export const TODAY = {
  autoResolutionRate: 0.68,
  firstResponseMedianSeconds: 100,
  reopenRate: 0.021,
  autoResolvedCount: 142,
  spotCheckSampleCount: 7,
} as const;

/** 0.68 → "68%", 0.021 → "2.1%". */
export const formatPercent = (ratio: number) => `${Number((ratio * 100).toFixed(1))}%`;

/** 100 → "1m 40s". */
export const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
