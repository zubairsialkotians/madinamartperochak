// Brand colour comes from .env (EXPO_PUBLIC_PRIMARY_COLOR) so each shop's copy of the app has its own look
const primary = /^#[0-9a-fA-F]{6}$/.test(process.env.EXPO_PUBLIC_PRIMARY_COLOR || '')
  ? process.env.EXPO_PUBLIC_PRIMARY_COLOR
  : '#0f7a3d';

// Mix the brand colour with white (amount 0–1) for soft backgrounds
function tint(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  const r = mix(n >> 16), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(c * (1 - amount));
  const r = mix(n >> 16), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export const colors = {
  // Fills, text on fills, icons on the black steppers (shared code from MasterPOS)
  brand: primary,
  onBrand: '#ffffff',
  onBlack: '#ffffff',
  shadow: '#0b1020',
  primary,
  primaryDark: shade(primary, 0.35),
  primarySoft: tint(primary, 0.88),
  black: '#0b1020',
  surface: '#ffffff',
  background: '#f4f6f8',
  border: '#e3e8ee',
  text: '#111827',
  muted: '#64748b',
  faint: '#94a3b8',
  success: '#15803d',
  successSoft: '#e7f6ec',
  danger: '#c0392b',
  dangerSoft: '#fbe9e7',
  warning: '#b45309',
  warningSoft: '#fdf1e2',
  sale: '#e11d48',
};

export const statusColors = {
  pending:          { fg: '#b45309', bg: '#fdf1e2' },
  confirmed:        { fg: '#1d4ed8', bg: '#e8eefc' },
  ready_for_delivery: { fg: '#0f766e', bg: '#e0f4f1' },
  out_for_delivery: { fg: '#7c3aed', bg: '#f1eafe' },
  ready:            { fg: '#7c3aed', bg: '#f1eafe' },
  delivered:        { fg: '#15803d', bg: '#e7f6ec' },
  completed:        { fg: '#ffffff', bg: '#15803d' },
  cancelled:        { fg: '#c0392b', bg: '#fbe9e7' },
  active:           { fg: '#15803d', bg: '#e7f6ec' },
  inactive:         { fg: '#64748b', bg: '#eef1f5' },
};
