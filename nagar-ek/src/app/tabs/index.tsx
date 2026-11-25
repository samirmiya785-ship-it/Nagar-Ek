import { useTheme } from '@/stores/themeStore';
import { AuthStoreInterface, useAuthStore } from '@/stores/authStore';
import { useLoaderStore } from '@/stores/loaderStore';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from "expo-router";
import React, { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useColorScheme, DeviceEventEmitter } from "react-native";

export default function Index() {
    const t = useTheme();
    const isDark = useColorScheme() === 'dark';
    const { user } = useAuthStore() as AuthStoreInterface;
    const { showLoader, hideLoader } = useLoaderStore();
    const [alerts, setAlerts] = useState<any[]>([]);

    const fetchRecentAlerts = async () => {
        showLoader();
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/alerts/recent`);
            if (response.ok) {
                const data = await response.json();
                setAlerts(data.slice(0, 6));
            }
        } catch (err) {
            console.warn('Failed to fetch recent alerts:', err);
        } finally {
            hideLoader();
        }
    };

    useEffect(() => {
        fetchRecentAlerts();
        const sub = DeviceEventEmitter.addListener('onNewAlert', () => {
            fetchRecentAlerts();
        });
        return () => sub.remove();
    }, []);

    const formatAlertTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '10:00 AM';
        }
    };

    return (
        <View style={[styles.body, { backgroundColor: t.bg }]}>
            <StatusBar
                barStyle={t.statusBar}
                backgroundColor={t.topBar}
            />
            <View style={{ height: Platform.OS === 'ios' ? 55 : 40 }} />
            <View style={[styles.topbar, { backgroundColor: t.topBar }]}>
                <Text style={[styles.topbarText, { color: t.topBarText }]}>Nagar Ek</Text>
                <View style={styles.profileButtonContainer}>
                    <TouchableOpacity style={styles.pointsContainer}>
                        <Text style={styles.pointsText}>Points </Text>
                        <Text style={styles.pointsValue}>{user?.points || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/tabs/profile')} style={[styles.profileButton, { borderColor: t.primary }]}>
                        <Image source={require('../../../assets/images/essential/default-profilepic.jpg')} style={{ width: 40, height: 40 }} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
                <View style={styles.adsContainer}>
                    <Image source={require('../../../assets/images/ads/pcps.jpg')} style={styles.adsImage} />
                </View>
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: t.text }]}>Features</Text>
                    <View style={styles.featureCardContainer}>
                        <TouchableOpacity 
                            style={[styles.featureCard, { backgroundColor: t.card, borderColor: isDark ? t.cardBorder : '#05482320' }]}
                            onPress={() => router.push('/smart-travel')}
                        >
                            <FontAwesome5 name="bus-alt" size={30} color={t.primaryLight} />
                            <Text style={[styles.featureText, { color: t.text }]}>Smart Travel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push('/tabs/notification')} style={[styles.featureCard, { backgroundColor: t.card, borderColor: isDark ? t.cardBorder : '#05482320' }]}>
                            <AntDesign name="alert" size={24} color="#da2c00ff" />
                            <Text style={[styles.featureText, { color: t.text }]}>Live Alerts</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.featureCard, { backgroundColor: t.card, borderColor: isDark ? t.cardBorder : '#05482320' }]}
                            onPress={() => router.push('/gov-services')}
                        >
                            <FontAwesome5 name="school" size={30} color={t.primaryLight} />
                            <Text style={[styles.featureText, { color: t.text }]}>Gov Services</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.sectionContainer}>
                    <View style={styles.alertsSectionHeader}>
                        <Text style={[styles.section2Title, { color: t.text }]}>Recent Alerts</Text>
                        <TouchableOpacity onPress={() => router.push('/tabs/notification')}>
                            <Text style={[styles.seeAllText, { color: t.primaryLight }]}>See all</Text>
                        </TouchableOpacity>
                    </View>
                    {alerts.length === 0 ? (
                        <View style={styles.emptyAlertsContainer}>
                            <Ionicons name="notifications-off-outline" size={32} color={t.textMuted} />
                            <Text style={[styles.emptyAlertsText, { color: t.textMuted }]}>No recent alerts</Text>
                        </View>
                    ) : (
                        <View style={styles.alertCardGrid}>
                            {alerts.map((item) => (
                                <TouchableOpacity
                                    key={item._id}
                                    style={[styles.alertSmallCard, { backgroundColor: t.card, borderColor: isDark ? t.cardBorder : '#E0533C18' }]}
                                    onPress={() => router.push({ pathname: '/alert-detail', params: { id: item._id } })}
                                    activeOpacity={0.75}
                                >
                                    <Ionicons name="warning" size={18} color="#E0533C" />
                                    <View style={[styles.alertCatBadge, { backgroundColor: isDark ? '#2a1a1a' : '#fff1ec' }]}>
                                        <Text style={[styles.alertCatText, { color: '#E0533C' }]} numberOfLines={1}>
                                            {item.category || 'General'}
                                        </Text>
                                    </View>
                                    <Text numberOfLines={2} style={[styles.alertSmallDesc, { color: t.textSecondary }]}>
                                        {item.description}
                                    </Text>
                                    <Text numberOfLines={1} style={[styles.alertSmallTime, { color: t.textMuted }]}>
                                        {formatAlertTime(item.createdAt)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    body: {
        flex: 1,
    },
    topbar: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        height: 50,
        paddingHorizontal: 20,
    },
    topbarText: {
        fontSize: 25,
        fontWeight: 'bold',
        textAlign: 'left',
        lineHeight: 50,
    },
    profileButtonContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    pointsContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: '#054823',
        borderRadius: 20,
        backgroundColor: '#054823',
        elevation: 5,
    },
    pointsText: {
        color: '#fff',
    },
    pointsValue: {
        color: '#ffea00',
        fontWeight: 'bold',
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
    },
    adsContainer: {
        width: '100%',
        height: 230,
        marginTop: 20,
        paddingHorizontal: 20,
        overflow: 'hidden',
    },
    adsImage: {
        width: '100%',
        height: 190,
        borderRadius: 10,
        elevation: 2,
    },
    sectionContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    featureText: {
        fontSize: 13,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    featureCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    featureCardContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    section2Title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    alertsSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 12,
    },
    seeAllText: {
        fontSize: 13,
        fontWeight: '600',
    },
    emptyAlertsContainer: {
        alignItems: 'center',
        paddingVertical: 24,
        gap: 8,
    },
    emptyAlertsText: {
        fontSize: 13,
    },
    alertCardGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        paddingBottom: 10,
        gap: 10,
    },
    alertSmallCard: {
        width: '30%',
        flexGrow: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        gap: 5,
    },
    alertCatBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    alertCatText: {
        fontSize: 9,
        fontWeight: '700',
    },
    alertSmallDesc: {
        fontSize: 10,
        lineHeight: 14,
    },
    alertSmallTime: {
        fontSize: 9,
        marginTop: 2,
    },
});