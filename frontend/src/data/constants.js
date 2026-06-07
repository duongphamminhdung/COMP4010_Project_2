// Shared constants used across components and data loaders

export const PERIOD_ORDER = ['pre-ai', 'early-post-ai', 'nnue-era', 'modern'];

export const PERIOD_LABELS = {
  'pre-ai': 'Pre-AI\n(2015-16)',
  'early-post-ai': 'Early Post-AI\n(2018-19)',
  'nnue-era': 'NNUE Era\n(2021-22)',
  'modern': 'Modern\n(2024)',
};

export const PERIOD_COLORS = {
  'pre-ai': '#60a5fa',
  'early-post-ai': '#c084fc',
  'nnue-era': '#fbbf24',
  'modern': '#34d399',
};

// For components that use label-based keys instead of period keys
export const PERIOD_COLORS_BY_LABEL = {
  'Pre-AI': '#60a5fa',
  'Early Post-AI': '#c084fc',
  'NNUE Era': '#fbbf24',
  'Modern': '#34d399',
};

export const ELO_BRACKETS = ['0-1000', '1000-1400', '1400-1800', '1800-2200', '2200-2600', '2600+'];
