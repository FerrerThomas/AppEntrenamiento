import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAppStore = create((set, get) => ({
  user: null,
  session: null,
  authInitialized: false,

  initializeAuth: () => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, authInitialized: true });
    }).catch(() => {
      set({ authInitialized: true });
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, authInitialized: true });
    });
  },

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/onboarding/1'
      }
    });
    if (error) throw error;
  },

  loginWithEmail: async (email, password) => {
    // Dummy login just to proceed without actual auth if Supabase isn't configured yet
    // To use real auth: await supabase.auth.signInWithPassword({ email, password })
    if (email) {
      set({ user: { email, name: 'Atleta' } });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  onboardingData: {
    weight: 70,
    height: 175,
    birthDate: '',
    gym: null,
    name: '',
  },
  setOnboardingData: (data) => set((state) => ({ onboardingData: { ...state.onboardingData, ...data } })),

  workouts: [
    { id: 1, title: 'Pecho y Tríceps', duration: '45 min', exercises: 5, type: 'Fuerza' },
    { id: 2, title: 'Pierna Completa', duration: '60 min', exercises: 6, type: 'Fuerza' },
    { id: 3, title: 'HIIT Cardio', duration: '20 min', exercises: 4, type: 'Cardio' },
  ],

  activeWorkout: null,
  startWorkout: (workout) => set({ activeWorkout: { ...workout, startTime: Date.now() } }),
  finishWorkout: () => set({ activeWorkout: null }),

  rankings: [
    { id: 1, name: 'Marcos P.', weight: '120kg', trend: 'up', position: 1, avatar: 'https://i.pravatar.cc/150?img=11' },
    { id: 2, name: 'Tu Perfil', weight: '115kg', trend: 'up', position: 2, avatar: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=150&q=80' },
    { id: 3, name: 'Julián G.', weight: '110kg', trend: 'down', position: 3, avatar: 'https://i.pravatar.cc/150?img=12' },
    { id: 4, name: 'Andrés F.', weight: '100kg', trend: 'same', position: 4, avatar: 'https://i.pravatar.cc/150?img=13' },
  ]
}));
