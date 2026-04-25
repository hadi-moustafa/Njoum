// ============================================================
// Auth Store (Zustand)
// Tracks Supabase session + synced user profile from our DB.
// ============================================================
import { create } from 'zustand';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole } from '@njoum/shared';
import { supabase } from '../services/supabase';
import { api } from '../services/api';

interface AuthState {
  session:     Session | null;
  supaUser:    SupabaseUser | null;
  profile:     User | null;
  isLoading:   boolean;
  isReady:     boolean;   // true once initial session check is done

  setSession:  (session: Session | null) => void;
  loadProfile: () => Promise<void>;
  signOut:     () => Promise<void>;
  role:        () => UserRole;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session:   null,
  supaUser:  null,
  profile:   null,
  isLoading: false,
  isReady:   false,

  setSession(session) {
    set({
      session,
      supaUser: session?.user ?? null,
      isReady:  true,
    });
  },

  async loadProfile() {
    set({ isLoading: true });
    try {
      const res = await api.get<User>('/users/me');
      if (res.success && res.data) {
        set({ profile: res.data });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  async signOut() {
    await supabase.auth.signOut();
    set({ session: null, supaUser: null, profile: null });
  },

  role() {
    // Role comes from app_metadata in the JWT
    const meta = get().supaUser?.app_metadata as { role?: UserRole } | undefined;
    return meta?.role ?? 'girl';
  },
}));
