/**
 * Theme store – single source of truth for app-wide dark/light theming.
 * Colour scheme is read from the device and exposed to all screens via useTheme().
 */
import { useColorScheme } from 'react-native';

// ─── Palette ─────────────────────────────────────────────────────────────────
const light = {
  isDark: false,
  // Backgrounds
  bg: '#F8FAF7',
  bgSecondary: '#F0F5EE',
  card: '#ffffff',
  cardBorder: 'transparent',
  cardBorderWidth: 0,
  // Text
  text: '#1a1a1a',
  textSecondary: '#555555',
  textMuted: '#888888',
  // Brand
  primary: '#054823',
  primaryLight: '#0D6E37',
  primaryBg: '#E8F5E9',
  primaryBgLight: '#F0F5EE',
  // UI Elements
  topBar: '#f3f3f3',
  topBarText: '#054823',
  backBtn: '#054823',
  iconBg: '#F0F5EE',
  iconColor: '#0D6E37',
  divider: '#EAEAEA',
  border: '#E0E0E0',
  // Status bar
  statusBar: 'dark-content' as const,
  // Input
  inputBorder: '#0c570063',
  inputBg: '#ffffff',
  inputText: '#1a1a1a',
  placeholder: '#909090b5',
  // Tab bar
  tabBar: '#ffffff',
  tabBarBorder: '#EAEAEA',
  tabActive: '#054823',
  tabInactive: '#999999',
  // Notification/alert
  notifBg: '#FAFAF9',
  unreadCard: '#F0F5EE40',
  unreadBorder: '#05482330',
  alertIconBg: '#FDF2F0',
  notifIconBg: '#F0F5EE',
  // Empty/disabled
  emptyIcon: '#cccccc',
  emptyBg: '#f2f2f7',
  // Filter tabs
  filterTabBg: '#EAEFE9',
  filterTabText: '#555555',
  markAllBg: '#F0F5EE',
  // Gradient card
  gradientStart: '#054823',
  gradientEnd: '#0D6E37',
  // Logout button
  logoutBg: '#ffffff',
  logoutBorder: '#0D6E37',
  logoutText: '#0D6E37',
  // Gov services
  govSafeArea: '#F8F9FA',
  govTopBar: '#ffffff',
  govTopBarBorder: '#ECEFF1',
  govCard: '#ffffff',
  govCardBorder: '#E0E0E0',
  govCardFooterBorder: '#F0F0F0',
  govIconBg: '#E8F5E9',
  govSearchBorder: '#0E4D2C',
  govSearchBg: '#ffffff',
  govSearchText: '#333',
  govDetailText: '#444',
  govDescText: '#666',
  // Shadow
  shadow: '#000000',
};

const dark: typeof light = {
  isDark: true,
  // Backgrounds
  bg: '#0f1a14',
  bgSecondary: '#1a2b20',
  card: '#1a2b20',
  cardBorder: '#2a3d30',
  cardBorderWidth: 1,
  // Text
  text: '#e8f5e9',
  textSecondary: '#a5c8ae',
  textMuted: '#6b9070',
  // Brand
  primary: '#0d3320',
  primaryLight: '#81c784',
  primaryBg: '#1e3525',
  primaryBgLight: '#1e3525',
  // UI Elements
  topBar: '#111f17',
  topBarText: '#81c784',
  backBtn: '#1a3826',
  iconBg: '#1e3525',
  iconColor: '#81c784',
  divider: '#2a3d30',
  border: '#2a3d30',
  // Status bar
  statusBar: 'light-content' as const,
  // Input
  inputBorder: '#2a5c3a',
  inputBg: '#162a1e',
  inputText: '#e8f5e9',
  placeholder: '#5a7a62',
  // Tab bar
  tabBar: '#111f17',
  tabBarBorder: '#2a3d30',
  tabActive: '#81c784',
  tabInactive: '#4a6650',
  // Notification/alert
  notifBg: '#0f1a14',
  unreadCard: '#1e3525',
  unreadBorder: '#2e5c38',
  alertIconBg: '#2a1a18',
  notifIconBg: '#1e3525',
  // Empty/disabled
  emptyIcon: '#3a5240',
  emptyBg: '#1a2b20',
  // Filter tabs
  filterTabBg: '#1a2b20',
  filterTabText: '#a5c8ae',
  markAllBg: '#1e3525',
  // Gradient card
  gradientStart: '#0d2b18',
  gradientEnd: '#1a4728',
  // Logout button
  logoutBg: '#0f1a14',
  logoutBorder: '#81c784',
  logoutText: '#81c784',
  // Gov services
  govSafeArea: '#0f1a14',
  govTopBar: '#111f17',
  govTopBarBorder: '#2a3d30',
  govCard: '#1a2b20',
  govCardBorder: '#2a3d30',
  govCardFooterBorder: '#2a3d30',
  govIconBg: '#1e3525',
  govSearchBorder: '#2a5c3a',
  govSearchBg: '#162a1e',
  govSearchText: '#e8f5e9',
  govDetailText: '#a5c8ae',
  govDescText: '#7a9a82',
  // Shadow
  shadow: '#000000',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

export type AppTheme = typeof light;
