'use client';
// ============================================================
// TrackingClient — subscribes to Supabase Realtime channel
// `sos:{id}` and feeds live lat/lng into the Leaflet map.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';

// Leaflet cannot run server-side — import with ssr:false
const TrackingMap = dynamic(() => import('./TrackingMap'), { ssr: false });

type Props = {
  sosEventId:  string;
  userName:    string;
  triggeredAt: string;
  status:      'active' | 'resolved' | 'cancelled';
  initialLat:  number | null;
  initialLng:  number | null;
  expiresAt:   string | null;
};

export default function TrackingClient({
  sosEventId, userName, triggeredAt, status: initialStatus,
  initialLat, initialLng, expiresAt,
}: Props) {
  const [status, setStatus]         = useState(initialStatus);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [coords, setCoords]         = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null,
  );
  const mapUpdateRef = useRef<((lat: number, lng: number) => void) | null>(null);

  useEffect(() => {
    if (status !== 'active') return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const channel = supabase
      .channel(`sos:${sosEventId}`)
      .on('broadcast', { event: 'location_update' }, ({ payload }) => {
        const { lat, lng } = payload as { lat: number; lng: number };
        setCoords({ lat, lng });
        setLastUpdate(new Date());
        mapUpdateRef.current?.(lat, lng);
      })
      // Listen for resolve/cancel events from the SOS holder
      .on('broadcast', { event: 'sos_resolved' },  () => setStatus('resolved'))
      .on('broadcast', { event: 'sos_cancelled' }, () => setStatus('cancelled'))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sosEventId, status]);

  const elapsed = Math.floor((Date.now() - new Date(triggeredAt).getTime()) / 1000 / 60);

  const statusConfig = {
    active:    { label: 'نشط',   bg: 'bg-red-100',   text: 'text-red-700',   dot: 'bg-red-500 animate-pulse' },
    resolved:  { label: 'محلول', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    cancelled: { label: 'ملغى',  bg: 'bg-gray-100',  text: 'text-gray-600',  dot: 'bg-gray-400' },
  };
  const s = statusConfig[status];

  return (
    <div className="min-h-screen bg-[#FDF6F0] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-njoum-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            ★
          </div>
          <div>
            <p className="font-bold text-njoum-text text-sm">تتبع نداء الاستغاثة — نجوم</p>
            <p className="text-xs text-njoum-muted">مشاركة موقع طارئ</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} inline-block`} />
          {s.label}
        </span>
      </div>

      {/* Info strip */}
      <div className="bg-red-50 border-b border-red-100 px-6 py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-red-800 font-medium">المستخدمة: <strong>{userName}</strong></span>
        <span className="text-red-700">قبل {elapsed} دقيقة</span>
        {lastUpdate && (
          <span className="text-red-600 text-xs">
            آخر تحديث: {lastUpdate.toLocaleTimeString('ar-LB')}
          </span>
        )}
        {coords && (
          <span className="text-red-600 text-xs font-mono">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
        )}
        {coords && (
          <a
            href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-red-700 text-white text-xs font-semibold hover:bg-red-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.099 3.5-4.599 3.5-7.327 0-4.543-3.69-8.25-8.25-8.25S3.75 5.457 3.75 10c0 2.728 1.556 5.228 3.5 7.327a19.58 19.58 0 002.683 2.282 16.975 16.975 0 001.144.742zM12 13.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" clipRule="evenodd" />
            </svg>
            فتح في خرائط Google
          </a>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: 400 }}>
        {status === 'active' ? (
          <TrackingMap
            initialLat={initialLat}
            initialLng={initialLng}
            onReady={(fn) => { mapUpdateRef.current = fn; }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
            {status === 'resolved' ? (
              <>
                <p className="text-5xl mb-3">✅</p>
                <p className="text-lg font-bold text-green-700">المستخدمة بأمان</p>
                <p className="text-sm text-gray-500 mt-1">تم إنهاء نداء الاستغاثة</p>
              </>
            ) : (
              <>
                <p className="text-5xl mb-3">❌</p>
                <p className="text-lg font-bold text-gray-600">تم إلغاء نداء الاستغاثة</p>
              </>
            )}
          </div>
        )}

        {status === 'active' && !coords && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-njoum-muted">في انتظار إشارة GPS...</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-njoum-border px-6 py-3 text-center">
        <p className="text-xs text-njoum-muted">
          هذا الرابط صالح لـ 60 دقيقة · نجوم — تطبيق الأمان للفتيات
        </p>
        {expiresAt && (
          <p className="text-xs text-njoum-muted mt-0.5">
            ينتهي: {new Date(expiresAt).toLocaleTimeString('ar-LB')}
          </p>
        )}
      </div>
    </div>
  );
}
