/**
 * alertNotificationService.ts
 *
 * Connects to the backend Socket.io server when the app is in the foreground,
 * and schedules a background fetch task (running every 10 mins) when the app is closed.
 */
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Alert, DeviceEventEmitter } from 'react-native';

const BACKGROUND_TASK_NAME = 'BACKGROUND_ALERT_FETCH';
const NOTIFICATION_RADIUS_KM = 5;

// Safely resolve expo-notifications to avoid crashes on Expo Go
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e: any) {
  console.warn('[AlertService] Failed to load expo-notifications (expected on Expo Go):', e.message);
}

let pollingInterval: NodeJS.Timeout | null = null;
let lastSeenAlertId: string | null = null;
let userLocation: { lat: number; lng: number } | null = null;

// ─── Haversine distance helper ─────────────────────────────────────────────
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Request notification permissions ─────────────────────────────────────
async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.warn('[AlertService] Notifications permissions request failed:', err);
    return false;
  }
}

// ─── Set notification handler ──────────────────────────────────────────────
function setupNotificationHandler() {
  if (!Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('[AlertService] Failed to set notification handler:', err);
  }
}

// ─── Fire a local notification ─────────────────────────────────────────────
async function fireNearbyAlertNotification(alert: {
  title: string;
  description: string;
  category: string;
}) {
  if (!Notifications) {
    console.log(`[AlertService] Expo Go Fallback Alert: ${alert.title}`);
    Alert.alert(`🚨 Nearby Alert: ${alert.category}`, alert.description, [{ text: 'OK' }]);
    return;
  }
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 Nearby Alert: ${alert.category}`,
        body: alert.description,
        data: { type: 'nearby_alert' },
        sound: true,
      },
      trigger: null,
    });
  } catch (err) {
    console.warn('[AlertService] Failed to schedule local notification:', err);
  }
}

// ─── TaskManager Background Task Definition ────────────────────────────────
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    const token = await SecureStore.getItemAsync('token');
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!token || !apiUrl) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Fetch unread notifications from DB
    const response = await fetch(`${apiUrl}/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    const data = await response.json();
    const unreadAlerts = data.filter((item: any) => item.unread && item.type === 'alert');
    if (unreadAlerts.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Load last check timestamp to avoid duplicate alerts
    const lastCheckStr = await SecureStore.getItemAsync('last_alert_check_time');
    const lastCheckTime = lastCheckStr ? parseInt(lastCheckStr, 10) : 0;
    const now = Date.now();

    let newAlertsFound = false;

    for (const alert of unreadAlerts) {
      const alertTime = new Date(alert.createdAt).getTime();
      if (alertTime > lastCheckTime) {
        newAlertsFound = true;
        await fireNearbyAlertNotification({
          title: alert.title,
          description: alert.description,
          category: alert.category || 'General',
        });
      }
    }

    await SecureStore.setItemAsync('last_alert_check_time', now.toString());

    return newAlertsFound
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (err) {
    console.error('[AlertService] Error in background fetch task:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ─── Start the service ─────────────────────────────────────────────────────
export async function startAlertNotificationService(apiUrl: string) {
  setupNotificationHandler();

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.warn('[AlertService] Notification permission denied.');
  }

  // Get user's location
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      userLocation = { lat: loc.coords.latitude, lng: loc.coords.longitude };

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 50 },
        (pos) => {
          userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        }
      );
    }
  } catch (err) {
    console.warn('[AlertService] Could not get location:', err);
  }

  // Fetch the latest alert once so we don't trigger notifications for old ones on startup
  try {
    const res = await fetch(`${apiUrl}/alerts/recent?limit=1`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        lastSeenAlertId = data[0]._id;
      }
    }
  } catch (e) {
    console.warn('[AlertService] Failed initial alert fetch:', e);
  }

  // Set up HTTP polling for real-time foreground updates (Vercel Serverless compatible)
  if (pollingInterval) clearInterval(pollingInterval);
  
  pollingInterval = setInterval(async () => {
    try {
      const res = await fetch(`${apiUrl}/alerts/recent?limit=1`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data || data.length === 0) return;
      
      const latestAlert = data[0];
      
      // If we see a new alert we haven't processed yet
      if (lastSeenAlertId !== latestAlert._id) {
        lastSeenAlertId = latestAlert._id;

        let currentLoc = userLocation;
        if (!currentLoc) {
          try {
            const lastPos = await Location.getLastKnownPositionAsync({});
            if (lastPos) {
              currentLoc = { lat: lastPos.coords.latitude, lng: lastPos.coords.longitude };
            } else {
              currentLoc = { lat: 27.7042, lng: 85.318 };
            }
          } catch (e) {
            currentLoc = { lat: 27.7042, lng: 85.318 };
          }
        }

        const [alertLng, alertLat] = latestAlert?.location?.coordinates ?? [];
        if (alertLng != null && alertLat != null) {
          const distKm = getDistanceKm(currentLoc.lat, currentLoc.lng, alertLat, alertLng);

          if (distKm <= NOTIFICATION_RADIUS_KM) {
            console.log(`[AlertService] Alert within ${distKm.toFixed(2)} km — firing notification`);
            fireNearbyAlertNotification({
              title: latestAlert.title,
              description: latestAlert.description,
              category: latestAlert.category,
            });
            // Notify active screens to refresh data
            DeviceEventEmitter.emit('onNewAlert');
          }
        } else {
          // If no location, trigger it globally anyway (e.g. city-wide alert)
          fireNearbyAlertNotification({
            title: latestAlert.title,
            description: latestAlert.description,
            category: latestAlert.category,
          });
          DeviceEventEmitter.emit('onNewAlert');
        }
      }
    } catch (err) {
      console.warn('[AlertService] Error during HTTP polling:', err);
    }
  }, 10000); // Poll every 10 seconds

  // Register background task to run every 10 minutes (600 seconds)
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
        minimumInterval: 600, // 10 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('[AlertService] Background fetch task registered successfully.');
    }
  } catch (err) {
    console.warn('[AlertService] Background fetch registration failed:', err);
  }
}

// ─── Stop the service ──────────────────────────────────────────────────────
export async function stopAlertNotificationService() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
      console.log('[AlertService] Background fetch task unregistered.');
    }
  } catch (err) {
    console.warn('[AlertService] Background task unregistration failed:', err);
  }
}
