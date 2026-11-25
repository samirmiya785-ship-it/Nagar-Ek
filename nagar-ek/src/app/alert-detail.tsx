import { useTheme } from '@/stores/themeStore';
import { AuthStoreInterface, useAuthStore } from '@/stores/authStore';
import { useLoaderStore } from '@/stores/loaderStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AlertDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { token } = useAuthStore() as AuthStoreInterface;
  const { showLoader, hideLoader } = useLoaderStore();

  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        setLoading(true);
        showLoader();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/alerts/${id}`, { headers });
        if (!res.ok) throw new Error('Failed to load alert');
        const data = await res.json();
        setAlert(data);
      } catch (e: any) {
        setError(e.message || 'Could not load alert');
      } finally {
        setLoading(false);
        hideLoader();
      }
    };
    if (id) fetchAlert();
  }, [id]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) +
        '  •  ' +
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
      fire: '#E0533C',
      flood: '#2196F3',
      accident: '#FF9800',
      crime: '#9C27B0',
      health: '#4CAF50',
      infrastructure: '#607D8B',
    };
    return map[(category || '').toLowerCase()] ?? '#E0533C';
  };

  const apiBase = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? '';

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: t.bg }]}>
        <View style={{ height: Platform.OS === 'ios' ? 50 : 36 }} />
        <View style={styles.headerRow}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: t.card }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={t.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.text }]}>Alert Details</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.primary} />
          <Text style={[styles.loadingText, { color: t.textMuted }]}>Loading alert...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="warning-outline" size={48} color={t.textMuted} />
          <Text style={[styles.errorText, { color: t.textMuted }]}>{error}</Text>
        </View>
      ) : alert ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Image */}
          {alert.imageUrl ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: `${apiBase}${alert.imageUrl}` }}
                style={styles.alertImage}
                resizeMode="cover"
              />
              <View style={[styles.categoryPillOnImage, { backgroundColor: getCategoryColor(alert.category) }]}>
                <Text style={styles.categoryPillText}>{alert.category}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.noImageBanner, { backgroundColor: t.isDark ? '#2a1a1a' : '#fff1ec' }]}>
              <Ionicons name="warning" size={48} color={getCategoryColor(alert.category)} />
              <View style={[styles.categoryPillNoImg, { backgroundColor: getCategoryColor(alert.category) }]}>
                <Text style={styles.categoryPillText}>{alert.category}</Text>
              </View>
            </View>
          )}

          {/* Content card */}
          <View style={[styles.contentCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>

            {/* Title + status */}
            <View style={styles.titleRow}>
              <Text style={[styles.alertTitle, { color: t.text }]} numberOfLines={3}>
                {alert.title}
              </Text>
              <View style={[styles.statusBadge, {
                backgroundColor: alert.status === 'resolved'
                  ? (t.isDark ? '#1a3a1a' : '#e8f5e9')
                  : (t.isDark ? '#3a1a1a' : '#fff1ec'),
              }]}>
                <Text style={[styles.statusText, {
                  color: alert.status === 'resolved' ? '#4CAF50' : '#E0533C'
                }]}>
                  {alert.status === 'resolved' ? '✓ Resolved' : '⚠ Active'}
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text style={[styles.sectionLabel, { color: t.textMuted }]}>Description</Text>
            <Text style={[styles.description, { color: t.textSecondary }]}>{alert.description}</Text>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: t.isDark ? '#333' : '#eee' }]} />

            {/* Meta info */}
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={t.textMuted} />
                <View>
                  <Text style={[styles.metaLabel, { color: t.textMuted }]}>Reported at</Text>
                  <Text style={[styles.metaValue, { color: t.text }]}>{formatDate(alert.createdAt)}</Text>
                </View>
              </View>

              {alert.reporter?.name && (
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={16} color={t.textMuted} />
                  <View>
                    <Text style={[styles.metaLabel, { color: t.textMuted }]}>Reported by</Text>
                    <Text style={[styles.metaValue, { color: t.text }]}>{alert.reporter.name}</Text>
                  </View>
                </View>
              )}

              {alert.rewardPoints != null && (
                <View style={styles.metaItem}>
                  <Ionicons name="star-outline" size={16} color="#FFD700" />
                  <View>
                    <Text style={[styles.metaLabel, { color: t.textMuted }]}>Reward Points</Text>
                    <Text style={[styles.metaValue, { color: '#FFD700' }]}>+{alert.rewardPoints} pts</Text>
                  </View>
                </View>
              )}

              {alert.location?.coordinates && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={16} color={t.textMuted} />
                  <View>
                    <Text style={[styles.metaLabel, { color: t.textMuted }]}>Coordinates</Text>
                    <Text style={[styles.metaValue, { color: t.text }]}>
                      {alert.location.coordinates[1].toFixed(5)}, {alert.location.coordinates[0].toFixed(5)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  alertImage: {
    width: '100%',
    height: '100%',
  },
  noImageBanner: {
    width: '100%',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  categoryPillOnImage: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryPillNoImg: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  contentCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  alertTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: -6,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  metaGrid: {
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
});
