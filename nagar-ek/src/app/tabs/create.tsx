import { AuthStoreInterface, useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/stores/themeStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

const CATEGORIES = [
  { id: 'Traffic', label: 'Traffic', icon: 'car-outline' },
  { id: 'Utility', label: 'Utility', icon: 'water-outline' },
  { id: 'Waste', label: 'Waste', icon: 'trash-outline' },
  { id: 'Infrastructure', label: 'Road/Bridge', icon: 'construct-outline' },
  { id: 'Other', label: 'Other', icon: 'alert-circle-outline' },
];

const CreateProblem = () => {
  const t = useTheme();
  const { token } = useAuthStore() as AuthStoreInterface;

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  
  // Location States
  const [currentCoords, setCurrentCoords] = useState<[number, number] | null>(null); // [lng, lat]
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null); // [lng, lat]
  const [pickerCoords, setPickerCoords] = useState<[number, number] | null>(null); // [lng, lat] - temp picker coords
  const [locationAddress, setLocationAddress] = useState<string>('Resolving your location...');
  const [showMapModal, setShowMapModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get user initial location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords: [number, number] = [loc.coords.longitude, loc.coords.latitude];
        setCurrentCoords(coords);
        setSelectedCoords(coords);
      } else {
        const fallback: [number, number] = [85.324, 27.717]; // Kathmandu default
        setCurrentCoords(fallback);
        setSelectedCoords(fallback);
      }
    })();
  }, []);

  // Reverse geocode when selectedCoords change
  useEffect(() => {
    if (!selectedCoords) return;
    (async () => {
      try {
        const [lng, lat] = selectedCoords;
        const addressObj = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (addressObj && addressObj.length > 0) {
          const item = addressObj[0];
          const name = item.name || '';
          const street = item.street || '';
          const district = item.district || item.subregion || '';
          const city = item.city || '';
          const full = [name, street, district, city].filter(Boolean).join(', ');
          setLocationAddress(full || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        } else {
          setLocationAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        }
      } catch (err) {
        setLocationAddress(`Lat: ${selectedCoords[1].toFixed(4)}, Lng: ${selectedCoords[0].toFixed(4)}`);
      }
    })();
  }, [selectedCoords]);

  const handlePostProblem = async () => {
    if (!description.trim()) {
      alert('Please describe the problem first.');
      return;
    }

    if (!selectedCoords) {
      alert('Please wait until location details are resolved.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: `${category} Problem Report`,
        description,
        category,
        location: {
          type: 'Point',
          coordinates: selectedCoords, // [lng, lat]
        },
        image: photoBase64 ? `data:image/jpeg;base64,${photoBase64}` : null,
      };

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Problem posted successfully! Thank you for contributing to Nagar Ek.');
        setDescription('');
        setPhotoBase64(null);
        setPhotoUri(null);
        router.back();
      } else {
        const errData = await response.json();
        alert(`Failed to post problem: ${errData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while posting the problem. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to upload photos!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      if (asset.base64) {
        setPhotoBase64(asset.base64);
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
  };

  // Build HTML string for Leaflet Map Picker
  const buildPickerMapHtml = (lat: number, lng: number) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    body,html,#map{margin:0;padding:0;width:100%;height:100%;background:#f5f5f5;}
    .leaflet-control-zoom,.leaflet-control-attribution{display:none!important;}
  </style>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map',{zoomControl:false,attributionControl:false})
             .setView([${lat},${lng}], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

  var selectedMarker = L.marker([${lat},${lng}]).addTo(map);

  map.on('click', function(e) {
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;
    selectedMarker.setLatLng(e.latlng);
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'mapClick',
      lat: lat,
      lng: lng
    }));
  });
</script>
</body>
</html>`;
  };

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapClick') {
        setPickerCoords([data.lng, data.lat]);
      }
    } catch (e) {
      console.warn('Failed to parse map click message', e);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.body, { backgroundColor: t.bg }]}
    >
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: t.bg }]}>
        <View style={{ height: Platform.OS === 'ios' ? 50 : 40 }} />
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: t.iconBg }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={t.text} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: t.isDark ? '#e8f5e9' : '#054823' }]}>
              Post the Problems
            </Text>
            <View style={[styles.underline, { backgroundColor: t.isDark ? '#81c784' : '#054823' }]} />
          </View>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: t.isDark ? '#1a2b20' : '#f0f5ee' }]}>
          <View style={[styles.infoIconContainer, { backgroundColor: t.isDark ? '#2e5c38' : '#e2f0d9' }]}>
            <Ionicons name="information-circle" size={20} color={t.isDark ? '#81c784' : '#054823'} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoText, { color: t.text }]}>
              Share the issue you're facing in your area.
            </Text>
            <Text style={[styles.infoSubtext, { color: t.textSecondary }]}>
              Your report helps make Nagar Ek better for everyone.
            </Text>
          </View>
        </View>

        {/* Category Selector Card */}
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.cardBorder, borderWidth: t.cardBorderWidth }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="grid-outline" size={20} color={t.text} style={{ marginRight: 8 }} />
            <Text style={[styles.cardTitle, { color: t.text }]}>Select Category</Text>
          </View>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isSelected
                        ? (t.isDark ? '#2e5c38' : '#e2f0d9')
                        : t.iconBg,
                      borderColor: isSelected ? t.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={isSelected ? t.primary : t.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: isSelected ? t.text : t.textSecondary, fontWeight: isSelected ? '600' : '400' },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Location Picker Card */}
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.cardBorder, borderWidth: t.cardBorderWidth }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={20} color={t.text} style={{ marginRight: 8 }} />
            <Text style={[styles.cardTitle, { color: t.text }]}>Issue Location</Text>
          </View>
          
          <View style={styles.locationWrapper}>
            <View style={styles.locationInfo}>
              <Text style={[styles.locationLabel, { color: t.textSecondary }]} numberOfLines={2}>
                {locationAddress}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.mapPickerBtn, { backgroundColor: t.isDark ? '#2e5c38' : '#054823' }]}
              onPress={() => {
                if (currentCoords) {
                  setPickerCoords(currentCoords);
                }
                setShowMapModal(true);
              }}
            >
              <Ionicons name="map-outline" size={16} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.mapPickerBtnText}>Select on Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Input Box Card */}
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.cardBorder, borderWidth: t.cardBorderWidth }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="edit" size={20} color={t.text} style={{ marginRight: 8 }} />
            <Text style={[styles.cardTitle, { color: t.text }]}>Describe the problem</Text>
          </View>
          <TextInput
            style={[styles.textInput, { color: t.inputText }]}
            placeholder="Enter details about the issue..."
            placeholderTextColor={t.placeholder}
            multiline
            maxLength={500}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
          <View style={styles.cardFooter}>
            <View style={[styles.charCountBg, { backgroundColor: t.iconBg }]}>
              <Ionicons name="document-text-outline" size={14} color={t.textMuted} style={{ marginRight: 4 }} />
              <Text style={[styles.charCountText, { color: t.textSecondary }]}>
                {description.length}/500
              </Text>
            </View>
            <View style={styles.tipContainer}>
              <Ionicons name="bulb-outline" size={14} color="#e6a100" style={{ marginRight: 4 }} />
              <Text style={[styles.tipText, { color: t.textSecondary }]}>Be specific and clear</Text>
            </View>
          </View>
        </View>

        {/* Photo Box Card */}
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.cardBorder, borderWidth: t.cardBorderWidth }]}>
          <View style={styles.photoContainer}>
            {photoUri ? (
              <View style={styles.attachedPhotoContainer}>
                <Image source={{ uri: photoUri }} style={styles.attachedPhoto} />
                <TouchableOpacity style={styles.removePhotoBadge} onPress={handleRemovePhoto}>
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadBox, { borderColor: t.isDark ? '#2e5c38' : '#05482350', backgroundColor: t.isDark ? '#1a2b20' : '#f0f5ee' }]}
                onPress={handleSelectPhoto}
              >
                <Ionicons name="cloud-upload-outline" size={32} color={t.isDark ? '#81c784' : '#054823'} />
              </TouchableOpacity>
            )}
            <View style={styles.photoInfoContainer}>
              <Text style={[styles.photoTitle, { color: t.text }]}>Add a photo</Text>
              <Text style={[styles.photoDescription, { color: t.textSecondary }]}>
                Upload a clear photo of the problem to help us understand better.
              </Text>
              <Text style={[styles.photoMeta, { color: t.textMuted }]}>
                JPG, PNG up to 5MB
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: t.isDark ? '#2e5c38' : '#054823' }]}
          onPress={handlePostProblem}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Post Problem</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Map Picker Modal */}
      {showMapModal && pickerCoords && (
        <Modal animationType="slide" visible={showMapModal} onRequestClose={() => setShowMapModal(false)}>
          <View style={[styles.modalContainer, { backgroundColor: t.bg }]}>
            <View style={[styles.modalHeader, { backgroundColor: t.card, borderBottomColor: t.divider }]}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowMapModal(false)}>
                <Ionicons name="close" size={24} color={t.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: t.text }]}>Tap to Pick Location</Text>
              <TouchableOpacity
                style={[styles.modalDoneBtn, { backgroundColor: t.isDark ? '#2e5c38' : '#054823' }]}
                onPress={() => {
                  setSelectedCoords(pickerCoords);
                  setShowMapModal(false);
                }}
              >
                <Text style={styles.modalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <WebView
              source={{ html: buildPickerMapHtml(pickerCoords[1], pickerCoords[0]) }}
              style={{ flex: 1 }}
              onMessage={handleMapMessage}
              javaScriptEnabled
              domStorageEnabled
            />
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

export default CreateProblem;

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 10,
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  underline: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginTop: 4,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
  },
  locationWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  mapPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mapPickerBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    height: 120,
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  charCountBg: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  charCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 12,
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadBox: {
    width: 76,
    height: 76,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  attachedPhotoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  attachedPhoto: {
    width: 76,
    height: 76,
    borderRadius: 16,
  },
  removePhotoBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ff3b30',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  photoInfoContainer: {
    flex: 1,
  },
  photoTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  photoDescription: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  photoMeta: {
    fontSize: 11,
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 54,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalDoneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modalDoneText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
});