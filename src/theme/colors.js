export const colors = {
  background: '#F4F6F9',       // var(--bg)
  backgroundSecondary: '#EBEEF3', // var(--bg2)
  surface: '#FFFFFF',          // var(--surface)
  cardBg: '#FFFFFF',           // var(--surface)
  cardBgSecondary: '#EBEEF3',  // var(--bg2)
  border: '#E2E6EC',           // var(--border)
  borderStrong: '#CBD2DC',     // var(--border-strong)

  // Brand / Theme
  brand: '#C19A4B',            // var(--brand)
  brandLight: '#F7F0DF',       // var(--brand-light)
  brandDark: '#A07C30',        // var(--brand-dark)
  brandMid: '#D8B968',         // var(--brand-mid)

  // Deep Navy Frame
  navy: '#16243B',             // var(--navy)
  navyDeep: '#0F1A2B',         // var(--navy-deep)
  navySoft: '#233754',         // var(--navy-soft)
  onNavy: '#E8EDF4',           // var(--on-navy)
  onNavyMuted: '#9DAABD',      // var(--on-navy-muted)

  // Standard/Generic mappings
  primary: '#C19A4B',
  secondary: '#16243B',
  accent: '#C19A4B',

  // Typography
  text: '#16243B',             // var(--text)
  textSecondary: '#5A6B82',    // var(--text2)
  textMuted: '#94A2B6',        // var(--text3)
  textInv: '#FFFFFF',          // var(--text-inv)

  // Semantic colors
  success: '#10B981',          // var(--success)
  successBg: '#D1FAE5',        // var(--success-bg)
  successText: '#065F46',      // var(--success-text)

  warning: '#F59E0B',          // var(--warning)
  warningBg: '#FEF3C7',        // var(--warning-bg)
  warningText: '#92400E',      // var(--warning-text)

  danger: '#EF4444',           // var(--danger)
  dangerBg: '#FEE2E2',         // var(--danger-bg)
  dangerText: '#991B1B',       // var(--danger-text)

  info: '#3B82F6',             // var(--info)
  infoBg: '#DBEAFE',           // var(--info-bg)
  infoText: '#1E40AF',         // var(--info-text)

  purpleBg: '#EDE9FE',         // var(--purple-bg)
  purpleText: '#5B21B6',       // var(--purple-text)
};

export const typography = {
  fontFamily: Platform => Platform.OS === 'ios' ? 'System' : 'sans-serif',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extraBold: '800',
  }
};
