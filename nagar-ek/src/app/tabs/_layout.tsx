import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useTheme } from '@/stores/themeStore';
import { AuthStoreInterface, useAuthStore } from '@/stores/authStore';
import { Tabs } from 'expo-router';
import { PlatformPressable } from 'expo-router/build/react-navigation';
import { View, TouchableOpacity, Platform, DeviceEventEmitter } from 'react-native';
import { useEffect, useState } from 'react';

export default function TabLayout() {
  const t = useTheme();
  const { token } = useAuthStore() as AuthStoreInterface;
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnread = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const unread = data.some((item: any) => item.unread);
        setHasUnread(unread);
      }
    } catch (e) {
      console.warn('Failed to check unread notifications:', e);
    }
  };

  useEffect(() => {
    checkUnread();
    const subNew = DeviceEventEmitter.addListener('onNewAlert', checkUnread);
    const subRead = DeviceEventEmitter.addListener('onNotificationRead', checkUnread);
    return () => {
      subNew.remove();
      subRead.remove();
    };
  }, [token]);
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: t.tabActive,
      tabBarInactiveTintColor: t.tabInactive,
      tabBarStyle: {
        backgroundColor: t.tabBar,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: Platform.OS === 'ios' ? 105 : 85,
        paddingBottom: Platform.OS === 'ios' ? 40 : 25,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: t.tabBarBorder,
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      tabBarButton: (props) => (
        <PlatformPressable
          {...props}
          pressColor="transparent"
          pressOpacity={0.3}
        />
      )
    }}>
      <Tabs.Screen name='index' options={{ headerShown: false, title: 'Home', tabBarIcon: ({ color }) => <Entypo name='home' size={24} color={color} /> }} />
      <Tabs.Screen name='map' options={{ headerShown: false, title: 'Map', tabBarIcon: ({ color }) => <Entypo name='location' size={24} color={color} /> }} />
      <Tabs.Screen
        name='create'
        options={{
          headerShown: false,
          title: '',
          tabBarButton: (props) => (
            <TouchableOpacity
              onPress={props.onPress}
              style={{
                top: -25,
                justifyContent: 'center',
                alignItems: 'center',
                height: 80,
                width: 80,
              }}
            >
              <FontAwesome6 name="circle-plus" size={70} color={t.tabActive} />
            </TouchableOpacity>
          )
        }}
      />
      <Tabs.Screen 
        name='notification' 
        options={{ 
          headerShown: false, 
          title: 'Notification', 
          tabBarIcon: ({ color }) => (
            <View>
              <FontAwesome name="bell" size={24} color={color} />
              {hasUnread && (
                <View style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 10,
                  height: 10,
                  backgroundColor: '#E0533C',
                  borderRadius: 5,
                  borderWidth: 2,
                  borderColor: t.tabBar
                }} />
              )}
            </View>
          ) 
        }} 
      />
      <Tabs.Screen name='profile' options={{ headerShown: false, title: 'Profile', tabBarStyle: { display: 'none' }, tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} /> }} />
    </Tabs>
  );
}
