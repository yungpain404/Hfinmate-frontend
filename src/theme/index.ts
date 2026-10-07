export const colors = {
  // Brand Emerald / Forest Green (Primary Theme from design)
  primary: '#1A6A4C',        // Deep forest emerald (Button, active tabs, header icons)
  primaryDark: '#13533B',
  primaryLight: '#288863',
  primaryMuted: '#EAF5EF',   // Hero card soft mint background
  primarySubtle: '#F4FAF6',  // Extra light green tint

  // Accent & Secondary
  secondary: '#0D9488',     // Teal
  secondaryLight: '#14B8A6',
  secondaryMuted: '#F0FDFA',

  // Chart & Metric Colors
  chartBar: '#78BFA0',       // Daily bar normal height
  chartBarPeak: '#1A6A4C',   // Peak day highlight bar
  chartBarEmpty: '#E2EEE7',  // Days without input
  chartGrid: '#E8F1EC',      // Horizontal grid lines

  // Status & Financial Indicators
  income: '#10B981',
  incomeLight: '#D1FAE5',
  expense: '#1A6A4C',        // Expense is focal green in this theme
  expenseLight: '#EAF5EF',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  info: '#06B6D4',
  infoLight: '#CFFAFE',

  // Surfaces & Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAF9',
  card: '#FFFFFF',
  surface: '#F5F7F6',
  surfaceLight: '#FBFDFB',
  border: '#E8EFEA',
  borderLight: '#F0F5F2',
  divider: '#EEF4F0',

  // Typography
  textPrimary: '#17271F',    // Deep slate green-black
  textSecondary: '#6B7E74',  // Neutral grey-green
  textMuted: '#96A79E',      // Light muted text
  textGreen: '#1A6A4C',      // Highlight amount green
  textWhite: '#FFFFFF',

  // Shadows
  shadow: 'rgba(26, 106, 76, 0.08)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 14,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
};

export default theme;
