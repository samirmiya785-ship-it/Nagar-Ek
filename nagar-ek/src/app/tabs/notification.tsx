import { useTheme } from '@/stores/themeStore';
import { AuthStoreInterface, useAuthStore } from '@/stores/authStore';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useLoaderStore } from '@/stores/loaderStore';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  DeviceEventEmitter,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import Octicons from '@expo/vector-icons/Octicons';

interface NotificationItem {
  id: string;
  type: 'alert' | 'notification';
  title: string;
  description: string;
  time: string;
  unread: boolean;
  category?: string;
  alertId?: string;
}

const formatTime = (createdAt: string) => {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const Notifications = () => {
  const t = useTheme();
  const { token } = useAuthStore() as AuthStoreInterface;
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'alerts' | 'notifications'>('all');
  const { showLoader, hideLoader } = useLoaderStore();

  const fetchNotifications = async () => {
    if (!token) return;
    showLoader();
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const formatted: NotificationItem[] = data.map((item: any) => ({
          id: item._id,
          type: item.type,
          title: item.title,
          description: item.description,
          time: formatTime(item.createdAt),
          unread: item.unread,
          category: item.category,
          alertId: item.alertId,
        }));
        setNotifications(formatted);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    fetchNotifications();
    const sub = DeviceEventEmitter.addListener('onNewAlert', () => {
      fetchNotifications();
    });
    return () => sub.remove();
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setNotifications(
          notifications.map((item) => ({ ...item, unread: false }))
        );
        DeviceEventEmitter.emit('onNotificationRead');
      }
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setNotifications(
          notifications.map((item) => (item.id === id ? { ...item, unread: false } : item))
        );
        DeviceEventEmitter.emit('onNotificationRead');
      }
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!token) return;
    // Optimistically remove it from UI
    const previousNotifications = [...notifications];
    setNotifications(notifications.filter((item) => item.id !== id));
    
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        // Revert if failed
        setNotifications(previousNotifications);
        console.warn('Failed to delete notification on server');
      }
    } catch (err) {
      // Revert if failed
      setNotifications(previousNotifications);
      console.warn('Failed to delete notification:', err);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'alerts') return item.type === 'alert';
    if (activeFilter === 'notifications') return item.type === 'notification';
    return true;
  });

  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <View style={[styles.container, { backgroundColor: t.notifBg }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor={t.notifBg} />
      <View style={{ height: Platform.OS === 'ios' ? 55 : 40 }} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: t.text }]}>Alerts &amp; Inbox</Text>
          <Text style={[styles.headerSubtitle, { color: t.textMuted }]}>
            {unreadCount > 0 ? `You have ${unreadCount} unread updates` : 'All caught up!'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={[styles.markAllReadButton, { backgroundColor: t.markAllBg }]}>
            <Text style={[styles.markAllReadText, { color: t.primaryLight }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {(['all', 'alerts', 'notifications'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={[
              styles.tabButton,
              { backgroundColor: t.filterTabBg },
              activeFilter === filter && { backgroundColor: t.primary },
            ]}
          >
            <Text style={[
              styles.tabButtonText,
              { color: t.filterTabText },
              activeFilter === filter && { color: '#ffffff' },
            ]}>
              {filter === 'all' ? 'All' : filter === 'alerts' ? 'Alerts' : 'Notifications'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scrollable List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primaryLight} />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconWrapper, { backgroundColor: t.emptyBg }]}>
              <Feather name="bell-off" size={48} color={t.emptyIcon} />
            </View>
            <Text style={[styles.emptyTitle, { color: t.text }]}>No Updates Found</Text>
            <Text style={[styles.emptySubtitle, { color: t.textMuted }]}>There are no updates in this category right now.</Text>
          </View>
        ) : (
          filteredNotifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.card,
                { backgroundColor: t.card, borderColor: t.divider },
                item.unread && { borderColor: t.unreadBorder, backgroundColor: t.unreadCard },
              ]}
              onPress={() => {
                if (item.unread) markAsRead(item.id);
                if (item.alertId) {
                  router.push({ pathname: '/alert-detail', params: { id: item.alertId } });
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[
                      styles.iconWrapper,
                      item.type === 'alert'
                        ? { backgroundColor: t.alertIconBg }
                        : { backgroundColor: t.notifIconBg },
                    ]}
                  >
                    {item.type === 'alert' ? (
                      <Ionicons name="warning" size={20} color="#E0533C" />
                    ) : (
                      <MaterialIcons name="notifications-active" size={20} color={t.primaryLight} />
                    )}
                  </View>
                  <View style={styles.metaContainer}>
                    <Text style={[styles.categoryText, { color: t.textMuted }]}>{item.category || 'General'}</Text>
                    <Text style={[styles.timeText, { color: t.textMuted }]}>{item.time}</Text>
                  </View>
                </View>
                <View style={styles.cardHeaderRight}>
                  {item.unread && (
                    <Octicons name="dot-fill" size={14} color={t.primaryLight} style={styles.unreadDot} />
                  )}
                  <TouchableOpacity onPress={() => deleteNotification(item.id)} style={styles.deleteButton}>
                    <Feather name="trash-2" size={16} color={t.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: t.textSecondary }, item.unread && { color: t.text, fontWeight: '700' }]}>
                  {item.title}
                </Text>
                <Text style={[styles.cardDescription, { color: t.textSecondary }]}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  markAllReadButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContainer: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaContainer: {
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeText: {
    fontSize: 11,
    marginTop: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unreadDot: {
    marginRight: 2,
  },
  deleteButton: {
    padding: 4,
  },
  cardBody: {
    paddingLeft: 48,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});