import { useTheme } from '@/stores/themeStore';
import { useLoaderStore } from '@/stores/loaderStore';
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const AccordionItem = ({ service }: { service: any }) => {
  const t = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.accordionContainer, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={[styles.accordionTitle, { color: t.text }]}>{service.name}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={t.textMuted} />
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.accordionBody, { borderTopColor: t.divider ?? '#eee' }]}>
          <Text style={[styles.docLabel, { color: t.textMuted }]}>Documents Required:</Text>
          {service.documentsRequired?.map((doc: string, idx: number) => (
            <View key={idx} style={styles.docItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={t.primaryLight} />
              <Text style={[styles.docText, { color: t.textSecondary }]}>{doc}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default function GovServiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const [govData, setGovData] = useState<any>(null);
  const { showLoader, hideLoader } = useLoaderStore();

  useEffect(() => {
    (async () => {
      showLoader();
      try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/government/${id}`);
        if (res.ok) {
          const data = await res.json();
          setGovData(data);
        }
      } catch (e) {
        console.warn("Failed to fetch service detail:", e);
      } finally {
        hideLoader();
      }
    })();
  }, [id]);

  const handleGetDirection = () => {
    if (!govData?.mapQuery) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(govData.mapQuery)}`;
    Linking.openURL(url).catch(console.error);
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "passport": return <FontAwesome5 name="passport" size={32} color="#FFF" />;
      case "city": return <FontAwesome5 name="building" size={32} color="#FFF" />;
      case "transport": return <MaterialCommunityIcons name="card-account-details-outline" size={36} color="#FFF" />;
      case "consular": return <Ionicons name="globe-outline" size={36} color="#FFF" />;
      default: return <Ionicons name="business" size={36} color="#FFF" />;
    }
  };

  if (!govData) {
    return (
      <View style={[styles.safeArea, { backgroundColor: t.bg }]}>
        <TouchableOpacity style={[styles.backButtonRound, { margin: 20, backgroundColor: t.card }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={t.text} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={{ color: t.text }}>Service not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      {/* Header section */}
      <View style={[styles.headerBanner, { backgroundColor: t.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButtonRound} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            {renderIcon(govData.iconType)}
          </View>
          <Text style={styles.headerTitle}>{govData.name}</Text>
          <Text style={styles.headerLocation}>
            <Ionicons name="location" size={14} color="#FFF" /> {govData.location}
          </Text>
          <Text style={styles.headerHours}>
            <Ionicons name="time-outline" size={13} color="#FFF" /> {govData.hours}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>About</Text>
          <Text style={[styles.description, { color: t.textSecondary }]}>{govData.description}</Text>
        </View>

        {/* Get Directions button */}
        <TouchableOpacity style={[styles.directionBtn, { backgroundColor: t.primary }]} onPress={handleGetDirection}>
          <Ionicons name="navigate" size={18} color="#FFF" />
          <Text style={styles.directionBtnText}>Get Directions on Google Maps</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Services Provided</Text>
          {govData.providedServices?.length > 0 ? (
            <View style={styles.accordionList}>
              {govData.providedServices.map((service: any, idx: number) => (
                <AccordionItem key={idx} service={service} />
              ))}
            </View>
          ) : (
            <Text style={{ color: t.textMuted, marginTop: 10 }}>No specific services listed.</Text>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerBanner: {
    paddingTop: Platform.OS === "ios" ? 56 : 44,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backButtonRound: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: { alignItems: "center" },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 6,
  },
  headerLocation: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginBottom: 4 },
  headerHours: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  scrollContainer: { padding: 20 },
  infoSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 22 },
  directionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 16,
    marginBottom: 24,
  },
  directionBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  accordionList: { gap: 12, marginTop: 8 },
  accordionContainer: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  accordionTitle: { fontSize: 15, fontWeight: "600", flex: 1 },
  accordionBody: { borderTopWidth: 1, padding: 16, backgroundColor: "rgba(0,0,0,0.02)" },
  docLabel: { fontSize: 13, fontWeight: "600", marginBottom: 10 },
  docItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8, gap: 8 },
  docText: { fontSize: 14, flex: 1, lineHeight: 20 },
});
