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
    riskLow: string;
    riskLowSurface: string;
    riskModerate: string;
    riskModerateSurface: string;
    riskHigh: string;
    riskHighSurface: string;
    riskDanger: string;
    riskDangerSurface: string;
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
    riskLow: '#238636',
    riskLowSurface: '#EAF7ED',
    riskModerate: '#9A6B00',
    riskModerateSurface: '#FFF6D8',
    riskHigh: '#C45A00',
    riskHighSurface: '#FFF0E3',
    riskDanger: '#B42318',
    riskDangerSurface: '#FDECEC',
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
    riskLow: '#67C47A',
    riskLowSurface: '#193321',
    riskModerate: '#F0C95C',
    riskModerateSurface: '#352E17',
    riskHigh: '#F39A52',
    riskHighSurface: '#3A2618',
    riskDanger: '#F08078',
    riskDangerSurface: '#3A1D1B',
  },
  radius,
};
