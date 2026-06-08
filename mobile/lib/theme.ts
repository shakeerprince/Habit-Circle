// Updated theme to use system fonts as fallback
import { Platform } from 'react-native';
import { Easing } from 'react-native-reanimated';

export const colors = {
    bgPrimary: '#0A0A0F',
    bgSecondary: '#12121A',
    bgCard: '#1A1A2E',
    bgCardHover: '#222240',
    bgInput: '#15152A',
    textPrimary: '#F0F0F5',
    textSecondary: '#9090A8',
    textMuted: '#606078',
    accent: '#C8E600',
    accentSoft: 'rgba(200, 230, 0, 0.15)',
    accentGlow: 'rgba(200, 230, 0, 0.4)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderFocus: 'rgba(200, 230, 0, 0.5)',
    danger: '#FF4D6A',
    success: '#4ADE80',
    warning: '#FFD93D',
    info: '#6CB4EE',
    purple: '#CB6CE6',
    orange: '#FF9F43',
    navBg: 'rgba(10, 10, 15, 0.92)',
    white: '#FFFFFF',
    black: '#000000',
    surfaceElevated: '#1E1E36',
} as const;

export const gradients = {
    heroCard: ['rgba(124,92,252,0.12)', 'rgba(108,180,238,0.08)'] as const,
    accentCard: ['rgba(200,230,0,0.03)', 'transparent'] as const,
    xpBar: ['#7c5cfc', '#6CB4EE'] as const,
    chartLine: ['rgba(124,92,252,0.35)', 'rgba(124,92,252,0)'] as const,
} as const;

export const radius = {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
} as const;

export const shadows = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    glow: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
    },
    accentBtn: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
} as const;

// Use system fonts — they look great on both platforms
export const fonts = {
    heading: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    body: Platform.OS === 'ios' ? 'System' : 'sans-serif',
} as const;

export const easings = {
    spring: Easing.bezier(0.34, 1.56, 0.64, 1),
    smooth: Easing.bezier(0.16, 1, 0.3, 1),
    standard: Easing.bezier(0.4, 0, 0.2, 1),
} as const;

export const durations = {
    fast: 150,
    normal: 250,
    slow: 400,
    spring: 500,
} as const;

export const HABIT_COLORS = ['#4ADE80', '#6CB4EE', '#CB6CE6', '#FFD93D', '#FF4D6A', '#FF9F43'];

export const levelColor = (level: number) => {
    if (level >= 8) return '#FFD700';
    if (level >= 5) return '#C0C0C0';
    return '#CD7F32';
};

export const badgeTierEmoji = (tier: string) => {
    switch (tier) {
        case 'diamond': return '💎';
        case 'gold': return '🥇';
        case 'silver': return '🥈';
        default: return '🥉';
    }
};
