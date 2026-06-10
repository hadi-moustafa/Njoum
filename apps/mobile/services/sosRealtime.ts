// ============================================================
// SOS Realtime — broadcasts live GPS coordinates to Supabase
// Realtime channel `sos:{event_id}` so the tracking web page
// and the admin dashboard can show a live pin.
// ============================================================
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type SOSLocationPayload = {
  lat:       number;
  lng:       number;
  accuracy:  number;
  timestamp: number;
};

type GetLocationFn = () => Promise<SOSLocationPayload | null>;

let _channel:  RealtimeChannel | null = null;
let _interval: ReturnType<typeof setInterval> | null = null;

const BROADCAST_INTERVAL_MS = 5_000;

/** Start broadcasting location updates for an active SOS event. */
export function startSOSBroadcast(sosEventId: string, getLocation: GetLocationFn) {
  stopSOSBroadcast();

  _channel = supabase.channel(`sos:${sosEventId}`, {
    config: { broadcast: { self: false } },
  });

  _channel.subscribe((status) => {
    if (status !== 'SUBSCRIBED') return;

    // Send first update immediately
    getLocation().then((loc) => loc && _broadcast(loc));

    // Then every 5 s
    _interval = setInterval(async () => {
      const loc = await getLocation();
      if (loc) _broadcast(loc);
    }, BROADCAST_INTERVAL_MS);
  });
}

/** Stop broadcasting and leave the channel. */
export function stopSOSBroadcast() {
  if (_interval) { clearInterval(_interval); _interval = null; }
  if (_channel)  { supabase.removeChannel(_channel); _channel = null; }
}

function _broadcast(payload: SOSLocationPayload) {
  _channel?.send({ type: 'broadcast', event: 'location_update', payload });
}
