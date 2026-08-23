import { create } from 'zustand';

export const useAppStore = create((set) => ({
  user: null,
  login: (email) => set({ user: { email, name: 'Atleta', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' } }),
  logout: () => set({ user: null }),

  onboardingData: {
    weight: 70,
    height: 175,
    birthDate: '',
    gym: null,
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
    { id: 2, name: 'Tu Perfil', weight: '115kg', trend: 'up', position: 2, avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
    { id: 3, name: 'Julián G.', weight: '110kg', trend: 'down', position: 3, avatar: 'https://i.pravatar.cc/150?img=12' },
    { id: 4, name: 'Andrés F.', weight: '100kg', trend: 'same', position: 4, avatar: 'https://i.pravatar.cc/150?img=13' },
  ]
}));
