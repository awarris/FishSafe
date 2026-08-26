export type AppTheme = {
  mode: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    surfaceSoft: string;
    primary: string;
    primarySoft: string;
    text: string;
    textMuted: string;
    border: string;
    white: string;
    danger: string;
    warningSurface: string;
    warningBorder: string;
    warningText: string;
    neutralSurface: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    pill: number;
  };
};

const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: {
    background: '#F7FAF9',
    surface: '#FFFFFF',
    surfaceSoft: '#EEF5F2',
    primary: '#174A3D',
    primarySoft: '#DDEBE6',
    text: '#17211E',
    textMuted: '#697773',
    border: '#DCE5E1',
    white: '#FFFFFF',
    danger: '#A54343',
    warningSurface: '#FFF8E8',
    warningBorder: '#E8D7AA',
    warningText: '#76520D',
    neutralSurface: '#F2F3F5',
  },
  radius,
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    background: '#0F1513',
    surface: '#18201D',
    surfaceSoft: '#1D2A25',
    primary: '#72B69F',
    primarySoft: '#203A31',
    text: '#F1F5F3',
    textMuted: '#A6B4AF',
    border: '#2E3B36',
    white: '#FFFFFF',
    danger: '#E88E8E',
    warningSurface: '#332A17',
    warningBorder: '#5B4922',
    warningText: '#E9C873',
    neutralSurface: '#202725',
  },
  radius,
};
