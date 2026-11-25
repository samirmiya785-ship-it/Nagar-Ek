import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuthStore } from '../../stores/authStore';
import { Place, PlaceCategory, useMapStore } from '../../stores/mapStore';
import { useTheme } from '../../stores/themeStore';

// ─── Types ───────────────────────────────────────────────────────────────────
type FilterType = 'all' | PlaceCategory;

interface RouteInfo {
  distance: string;
  duration: string;
  destination: string;
}

// ─── Category metadata ────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  hospital: { label: 'Hospital', color: '#C62828', bg: '#FFEBEE', icon: 'hospital-alt' as const },
  government: { label: 'Gov Office', color: '#054823', bg: '#E8F5E9', icon: 'landmark' as const },
  police: { label: 'Police', color: '#1A237E', bg: '#E8EAF6', icon: 'shield-alt' as const },
};

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All Categories' },
  { key: 'hospital', label: 'Hospital' },
  { key: 'government', label: 'Government Offices' },
  { key: 'police', label: 'Police Station' },
];

// ─── Distance helpers ─────────────────────────────────────────────────────────
function distMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const ph1 = (lat1 * Math.PI) / 180;
  const ph2 = (lat2 * Math.PI) / 180;
  const dph = ((lat2 - lat1) * Math.PI) / 180;
  const dlm = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dph / 2) * Math.sin(dph / 2) +
    Math.cos(ph1) * Math.cos(ph2) * Math.sin(dlm / 2) * Math.sin(dlm / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

// ─── Leaflet WebView HTML ─────────────────────────────────────────────────────
function buildMapHtml(initialLat: number, initialLng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    body,html,#map{margin:0;padding:0;width:100%;height:100%;background:#f5f5f5;}
    .pulse-wrap{display:flex;justify-content:center;align-items:center;}
    .pulse{width:14px;height:14px;background:#007AFF;border:3px solid #fff;border-radius:50%;
           box-shadow:0 0 10px rgba(0,122,255,.8);position:relative;}
    .pulse::after{content:'';position:absolute;top:-8px;left:-8px;right:-8px;bottom:-8px;
      border:3px solid #007AFF;border-radius:50%;opacity:.4;animation:p 1.8s infinite ease-out;}
    @keyframes p{0%{transform:scale(.6);opacity:.9;}100%{transform:scale(2);opacity:0;}}
    .leaflet-control-zoom,.leaflet-control-attribution{display:none!important;}
  </style>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
<div id="map"></div>
<script>
var map = L.map('map',{zoomControl:false,attributionControl:false,minZoom:11})
           .setView([${initialLat},${initialLng}],15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

var userIcon = L.divIcon({className:'pulse-wrap',html:'<div class="pulse"></div>',iconSize:[30,30],iconAnchor:[15,15]});
var userMarker = L.marker([${initialLat},${initialLng}],{icon:userIcon,zIndexOffset:9999}).addTo(map);

function pinIcon(color, inner) {
  var svg = '<svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 4px 6px rgba(0,0,0,.28));">' +
    '<path d="M18 0C8.059 0 0 8.059 0 18C0 29.411 18 46 18 46S36 29.411 36 18C36 8.059 27.941 0 18 0Z" fill="' + color + '"/>' +
    '<circle cx="18" cy="18" r="12.5" fill="' + color + '" stroke="white" stroke-width="1.8"/>' +
    inner + '</svg>';
  return L.divIcon({className:'',html:'<div style="width:36px;height:46px;display:flex;justify-content:center;align-items:center;">' + svg + '</div>',iconSize:[36,46],iconAnchor:[18,46]});
}

var icons = {
  hospital:   pinIcon('#C62828','<rect x="16" y="12" width="4" height="12" rx="1" fill="white"/><rect x="12" y="16" width="12" height="4" rx="1" fill="white"/>'),
  government: pinIcon('#054823','<polygon points="18,11 10,17 26,17" fill="white"/><rect x="11" y="17" width="2.5" height="7" fill="white"/><rect x="16.5" y="17" width="3" height="7" fill="white"/><rect x="22.5" y="17" width="2.5" height="7" fill="white"/><rect x="10" y="24" width="16" height="1.8" fill="white"/>'),
  police:     pinIcon('#1A237E','<path d="M18 11L11 14V18C11 22.5 14.1 26.5 18 28C21.9 26.5 25 22.5 25 18V14Z" fill="white" opacity=".9"/><text x="18" y="22" text-anchor="middle" font-size="8" font-weight="bold" fill="#1A237E">P</text>')
};

var placeMarkers = [];
var currentFilter = 'all';
var routeGlow    = null;
var routeLine    = null;
var destMarker   = null;
var radiusCircle = null; // 15 km boundary ring

function clearMarkers() { placeMarkers.forEach(function(m){ map.removeLayer(m); }); placeMarkers = []; }

function renderPlaces(places, filter) {
  clearMarkers();
  places.forEach(function(place) {
    if (filter !== 'all' && place.category !== filter) return;
    var m = L.marker([place.lat, place.lng], {icon: icons[place.category] || icons.government}).addTo(map);
    m.on('click', function(){ window.ReactNativeWebView.postMessage(JSON.stringify({type:'markerClick',place:place})); });
    placeMarkers.push(m);
  });
}

function clearRoute() {
  if (routeGlow)  { map.removeLayer(routeGlow);  routeGlow  = null; }
  if (routeLine)  { map.removeLayer(routeLine);  routeLine  = null; }
  if (destMarker) { map.removeLayer(destMarker); destMarker = null; }
}

function handleMsg(event) {
  try {
    var d = JSON.parse(event.data);
    if (d.type === 'updateUserLocation') {
      userMarker.setLatLng([d.lat, d.lng]);
    } else if (d.type === 'centerOnUser') {
      var lat = d.lat; var lng = d.lng;
      map.setView([lat, lng], 15, {animate:true});
      // Restrict panning to 15 km bounding box
      var latOff = 0.137; var lngOff = 0.153;
      map.setMaxBounds([[lat - latOff, lng - lngOff],[lat + latOff, lng + lngOff]]);
      // Draw / update dashed 15 km radius circle
      if (radiusCircle) map.removeLayer(radiusCircle);
      radiusCircle = L.circle([lat, lng], {
        radius: 15000,
        color: '#054823',
        weight: 1.5,
        opacity: 0.35,
        fillColor: '#054823',
        fillOpacity: 0.04,
        dashArray: '8 6',
        interactive: false
      }).addTo(map);
    } else if (d.type === 'setPlaces') {
      renderPlaces(d.places, currentFilter);
    } else if (d.type === 'selectPlace') {
      map.setView([d.place.lat, d.place.lng], 17, {animate:true});
    } else if (d.type === 'filterPlaces') {
      currentFilter = d.filter;
      renderPlaces(d.places, currentFilter);
    } else if (d.type === 'showRoute') {
      clearRoute();
      var coords = d.coords.map(function(c){ return [c[1], c[0]]; });
      routeGlow = L.polyline(coords, {color:'rgba(0,122,255,0.22)',weight:14,lineCap:'round',lineJoin:'round'}).addTo(map);
      routeLine = L.polyline(coords, {color:'#007AFF',weight:5,opacity:0.92,lineCap:'round',lineJoin:'round'}).addTo(map);
      var dest = coords[coords.length - 1];
      destMarker = L.marker(dest, {
        icon: L.divIcon({
          className:'',
          html:'<div style="width:22px;height:22px;background:#FF3B30;border:3px solid white;border-radius:50%;box-shadow:0 0 14px rgba(255,59,48,.75);"></div>',
          iconSize:[22,22],iconAnchor:[11,11]
        }),
        zIndexOffset:8000
      }).addTo(map);
      map.fitBounds(routeLine.getBounds(), {padding:[80,80]});
    } else if (d.type === 'clearRoute') {
      clearRoute();
    }
  } catch(e){ console.error(e); }
}
window.addEventListener('message', handleMsg);
document.addEventListener('message', handleMsg);
</script>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MapScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const { places: allPlaces, loading, fetchPlaces } = useMapStore();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [dropdownMode, setDropdownMode] = useState<null | 'category' | 'search'>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [locationGranted, setLocationGranted] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const latestLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastPlacesLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const mapReadyRef = useRef(false);
  const pendingLoc = useRef<{ lat: number; lng: number } | null>(null);
  // Mutex: prevent concurrent fetches from stomping each other
  const isFetchingRef = useRef(false);
  // Mirror of allPlaces in a ref so handleWebViewLoad always sees latest data
  const allPlacesRef = useRef<Place[]>([]);

  useEffect(() => {
    allPlacesRef.current = allPlaces;
  }, [allPlaces]);

  const post = (msg: object) => { webViewRef.current?.postMessage(JSON.stringify(msg)); };

  // ── Location init ────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const fallback = { lat: 27.7042, lng: 85.318 };
        if (mounted) { latestLocRef.current = fallback; handleLocationResolved(fallback); }
        return;
      }
      if (mounted) setLocationGranted(true);

      let initial = await Location.getLastKnownPositionAsync({});
      let loc = initial ? { lat: initial.coords.latitude, lng: initial.coords.longitude } : null;

      if (!loc) {
        try {
          const current = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            new Promise<null>((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
          ]);
          if (current) loc = { lat: current.coords.latitude, lng: current.coords.longitude };
        } catch { console.warn('[Map] location resolve failed, using fallback'); }
      }

      if (!loc) loc = { lat: 27.7042, lng: 85.318 };
      if (mounted) { latestLocRef.current = loc; handleLocationResolved(loc); }

      watcherRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 15 },
        (pos) => {
          const upd = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          latestLocRef.current = upd;
          post({ type: 'updateUserLocation', lat: upd.lat, lng: upd.lng });
          handleLocationResolved(upd);
          // Silently update user location in backend database if logged in
          try {
            const authStore = require('../../stores/authStore');
            if (authStore && authStore.useAuthStore) {
              authStore.useAuthStore.getState().updateUserLocation(upd.lat, upd.lng).catch(() => {});
            }
          } catch (e) {
            console.warn('Failed to dynamically resolve useAuthStore inside location watcher:', e);
          }
        },
      );
    })();
    return () => { mounted = false; watcherRef.current?.remove(); };
  }, []);

  // Listen to store updates for places and post them to WebView
  useEffect(() => {
    if (mapReadyRef.current) {
      post({ type: 'setPlaces', places: allPlaces });
    }
  }, [allPlaces]);

  // ── Fetch places (mutex-guarded) ─────────────────────────────────────────
  const handleLocationResolved = async (loc: { lat: number; lng: number }, force = false) => {
    // Movement dedup: skip unless user moved ~100 m
    if (!force && lastPlacesLocRef.current) {
      const latDiff = Math.abs(lastPlacesLocRef.current.lat - loc.lat);
      const lngDiff = Math.abs(lastPlacesLocRef.current.lng - loc.lng);
      if (latDiff < 0.0009 && lngDiff < 0.0009) return;
    }
    // Mutex: skip if already fetching (prevents concurrent stomps)
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    lastPlacesLocRef.current = loc;
    try {
      await fetchPlaces(loc.lat, loc.lng);

      if (mapReadyRef.current) {
        post({ type: 'centerOnUser', ...loc });
      } else {
        pendingLoc.current = loc;
      }
    } finally {
      isFetchingRef.current = false;
    }
  };

  const handleWebViewLoad = () => {
    mapReadyRef.current = true;
    const loc = latestLocRef.current || pendingLoc.current;
    if (loc) {
      post({ type: 'centerOnUser', ...loc });
      post({ type: 'setPlaces', places: allPlacesRef.current });
      pendingLoc.current = null;
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') {
        setSelectedPlace(data.place);
        setNavigating(false);
        setRouteInfo(null);
        post({ type: 'clearRoute' });
      }
    } catch { }
  };

  // ── Category filter ──────────────────────────────────────────────────────
  const handlePickCategory = (filter: FilterType) => {
    setActiveFilter(filter);
    setSelectedPlace(null);
    setDropdownMode(null);
    setSearchQuery('');
    setNavigating(false);
    setRouteInfo(null);
    post({ type: 'filterPlaces', filter, places: allPlaces });
    post({ type: 'clearRoute' });
  };

  // ── Search ───────────────────────────────────────────────────────────────
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) { setFilteredPlaces([]); setDropdownMode(null); return; }
    const q = text.toLowerCase();
    const pool = activeFilter === 'all' ? allPlaces : allPlaces.filter(p => p.category === activeFilter);
    setFilteredPlaces(pool.filter(p => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)));
    setDropdownMode('search');
  };

  const handleSelectPlace = (place: Place) => {
    setSelectedPlace(place);
    setSearchQuery(place.name);
    setDropdownMode(null);
    setNavigating(false);
    setRouteInfo(null);
    post({ type: 'selectPlace', place });
    post({ type: 'clearRoute' });
  };

  const handleRecenter = () => { const loc = latestLocRef.current; if (loc) post({ type: 'centerOnUser', ...loc }); };

  const handleRefresh = () => {
    const loc = latestLocRef.current;
    if (loc) { lastPlacesLocRef.current = null; handleLocationResolved(loc, true); }
  };

  // ── Navigation ───────────────────────────────────────────────────────────
  const handleNavigate = async (place: Place) => {
    const userLoc = latestLocRef.current;
    if (!userLoc) return;

    setRouteLoading(true);
    post({ type: 'selectPlace', place });

    try {
      const url =
        `https://router.project-osrm.org/route/v1/foot/` +
        `${userLoc.lng},${userLoc.lat};${place.lng},${place.lat}` +
        `?overview=full&geometries=geojson&steps=false`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) throw new Error('OSRM error');
      const data = await res.json();

      if (data.code === 'Ok' && data.routes?.length > 0) {
        const route = data.routes[0];
        const distM: number = route.distance;
        const durS: number = route.duration;
        const durStr =
          durS < 3600
            ? `${Math.round(durS / 60)} min`
            : `${Math.floor(durS / 3600)}h ${Math.round((durS % 3600) / 60)}m`;

        setRouteInfo({ distance: fmtDist(distM), duration: durStr, destination: place.name });
        setNavigating(true);
        post({ type: 'showRoute', coords: route.geometry.coordinates });
      } else {
        openInMaps(place);
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') console.warn('[OSRM] Route failed:', e);
      openInMaps(place);
    } finally {
      setRouteLoading(false);
    }
  };

  const openInMaps = (place: Place) => {
    const userLoc = latestLocRef.current;
    const origin = userLoc ? `${userLoc.lat},${userLoc.lng}` : '';
    const dest = `${place.lat},${place.lng}`;
    if (Platform.OS === 'ios') {
      Linking.openURL(`maps://app?saddr=${origin}&daddr=${dest}&dirflg=w`).catch(() =>
        Linking.openURL(`https://maps.google.com/maps?saddr=${origin}&daddr=${dest}&dirflg=w`)
      );
    } else {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=walking`
      );
    }
  };

  const handleStopNavigation = () => {
    setNavigating(false);
    setRouteInfo(null);
    post({ type: 'clearRoute' });
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const counts = {
    hospital: allPlaces.filter(p => p.category === 'hospital').length,
    government: allPlaces.filter(p => p.category === 'government').length,
    police: allPlaces.filter(p => p.category === 'police').length,
  };
  const catConfig = selectedPlace ? CATEGORY_CONFIG[selectedPlace.category] : null;
  const mapHtml = buildMapHtml(
    latestLocRef.current?.lat ?? 27.7042,
    latestLocRef.current?.lng ?? 85.318,
  );

  const t = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={handleMessage}
        onLoad={handleWebViewLoad}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit={false}
        originWhitelist={['*']}
      />



      {/* ── Search bar + dropdowns ────────────────────────────────────────── */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBar, { backgroundColor: t.card }]}>
          <Ionicons name="search" size={18} color={t.iconColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: t.text }]}
            placeholder={
              activeFilter === 'all'
                ? 'Search important places...'
                : `Search ${CATEGORY_CONFIG[activeFilter as PlaceCategory]?.label}...`
            }
            placeholderTextColor={t.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => { if (searchQuery.trim()) setDropdownMode('search'); }}
          />
          {loading ? (
            <ActivityIndicator size="small" color={t.iconColor} style={{ marginRight: 12 }} />
          ) : (
            <TouchableOpacity
              style={[
                styles.categoryBtn,
                activeFilter !== 'all' && { backgroundColor: CATEGORY_CONFIG[activeFilter as PlaceCategory]?.color },
              ]}
              onPress={() => setDropdownMode(d => d === 'category' ? null : 'category')}
            >
              <Text style={styles.categoryBtnText} numberOfLines={1}>
                {activeFilter === 'all' ? 'All' : CATEGORY_CONFIG[activeFilter as PlaceCategory]?.label}
              </Text>
              <Ionicons name={dropdownMode === 'category' ? 'chevron-up' : 'chevron-down'} size={13} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {dropdownMode === 'category' && (
          <View style={[styles.dropdown, { backgroundColor: t.card }]}>
            {FILTER_OPTIONS.map(opt => {
              const cfg = opt.key !== 'all' ? CATEGORY_CONFIG[opt.key as PlaceCategory] : null;
              const count = opt.key !== 'all' ? counts[opt.key as PlaceCategory] : allPlaces.length;
              const active = activeFilter === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.catPickerRow, { borderBottomColor: t.divider }, active && { backgroundColor: t.isDark ? t.primaryBg : (cfg?.bg ?? '#E8F5E9') }]}
                  onPress={() => handlePickCategory(opt.key)}
                >
                  <View style={[styles.catPickerIcon, { backgroundColor: t.isDark ? t.primaryBg : (cfg?.bg ?? '#E8F5E9') }]}>
                    {opt.key === 'all'
                      ? <Ionicons name="grid" size={15} color={t.iconColor} />
                      : <FontAwesome5 name={cfg!.icon} size={13} color={cfg!.color} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.catPickerLabel, { color: t.text }, active && { color: cfg?.color ?? t.iconColor, fontWeight: '700' }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.catPickerCount, { color: t.textMuted }]}>{count} {count === 1 ? 'place' : 'places'} nearby</Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={20} color={cfg?.color ?? t.iconColor} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {dropdownMode === 'search' && filteredPlaces.length > 0 && (
          <View style={[styles.dropdown, { backgroundColor: t.card }]}>
            <FlatList
              data={filteredPlaces}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const cfg = CATEGORY_CONFIG[item.category];
                return (
                  <TouchableOpacity style={[styles.resultRow, { borderBottomColor: t.divider }]} onPress={() => handleSelectPlace(item)}>
                    <View style={[styles.resultIcon, { backgroundColor: t.isDark ? t.primaryBg : cfg.bg }]}>
                      <FontAwesome5 name={cfg.icon} size={13} color={cfg.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultName, { color: t.text }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.resultSub, { color: t.textMuted }]} numberOfLines={1}>
                        {cfg.label}{item.address ? ` · ${item.address}` : ''}
                      </Text>
                    </View>
                    <Text style={[styles.resultDist, { color: cfg.color }]}>{item.distance}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {dropdownMode === 'search' && searchQuery.trim() !== '' && filteredPlaces.length === 0 && (
          <View style={[styles.dropdown, { backgroundColor: t.card, padding: 20, alignItems: 'center' }]}>
            <Ionicons name="search-outline" size={26} color={t.textMuted} />
            <Text style={{ color: t.textMuted, marginTop: 6, fontSize: 13 }}>No results found</Text>
          </View>
        )}
      </View>

      {/* ── Map controls ─────────────────────────────────────────────────── */}
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: t.card }]} onPress={handleRecenter}>
          <MaterialIcons name="my-location" size={22} color={t.iconColor} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: t.card }]} onPress={handleRefresh}>
          <MaterialIcons name={loading ? 'hourglass-empty' : 'refresh'} size={22} color={t.iconColor} />
        </TouchableOpacity>
      </View>

      {/* ── Navigation panel ─────────────────────────────────────────────── */}
      {navigating && routeInfo && (
        <View style={styles.navPanel}>
          <View style={styles.navAccent} />
          <View style={styles.navContent}>
            <View style={styles.navTopRow}>
              <View style={styles.navIcon}>
                <Ionicons name="navigate" size={18} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.navDestLabel} numberOfLines={1}>{routeInfo.destination}</Text>
                <Text style={styles.navSubLabel}>Walking directions</Text>
              </View>
              <TouchableOpacity style={styles.stopBtn} onPress={handleStopNavigation}>
                <Ionicons name="close" size={18} color="#FF3B30" />
              </TouchableOpacity>
            </View>

            <View style={styles.navStatsRow}>
              <View style={styles.navStat}>
                <Text style={styles.navStatValue}>{routeInfo.distance}</Text>
                <Text style={styles.navStatLabel}>Distance</Text>
              </View>
              <View style={styles.navDivider} />
              <View style={styles.navStat}>
                <Text style={styles.navStatValue}>{routeInfo.duration}</Text>
                <Text style={styles.navStatLabel}>Walk time</Text>
              </View>
              <View style={styles.navDivider} />
              <TouchableOpacity
                style={styles.openMapsBtn}
                onPress={() => selectedPlace && openInMaps(selectedPlace)}
              >
                <MaterialIcons name="open-in-new" size={15} color="white" />
                <Text style={styles.openMapsBtnText}>Open Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ── Bottom info card ──────────────────────────────────────────────── */}
      {!navigating && (
        <View style={styles.cardWrapper}>
          <View style={[styles.card, { backgroundColor: t.card }]}>
            <View style={[styles.cardIcon, { backgroundColor: catConfig ? (t.isDark ? t.primaryBg : catConfig.bg) : t.primaryBg }]}>
              {catConfig
                ? <FontAwesome5 name={catConfig.icon} size={22} color={catConfig.color} />
                : <Ionicons name="location" size={24} color={t.iconColor} />}
            </View>
            <View style={styles.cardBody}>
              {selectedPlace ? (
                <>
                  <View style={styles.badgeRow}>
                    <Text style={[styles.badge, { backgroundColor: t.isDark ? t.primaryBg : catConfig?.bg, color: catConfig?.color }]}>
                      {catConfig?.label?.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: t.text }]} numberOfLines={1}>{selectedPlace.name}</Text>
                  {!!selectedPlace.address && (
                    <Text style={[styles.cardSub, { color: t.textMuted }]} numberOfLines={1}>{selectedPlace.address}</Text>
                  )}
                  <View style={styles.cardMeta}>
                    <Text style={[styles.cardDist, { color: catConfig?.color ?? t.iconColor }]}>
                      {selectedPlace.distance} away
                    </Text>
                    {!!selectedPlace.phone && (
                      <><Text style={[styles.dot, { color: t.divider }]}>·</Text><Text style={[styles.cardPhone, { color: t.textMuted }]}>{selectedPlace.phone}</Text></>
                    )}
                  </View>

                  {/* Action buttons */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.navBtn, { backgroundColor: catConfig?.color ?? t.primary }]}
                      onPress={() => handleNavigate(selectedPlace)}
                      disabled={routeLoading}
                    >
                      {routeLoading
                        ? <ActivityIndicator size="small" color="white" />
                        : <Ionicons name="navigate" size={15} color="white" />}
                      <Text style={styles.navBtnText}>{routeLoading ? 'Routing…' : 'Navigate'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.mapsBtn, { backgroundColor: t.primaryBg, borderColor: t.isDark ? t.primaryBgLight : '#C8E6C9' }]}
                      onPress={() => openInMaps(selectedPlace)}
                    >
                      <MaterialIcons name="map" size={15} color={t.iconColor} />
                      <Text style={[styles.mapsBtnText, { color: t.iconColor }]}>Open Maps</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.cardTitle, { color: t.text }]}>{allPlaces.length} places found nearby</Text>
                  <Text style={[styles.cardSub, { color: t.textMuted }]}>
                    {`${counts.hospital} hospitals · ${counts.government} gov offices · ${counts.police} police`}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  map: { flex: 1 },

  headerContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#054823',
    justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#054823' },
  gpsHeaderButton: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'white',
    justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },

  searchWrapper: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 54 : 60,
    left: 16, right: 16, zIndex: 11,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    borderRadius: 30, paddingLeft: 14, paddingRight: 6, height: 52,
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 6,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: '100%', fontSize: 14, color: '#333' },
  categoryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, height: 40, borderRadius: 20,
    backgroundColor: '#054823', minWidth: 58,
  },
  categoryBtnText: { color: 'white', fontSize: 12, fontWeight: '700', maxWidth: 76 },

  dropdown: {
    backgroundColor: 'white', borderRadius: 20, marginTop: 8,
    maxHeight: 260, overflow: 'hidden',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8,
  },
  catPickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f3f3',
  },
  catPickerIcon: {
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
  },
  catPickerLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  catPickerCount: { fontSize: 11, color: '#999', marginTop: 1 },

  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  resultIcon: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  resultName: { fontSize: 13, fontWeight: '600', color: '#333' },
  resultSub: { fontSize: 11, color: '#888', marginTop: 1 },
  resultDist: { fontSize: 12, fontWeight: 'bold', marginLeft: 6 },

  controls: {
    position: 'absolute', right: 16,
    bottom: Platform.OS === 'ios' ? 240 : 210,
    zIndex: 10, gap: 10,
  },
  controlBtn: {
    width: 50, height: 50, borderRadius: 16, backgroundColor: 'white',
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6,
  },

  // Navigation panel
  navPanel: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 90,
    left: 12, right: 12, zIndex: 10,
    backgroundColor: '#0d1117',
    borderRadius: 22,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14,
  },
  navAccent: { width: 5, backgroundColor: '#007AFF' },
  navContent: { flex: 1, paddingHorizontal: 16, paddingVertical: 14 },
  navTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  navIcon: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#007AFF',
    justifyContent: 'center', alignItems: 'center',
  },
  navDestLabel: { fontSize: 14, fontWeight: '700', color: 'white' },
  navSubLabel: { fontSize: 11, color: '#8a8f98', marginTop: 1 },
  stopBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,59,48,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  navStatsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1c2230', borderRadius: 14, padding: 12,
  },
  navStat: { flex: 1, alignItems: 'center' },
  navStatValue: { fontSize: 16, fontWeight: '800', color: 'white' },
  navStatLabel: { fontSize: 10, color: '#8a8f98', marginTop: 1 },
  navDivider: { width: 1, height: 32, backgroundColor: '#2a3040', marginHorizontal: 8 },
  openMapsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#007AFF', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  openMapsBtnText: { color: 'white', fontSize: 11, fontWeight: '700' },

  // Info card
  cardWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 90,
    left: 12, right: 12, zIndex: 10,
  },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'white',
    borderRadius: 24, padding: 16,
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10,
  },
  cardIcon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginRight: 14, marginTop: 2,
  },
  cardBody: { flex: 1 },
  badgeRow: { flexDirection: 'row', marginBottom: 4 },
  badge: {
    fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, overflow: 'hidden', letterSpacing: 0.5,
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 2 },
  cardSub: { fontSize: 12, color: '#777' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardDist: { fontSize: 12, fontWeight: 'bold' },
  dot: { marginHorizontal: 6, color: '#ccc', fontSize: 12 },
  cardPhone: { fontSize: 12, color: '#888' },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 9, borderRadius: 14,
  },
  navBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
  mapsBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 9, borderRadius: 14,
    backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#C8E6C9',
  },
  mapsBtnText: { color: '#054823', fontSize: 13, fontWeight: '700' },
});