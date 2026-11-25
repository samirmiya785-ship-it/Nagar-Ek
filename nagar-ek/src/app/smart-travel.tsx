import { useTheme } from '@/stores/themeStore';
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SmartTravel() {
  const t = useTheme();
  const router = useRouter();
  const [locationName, setLocationName] = useState("Fetching location...");

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationName("Permission denied");
          return;
        }

        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        let response = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });

        if (response && response.length > 0) {
          const address = response[0];
          const name = [address.street, address.district || address.city]
            .filter(Boolean)
            .join(", ") || "Kathmandu, Nepal";
          setLocationName(name);
        } else {
          setLocationName(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
        }
      } catch (error) {
        setLocationName("Baneshwor, Kathmandu");
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f5ee" />

      {/* Header Row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#054823" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Smart Travel</Text>
        <Text style={styles.subtitle}>— Travel easy, reach happy —</Text>

        {/* Bus Illustration - Larger height */}
        <View style={styles.illustrationContainer}>
          <Image
            source={require("../../assets/images/essential/smart_travel_bus.jpg")}
            style={styles.busImage}
            resizeMode="contain"
          />
        </View>

        {/* Info Card - Absolute position overlapping the image */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Map with your bus route</Text>

          {/* Location field */}
          <TouchableOpacity style={styles.listItem} activeOpacity={0.7}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={20} color="#054823" />
            </View>
            <View style={styles.listItemText}>
              <Text style={styles.listLabel}>Your location</Text>
              <Text style={styles.listValue} numberOfLines={1}>{locationName}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#054823" />
          </TouchableOpacity>

          {/* Est Time field */}
          <TouchableOpacity style={styles.listItem} activeOpacity={0.7}>
            <View style={styles.iconCircle}>
              <Ionicons name="time" size={20} color="#054823" />
            </View>
            <View style={styles.listItemText}>
              <Text style={styles.listLabel}>Est. time</Text>
              <Text style={styles.listValue}>15 min</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#054823" />
          </TouchableOpacity>

          {/* View on Map Button */}
          <TouchableOpacity
            style={styles.mapButton}
            activeOpacity={0.9}
            onPress={() => router.push('/tabs/map')}
          >
            <View style={styles.mapBtnContent}>
              <Feather name="map" size={20} color="#FFF" style={styles.mapIcon} />
              <Text style={styles.mapButtonText}>View on Map</Text>
            </View>
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={18} color="#054823" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f2f5ee", // light pale green/cream theme
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    position: 'relative',
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 32,
    fontWeight: "bold",
    color: "#054823",
    marginTop: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#054823",
    opacity: 0.7,
    marginTop: 4,
    marginBottom: 10,
    fontStyle: "italic",
    textAlign: "center",
  },
  illustrationContainer: {
    width: '100%',
    height: 380, // Increased size
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
  },
  busImage: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    backgroundColor: "#FFF",
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    borderRadius: 28,
    padding: 24,
    elevation: 6,
    shadowColor: "#054823",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    gap: 14,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#054823",
    textAlign: "center",
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f9f5",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e3e9dc",
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#e8ede2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  listItemText: {
    flex: 1,
  },
  listLabel: {
    fontSize: 12,
    color: "#054823",
    opacity: 0.6,
    fontWeight: "600",
  },
  listValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#054823",
    marginTop: 2,
  },
  mapButton: {
    backgroundColor: "#054823",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingLeft: 24,
    paddingRight: 12,
    borderRadius: 24,
    marginTop: 4,
  },
  mapBtnContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  mapIcon: {
    marginRight: 10,
  },
  mapButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
});

