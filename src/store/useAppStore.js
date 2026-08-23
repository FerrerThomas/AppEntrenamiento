import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAppStore = create((set, get) => ({
  user: null,
  session: null,
  userProfile: null,
  authInitialized: false,

  fetchUserProfile: async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (!error && data) {
        set({ userProfile: data });
      }
    } catch (e) {
      console.error('Error fetching user profile:', e);
    }
  },

  initializeAuth: () => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, authInitialized: true });
      if (session?.user) get().fetchUserProfile(session.user.id);
    }).catch(() => {
      set({ authInitialized: true });
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, authInitialized: true });
      if (session?.user) get().fetchUserProfile(session.user.id);
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
    set({ user: null, session: null, userProfile: null });
  },

  onboardingData: {
    weight: 70,
    height: 175,
    birthDate: '',
    gym: null,
    name: '',
  },
  setOnboardingData: (data) => set((state) => ({ onboardingData: { ...state.onboardingData, ...data } })),

  workouts: [],
  fetchWorkouts: async () => {
    const user = get().user;
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('routines')
        .select(`
          id, title, type, duration_minutes,
          routine_exercises (
            id, order_index,
            exercises (id, name, muscle_group, gif_url),
            routine_sets (id, set_order, target_weight_kg, target_reps)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        const formatted = data.map(r => {
          // Ordenar los ejercicios
          const sortedExercises = [...(r.routine_exercises || [])].sort((a, b) => a.order_index - b.order_index);
          
          // Formatear cada ejercicio para inyectar sus sets ordenados
          const formattedExercises = sortedExercises.map(rx => {
            const sortedSets = [...(rx.routine_sets || [])].sort((a, b) => a.set_order - b.set_order);
            return {
              ...rx,
              sets: sortedSets // Guardamos el array de sets en vez de un número
            };
          });

          return {
            id: r.id,
            title: r.title,
            duration: `${r.duration_minutes || 45} min`,
            exercisesCount: formattedExercises.length,
            type: r.type || 'Fuerza',
            routine_exercises: formattedExercises
          };
        });
        set({ workouts: formatted });
      }
    } catch (e) {
      console.error('Error fetching workouts:', e);
    }
  },

  getPreviousWorkout: async (exerciseId) => {
    const user = get().user;
    if (!user || !exerciseId) return [];
    try {
      const { data, error } = await supabase.rpc('get_previous_workout', { 
        p_user_id: user.id, 
        p_exercise_id: exerciseId 
      });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching previous workout:', e);
      return [];
    }
  },

  activeWorkout: null,
  activeWorkoutSets: null,
  startWorkout: (workout) => set({ activeWorkout: { ...workout, startTime: Date.now() }, activeWorkoutSets: null }),
  finishWorkout: () => set({ activeWorkout: null, activeWorkoutSets: null }),
  cancelWorkout: () => set({ activeWorkout: null, activeWorkoutSets: null }),
  setActiveWorkoutSets: (setsOrUpdater) => set((state) => ({
    activeWorkoutSets: typeof setsOrUpdater === 'function' 
      ? setsOrUpdater(state.activeWorkoutSets) 
      : setsOrUpdater
  })),

  rankings: [
    { id: 1, name: 'Marcos P.', weight: '120kg', trend: 'up', position: 1, avatar: 'https://i.pravatar.cc/150?img=11' },
    { id: 2, name: 'Tu Perfil', weight: '115kg', trend: 'up', position: 2, avatar: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=150&q=80' },
    { id: 3, name: 'Julián G.', weight: '110kg', trend: 'down', position: 3, avatar: 'https://i.pravatar.cc/150?img=12' },
    { id: 4, name: 'Andrés F.', weight: '100kg', trend: 'same', position: 4, avatar: 'https://i.pravatar.cc/150?img=13' },
  ]
}));
