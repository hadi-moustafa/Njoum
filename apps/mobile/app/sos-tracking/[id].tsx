// ============================================================
// SOS Live Tracking Screen
//
// Uses a WebView with Leaflet.js + OpenStreetMap tiles.
// 100% free — no API key required.
//
// Subscribes to Supabase Realtime channel `sos:{id}`.
// Location updates arrive every 5 s from SOSButton broadcast.
// The map marker moves smoothly to each new position.
//
// "I'm Safe" button is only shown to the SOS sender (isSelf).
// ============================================================
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView }      from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { api }     from '../../services/api';
import type { SOSLocationPayload } from '../../services/sosRealtime';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../../constants/theme';

// ── Build the Leaflet HTML injected into the WebView ──────────
function buildLeafletHTML(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 16);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  var redIcon = L.divIcon({
    className: '',
    html: '<div style="width:18px;height:18px;background:#E53E3E;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(229,62,62,0.8);"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  var marker = L.marker([${lat}, ${lng}], { icon: redIcon })
    .addTo(map)
    .bindPopup('موقعكِ الحالي')
    .openPopup();

  // Receive location updates from React Native
  function updateLocation(lat, lng) {
    marker.setLatLng([lat, lng]);
    map.panTo([lat, lng], { animate: true, duration: 0.8 });
  }
</script>
</body>
</html>`;
}

// ── Default centre: Beirut ─────────────────────────────────────
const DEFAULT_LAT = 33.8938;
const DEFAULT_LNG = 35.5018;

export default function SOSTrackingScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const webRef  = useRef<WebView>(null);

  const [initialLat,  setInitialLat]  = useState(DEFAULT_LAT);
  const [initialLng,  setInitialLng]  = useState(DEFAULT_LNG);
  const [mapReady,    setMapReady]    = useState(false);
  const [location,    setLocation]    = useState<SOSLocationPayload | null>(null);
  const [isSelf,      setIsSelf]      = useState(false);
  const [resolving,   setResolving]   = useState(false);
  const [lastUpdate,  setLastUpdate]  = useState('');
  const [signalAge,   setSignalAge]   = useState(0);

  // ── Load initial DB state ────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const { data: event } = await supabase
        .from('sos_events')
        .select('user_id, lat, lng, created_at')
        .eq('id', id)
        .single();

      if (!event) return;
      if (user) setIsSelf(event.user_id === user.id);

      if (event.lat && event.lng) {
        setInitialLat(event.lat);
        setInitialLng(event.lng);
        setLocation({ lat: event.lat, lng: event.lng, accuracy: 0, timestamp: Date.now() });
      }
    });
  }, [id]);

  // ── Supabase Realtime subscription ──────────────────────────
  useEffect(() => {
    if (!id) return;

    const channel = supabase.channel(`sos:${id}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on('broadcast', { event: 'location_update' }, ({ payload }) => {
        const loc = payload as SOSLocationPayload;
        setLocation(loc);
        setLastUpdate(
          new Date(loc.timestamp).toLocaleTimeString('ar-LB', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
          })
        );
        setSignalAge(0);

        // Push coordinates into the Leaflet map via injected JS
        webRef.current?.injectJavaScript(
          `updateLocation(${loc.lat}, ${loc.lng}); true;`
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // ── Signal age counter ───────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setSignalAge(a => a + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Resolve SOS ──────────────────────────────────────────────
  const handleMarkSafe = () => {
    Alert.alert(
      'أنتِ بأمان؟',
      'سيتم إغلاق نداء الاستغاثة وإخبار جهات الاتصال.',
      [
        { text: 'لا، رجوع', style: 'cancel' },
        {
          text: 'نعم، أنا بأمان',
          onPress: async () => {
            setResolving(true);
            await api.patch(`/sos/${id}/resolve`, {});
            setResolving(false);
            Alert.alert('بأمان ✓', 'تم إبلاغ جهات الاتصال.');
            router.back();
          },
        },
      ]
    );
  };

  // ── Signal freshness colour ──────────────────────────────────
  const signalColor = signalAge < 10 ? Colors.success
                    : signalAge < 30 ? Colors.warning
                    : Colors.emergency;

  const signalLabel = signalAge < 10
    ? `📡 حي — آخر تحديث ${lastUpdate || 'الآن'}`
    : signalAge < 60
    ? `⚠️ آخر إشارة منذ ${signalAge} ث`
    : `❌ انقطعت الإشارة (${Math.floor(signalAge / 60)} د)`;

  const html = buildLeafletHTML(initialLat, initialLng);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.sosIndicator} />
          <Text style={styles.headerTitle}>نداء استغاثة نشط</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* OpenStreetMap via Leaflet WebView */}
      <View style={styles.mapWrap}>
        <WebView
          ref={webRef}
          source={{ html }}
          style={styles.map}
          onLoad={() => setMapReady(true)}
          javaScriptEnabled
          domStorageEnabled
          // Allow loading leaflet from unpkg CDN
          mixedContentMode="always"
          originWhitelist={['*']}
        />

        {!mapReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={Colors.emergency} size="large" />
            <Text style={styles.loadingText}>جارٍ تحميل الخريطة…</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.signalBadge, { backgroundColor: signalColor + '18', borderColor: signalColor }]}>
          <Text style={[styles.signalText, { color: signalColor }]}>{signalLabel}</Text>
        </View>

        {location && (
          <Text style={styles.coords}>
            {location.lat.toFixed(6)},  {location.lng.toFixed(6)}
            {location.accuracy > 0 ? `  •  ±${Math.round(location.accuracy)} م` : ''}
          </Text>
        )}

        {isSelf && (
          <Pressable
            style={({ pressed }) => [styles.safeBtn, pressed && { opacity: 0.85 }]}
            onPress={handleMarkSafe}
            disabled={resolving}
          >
            {resolving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.safeBtnText}>✓  أنا بأمان الآن</Text>
            }
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0005' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#0D0005',
    borderBottomWidth: 1,
    borderBottomColor: Colors.emergency + '40',
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  backText: { color: '#fff', fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sosIndicator: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.emergency,
  },
  headerTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },

  mapWrap: { flex: 1, position: 'relative' },
  map: { flex: 1 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: { color: '#fff', fontSize: FontSize.md },

  footer: {
    backgroundColor: '#0D0005',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.emergency + '30',
  },
  signalBadge: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    alignSelf: 'flex-start',
  },
  signalText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  coords: {
    color: '#8A8090',
    fontSize: FontSize.xs,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  safeBtn: {
    backgroundColor: Colors.success,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...Shadow.md,
  },
  safeBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
