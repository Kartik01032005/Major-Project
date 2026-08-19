export const themeColors = {
  light: {
    accent: "#DC2626",
    accentDark: "#B91C1C",
    background: "#FFFFFF",
    border: "#E2E8F0",
    ink: "#0F172A",
    muted: "#64748B",
    surface: "#FFFFFF",
    surfaceMuted: "#F8FAFC",
    success: "#15803D",
    warning: "#B45309",
  },
  dark: {
    accent: "#EF4444",
    accentDark: "#F87171",
    background: "#060910",
    border: "#1E293B",
    ink: "#F8FAFC",
    muted: "#94A3B8",
    surface: "#0D1117",
    surfaceMuted: "#111827",
    success: "#4ADE80",
    warning: "#FBBF24",
  },
} as const;

export type ThemeColors = (typeof themeColors)[keyof typeof themeColors];
