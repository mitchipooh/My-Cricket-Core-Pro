export const CATEGORIES = ['Fitness', 'Batting', 'Bowling', 'Fielding', 'Wicket Keeping'];

export const SUB_CATEGORIES: Record<string, string[]> = {
  'Fitness': ['Push-ups (30s)', 'Sit-ups (30s)', 'Squats (30s)', 'Beep Test', 'Lap Timing', 'Running Between Wickets'],
  'Batting': ['General Assessment', 'Cover Drive', 'Pull Shot', 'Sweep Shot', 'Square Cut', 'Flick Shot', 'Setup', 'Timing', 'Shot Selection', 'Running Between Wickets (1s)', 'Running Between Wickets (2s)'],
  'Bowling': ['General Assessment', 'Inswing', 'Outswing', 'Yorker', 'Bouncer', 'Leg Spin', 'Off Spin', 'Googly', 'Accuracy', 'Pace/Spin'],
  'Fielding': ['High Catch', 'Low Catch', 'Slip Catch', 'Boundary Throw', '30 Yard Throw', '60 Yard Throw', 'Reaction Time', 'Ground Fielding'],
  'Wicket Keeping': ['Glove Work', 'Footwork', 'Anticipation', 'Stumping Speed']
};

export const COUNTABLE_METRICS = [
  'Push-ups (30s)', 'Sit-ups (30s)', 'Squats (30s)', 'Beep Test'
];

export const PURE_TIMING_METRICS = [
  'Lap Timing', 'Running Between Wickets', 'Running Between Wickets (1s)', 'Running Between Wickets (2s)'
];

export const TIMED_SKILL_METRICS = [
  'Boundary Throw', '30 Yard Throw', '60 Yard Throw'
];

export const METRIC_BENCHMARKS: Record<string, number> = {
  'Push-ups (30s)': 50,
  'Sit-ups (30s)': 50,
  'Squats (30s)': 60,
  'Beep Test': 15,
  'Lap Timing': 10,
  'Running Between Wickets': 10,
  'Running Between Wickets (1s)': 3.5,
  'Running Between Wickets (2s)': 7.5,
  '30 Yard Throw': 2.5,
  '60 Yard Throw': 4.5
};

export function normalizeScore(subCategory: string, score: number, customBenchmark?: number): number {
  if (customBenchmark || METRIC_BENCHMARKS[subCategory]) {
    const benchmark = customBenchmark || METRIC_BENCHMARKS[subCategory];
    if (PURE_TIMING_METRICS.includes(subCategory)) {
      if (score === 0) return 0;
      return Math.min(10, Math.max(1, (benchmark / score) * 10));
    }
    if (COUNTABLE_METRICS.includes(subCategory)) {
      return Math.min(10, Math.max(1, (score / benchmark) * 10));
    }
  }
  return Math.min(10, Math.max(1, score));
}
