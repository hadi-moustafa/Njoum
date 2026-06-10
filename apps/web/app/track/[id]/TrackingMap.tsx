'use client';
// ============================================================
// TrackingMap — Leaflet map that receives live lat/lng updates.
// Dynamically imported (ssr:false) to avoid Next.js SSR crash.
// ============================================================
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon broken by Webpack asset hashing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type Props = {
  initialLat: number | null;
  initialLng: number | null;
  onReady:    (update: (lat: number, lng: number) => void) => void;
};

export default function TrackingMap({ initialLat, initialLng, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markerRef    = useRef<L.Marker | null>(null);
  const circleRef    = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultLat = initialLat ?? 33.8938; // Beirut fallback
    const defaultLng = initialLng ?? 35.5018;

    const map = L.map(containerRef.current, { zoomControl: true }).setView(
      [defaultLat, defaultLng],
      initialLat ? 15 : 6,
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    if (initialLat && initialLng) {
      markerRef.current = L.marker([initialLat, initialLng])
        .addTo(map)
        .bindPopup('آخر موقع معروف')
        .openPopup();
      circleRef.current = L.circle([initialLat, initialLng], { radius: 50, color: '#B5586A', fillOpacity: 0.15 }).addTo(map);
    }

    mapRef.current = map;

    // Expose an update function to the parent
    onReady((lat: number, lng: number) => {
      const latlng: L.LatLngExpression = [lat, lng];

      if (markerRef.current) {
        markerRef.current.setLatLng(latlng);
      } else {
        markerRef.current = L.marker(latlng).addTo(map).bindPopup('الموقع الحالي').openPopup();
      }

      if (circleRef.current) {
        circleRef.current.setLatLng(latlng);
      } else {
        circleRef.current = L.circle(latlng, { radius: 50, color: '#B5586A', fillOpacity: 0.15 }).addTo(map);
      }

      map.panTo(latlng);
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
