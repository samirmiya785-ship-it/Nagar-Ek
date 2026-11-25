import { AuthStoreInterface, useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/stores/themeStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

const Profile = () => {
  const { logout, user } = useAuthStore() as AuthStoreInterface;
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useTheme();


  const handleLogout = () => {
    logout(router);
  };

  return (
    <View style={[styles.body, { backgroundColor: theme.bg }]}>
      {/* Top spacing for status bar */}
      <View style={{ height: Platform.OS === 'ios' ? 60 : 50 }} />

      {/* Header */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={[styles.topBarLeftText, { color: theme.text }]}>Profile</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/tabs/notification')} style={styles.topBarRight}>
          <Ionicons name="notifications-outline" size={26} color={theme.iconColor} />
          <View style={[styles.notificationBadge, { backgroundColor: theme.iconColor }]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Profile Gradient Card */}
        <LinearGradient
          colors={isDark ? ['#0d2b18', '#1a4728'] : ['#054823', '#0D6E37']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCard}
        >
          <View style={styles.leafOverlayLeft} />
          <View style={styles.leafOverlayRight} />

          <View style={styles.cardContent}>
            {/* Profile Picture Container */}
            <View style={styles.profilePicContainer}>
              <View style={styles.profilePicWrapper}>
                <Image
                  style={styles.profilePic}
                  source={require('../../../assets/images/essential/default-profilepic.jpg')}
                  defaultSource={require('../../../assets/images/essential/default-profilepic.jpg')}
                />
              </View>
            </View>

            {/* Profile Detail Text */}
            <View style={styles.profileDetail}>
              <Text style={styles.userName}>Hello, {user?.name || 'User'} 👋</Text>

              {/* Email Row */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="mail" size={12} color="#054823" />
                </View>
                <Text style={styles.infoText}>{user?.email || 'user@example.com'}</Text>
              </View>

              {/* Points/Reward Row */}
              <View style={[styles.infoRow, { marginTop: 4 }]}>
                <View style={[styles.infoIconWrapper, { backgroundColor: '#FFD700' }]}>
                  <Ionicons name="gift" size={12} color="#054823" />
                </View>
                <Text style={[styles.infoText, { fontWeight: '700', color: '#FFD700' }]}>
                  Reward Points: {user?.points || 0}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Section 1: Account */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: isDark ? 1 : 0 }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionHeaderIconWrapper, { backgroundColor: theme.iconBg }]}>
              <Ionicons name="person" size={18} color={theme.iconColor} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
          </View>

          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <View style={[styles.itemIconWrapper, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="person-outline" size={18} color={theme.iconColor} />
              </View>
              <Text style={[styles.listItemText, { color: theme.text }]}>Personal Information</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <View style={[styles.itemIconWrapper, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="location-outline" size={18} color={theme.iconColor} />
              </View>
              <Text style={[styles.listItemText, { color: theme.text }]}>Address</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section 2: App Settings */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: isDark ? 1 : 0 }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionHeaderIconWrapper, { backgroundColor: theme.iconBg }]}>
              <Ionicons name="settings" size={18} color={theme.iconColor} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>App Settings</Text>
          </View>

          {/* Appearance (auto, read-only) */}
          <View style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <View style={[styles.itemIconWrapper, { backgroundColor: theme.iconBg }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={theme.iconColor} />
              </View>
              <View>
                <Text style={[styles.listItemText, { color: theme.text }]}>Appearance</Text>
                <Text style={[styles.listItemSubText, { color: theme.textMuted }]}>
                  {isDark ? 'Dark Mode' : 'Light Mode'} · Follows System
                </Text>
              </View>
            </View>
            <View style={[styles.systemBadge, { backgroundColor: theme.iconBg }]}>
              <Text style={[styles.systemBadgeText, { color: theme.iconColor }]}>Auto</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <View style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <View style={[styles.itemIconWrapper, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="notifications-outline" size={18} color={theme.iconColor} />
              </View>
              <Text style={[styles.listItemText, { color: theme.text }]}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: isDark ? '#2a3d30' : '#d1d1d1', true: isDark ? '#2e5c38' : '#e2f0d9' }}
              thumbColor={notificationsEnabled ? theme.iconColor : isDark ? '#555' : '#f4f3f4'}
              ios_backgroundColor={isDark ? '#2a3d30' : '#d1d1d1'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <View style={[styles.itemIconWrapper, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.iconColor} />
              </View>
              <Text style={[styles.listItemText, { color: theme.text }]}>Privacy &amp; Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section 3: Support & Help */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: isDark ? 1 : 0 }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionHeaderIconWrapper, { backgroundColor: theme.iconBg }]}>
              <Ionicons name="headset" size={18} color={theme.iconColor} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Support &amp; Help</Text>
          </View>

          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <View style={[styles.itemIconWrapper, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="help-circle-outline" size={18} color={theme.iconColor} />
              </View>
              <Text style={[styles.listItemText, { color: theme.text }]}>Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <View style={[styles.itemIconWrapper, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="chatbox-ellipses-outline" size={18} color={theme.iconColor} />
              </View>
              <Text style={[styles.listItemText, { color: theme.text }]}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <View style={[styles.itemIconWrapper, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="information-circle-outline" size={18} color={theme.iconColor} />
              </View>
              <Text style={[styles.listItemText, { color: theme.text }]}>About App</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: theme.logoutBorder, backgroundColor: theme.logoutBg }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.logoutText} style={{ marginRight: 8 }} />
          <Text style={[styles.logoutButtonText, { color: theme.logoutText }]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  backButton: {
    padding: 10,
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarLeftText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  topBarRight: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gradientCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  leafOverlayLeft: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  leafOverlayRight: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicContainer: {
    position: 'relative',
  },
  profilePicWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    backgroundColor: '#e2f0d9',
  },
  profilePic: {
    width: '100%',
    height: '100%',
  },
  profileDetail: {
    marginLeft: 20,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#FFF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  sectionCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listItemSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  systemBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  systemBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginLeft: 48,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 10,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
