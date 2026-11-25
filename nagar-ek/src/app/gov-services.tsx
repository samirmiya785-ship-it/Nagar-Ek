import { useTheme } from '@/stores/themeStore';
import { useLoaderStore } from '@/stores/loaderStore';
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface GovService {
  _id: string;
  name: string;
  description: string;
  location: string;
  hours: string;
  mapQuery: string;
  iconType: string;
  providedServices?: { name: string; documentsRequired: string[] }[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export default function GovServices() {
  const t = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<GovService[]>([]);
  const { showLoader, hideLoader } = useLoaderStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "0", role: "assistant", text: "Hello! I'm your Nagar-Ek Assistant 👋\nAsk me anything about government services, required documents, office locations, or recent alerts!" }
  ]);
  const [inputText, setInputText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchServices = async () => {
    showLoader();
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/government`);
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (e) {
      console.warn("Failed to fetch government services:", e);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleGetDirection = (query: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) Linking.openURL(url);
        else Alert.alert("Error", "Unable to open Google Maps");
      })
      .catch(err => console.error(err));
  };

  const sendChatMessage = async () => {
    if (!inputText.trim() || chatLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", text: inputText.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setInputText("");
    setChatLoading(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });
      const data = await res.json();
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: data.reply || "Sorry, I couldn't process that request.",
      };
      setChatMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "Network error. Please check your connection and try again.",
      }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const filteredServices = services.filter(s => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    if (
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q)
    ) return true;
    // Also search inside individual service names and required documents
    return s.providedServices?.some(ps =>
      ps.name.toLowerCase().includes(q) ||
      ps.documentsRequired?.some(doc => doc.toLowerCase().includes(q))
    ) ?? false;
  });

  const renderIcon = (type: string) => {
    switch (type) {
      case "passport": return <FontAwesome5 name="passport" size={30} color={t.primaryLight} />;
      case "city": return <FontAwesome5 name="building" size={30} color={t.primaryLight} />;
      case "transport": return <MaterialCommunityIcons name="card-account-details-outline" size={32} color={t.primaryLight} />;
      case "consular": return <Ionicons name="globe-outline" size={32} color={t.primaryLight} />;
      default: return <Ionicons name="business-outline" size={30} color={t.primaryLight} />;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.govSafeArea }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor={t.govTopBar} />

      <View style={[styles.topBar, { backgroundColor: t.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={t.primary} />
        </TouchableOpacity>
        <View style={[styles.searchContainer, { borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.12)' }]}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.8)" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: '#FFF' }]}
            placeholder="Search for government services..."
            placeholderTextColor="rgba(255,255,255,0.55)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Find Government Services</Text>
            <Text style={styles.bannerSubtitle}>Get directions to important government offices near you.</Text>
            <View style={styles.bannerIndicator} />
          </View>
          {/* AI Chat CTA */}
          <TouchableOpacity
            style={styles.aiBannerBtn}
            onPress={() => setChatOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={20} color="#FFF" />
            <Text style={styles.aiBannerBtnText}>Ask AI</Text>
          </TouchableOpacity>
        </View>

        {/* Services List */}
        <View style={styles.listContainer}>
          {filteredServices.length > 0 ? (
            filteredServices.map(service => (
              <TouchableOpacity
                key={service._id}
                style={[styles.serviceCard, { backgroundColor: t.govCard, borderColor: t.govCardBorder }]}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/gov-service-detail', params: { id: service._id } })}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: t.govIconBg }]}>{renderIcon(service.iconType)}</View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.serviceTitle, { color: t.primaryLight }]}>{service.name}</Text>
                    <Text style={[styles.serviceDescription, { color: t.govDescText }]}>{service.description}</Text>
                  </View>
                </View>
                <View style={[styles.cardFooter, { borderTopColor: t.govCardFooterBorder }]}>
                  <View style={styles.detailsColumn}>
                    <View style={styles.detailItem}>
                      <Ionicons name="location-sharp" size={16} color={t.primaryLight} />
                      <Text style={[styles.detailText, { color: t.govDetailText }]}>{service.location}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="time" size={16} color={t.primaryLight} />
                      <Text style={[styles.detailText, { color: t.govDetailText }]}>{service.hours}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.directionButton} onPress={() => handleGetDirection(service.mapQuery)}>
                    <Ionicons name="navigate" size={14} color="#FFF" style={styles.buttonIcon} />
                    <Text style={styles.directionButtonText}>Directions</Text>
                    <Ionicons name="chevron-forward" size={12} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={t.emptyIcon} />
              <Text style={[styles.emptyText, { color: t.textMuted }]}>No government services found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Chat Button */}
      {!chatOpen && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: t.primary }]} onPress={() => setChatOpen(true)} activeOpacity={0.85}>
          <Ionicons name="sparkles" size={22} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Chat Modal */}
      {chatOpen && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.chatOverlay, { backgroundColor: t.bg }]}
        >
          {/* Chat Header */}
          <View style={[styles.chatHeader, { backgroundColor: t.primary }]}>
            <View style={styles.chatHeaderLeft}>
              <Ionicons name="sparkles" size={20} color="#FFF" />
              <Text style={styles.chatHeaderTitle}>Nagar-Ek Assistant</Text>
            </View>
            <TouchableOpacity onPress={() => setChatOpen(false)} style={styles.chatCloseBtn}>
              <Ionicons name="chevron-down" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messageList}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => (
              <View style={[
                styles.messageBubble,
                item.role === "user"
                  ? [styles.userBubble, { backgroundColor: t.primary }]
                  : [styles.aiBubble, { backgroundColor: t.card, borderColor: t.cardBorder }]
              ]}>
                {item.role === "assistant" && (
                  <View style={[styles.aiBubbleIcon, { backgroundColor: t.primary }]}>
                    <Ionicons name="sparkles" size={12} color="#FFF" />
                  </View>
                )}
                <Text style={[
                  styles.messageText,
                  { color: item.role === "user" ? "#FFF" : t.text }
                ]}>{item.text}</Text>
              </View>
            )}
          />

          {chatLoading && (
            <View style={[styles.typingIndicator, { backgroundColor: t.card }]}>
              <ActivityIndicator size="small" color={t.primary} />
              <Text style={[styles.typingText, { color: t.textMuted }]}>Nagar-Ek Assistant is thinking...</Text>
            </View>
          )}

          {/* Input */}
          <View style={[styles.chatInputRow, { backgroundColor: t.card, borderTopColor: t.cardBorder }]}>
            <TextInput
              style={[styles.chatInput, { color: t.text }]}
              placeholder="Ask about government services..."
              placeholderTextColor={t.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              onSubmitEditing={sendChatMessage}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: inputText.trim() ? t.primary : t.cardBorder }]}
              onPress={sendChatMessage}
              disabled={!inputText.trim() || chatLoading}
            >
              <Ionicons name="send" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  scrollContainer: { paddingBottom: 100 },
  bannerCard: {
    flexDirection: "row",
    margin: 16,
    borderRadius: 18,
    backgroundColor: "#054823",
    padding: 20,
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  bannerTextContainer: { flex: 1, paddingRight: 12 },
  bannerTitle: { fontSize: 18, fontWeight: "bold", color: "#FFF" },
  bannerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  bannerIndicator: { width: 40, height: 3, backgroundColor: "#fff", borderRadius: 2, marginTop: 10, opacity: 0.4 },
  aiBannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  aiBannerBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  listContainer: { paddingHorizontal: 16 },
  serviceCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
  },
  cardHeader: { flexDirection: "row", padding: 16, alignItems: "center" },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  textContainer: { flex: 1 },
  serviceTitle: { fontSize: 15, fontWeight: "bold" },
  serviceDescription: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  detailsColumn: { gap: 4, flex: 1 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 12 },
  directionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#054823",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  directionButtonText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  buttonIcon: { marginRight: 2 },
  emptyContainer: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  // Chat overlay
  chatOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 100,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingBottom: 14,
  },
  chatHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  chatHeaderTitle: { color: "#FFF", fontSize: 17, fontWeight: "bold" },
  chatCloseBtn: { padding: 4 },
  messageList: { padding: 16, gap: 12 },
  messageBubble: {
    maxWidth: "85%",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  userBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 4, borderWidth: 1 },
  aiBubbleIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  messageText: { fontSize: 14, lineHeight: 20, flex: 1 },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
  },
  typingText: { fontSize: 13 },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    maxHeight: 100,
    fontSize: 14,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
