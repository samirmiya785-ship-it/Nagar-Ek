import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, useColorScheme } from 'react-native';
import { useLoaderStore } from '../stores/loaderStore';
import { useTheme } from '../stores/themeStore';
import { usePathname } from 'expo-router';

export default function GlobalLoader() {
  const { isLoading, message } = useLoaderStore();
  const t = useTheme();
  const isDark = useColorScheme() === 'dark';
  const pathname = usePathname();

  // Hide loader if we are on the map page, as requested
  if (!isLoading || pathname === '/tabs/map') {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={[styles.loaderContainer, { backgroundColor: t.card, borderColor: isDark ? t.cardBorder : '#e5e5e5' }]}>
        <ActivityIndicator size="large" color={t.primary} />
        {message ? (
          <Text style={[styles.messageText, { color: t.text }]}>{message}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loaderContainer: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  messageText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
});
