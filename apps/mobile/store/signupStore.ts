import { create } from 'zustand';

interface SignupStore {
  email:     string;
  password:  string; // cleared immediately after first sign-in
  full_name: string;
  age_range: string;
  country:   string;
  role:      'girl' | 'parent' | 'mentor';
  safe_word: string;
  set:   (data: Partial<Omit<SignupStore, 'set' | 'clear'>>) => void;
  clear: () => void;
}

export const useSignupStore = create<SignupStore>((set) => ({
  email:     '',
  password:  '',
  full_name: '',
  age_range: '',
  country:   '',
  role:      'girl',
  safe_word: '',
  set:   (data) => set((s) => ({ ...s, ...data })),
  clear: ()   => set({ email: '', password: '', full_name: '', age_range: '', country: '', role: 'girl', safe_word: '' }),
}));
