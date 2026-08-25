import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAppStore = create((set, get) => ({
  user: null,
  session: null,
  userProfile: null,
  lifetimeVolumeKg: 0,
  authInitialized: false,
  profileLoaded: false,

  fetchUserProfile: async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (!error && data) {
        set({ userProfile: data });
      }

      // Obtener volumen histórico total para el sistema de niveles
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('total_volume_kg')
        .eq('user_id', userId);
      
      if (sessions) {
        const total = sessions.reduce((acc, curr) => acc + (parseFloat(curr.total_volume_kg) || 0), 0);
        set({ lifetimeVolumeKg: Math.round(total) });
      }
    } catch (e) {
      console.error('Error fetching user profile:', e);
    } finally {
      set({ profileLoaded: true });
    }
  },

  updateUserProfile: async (profileUpdates) => {
    const user = get().user;
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .update(profileUpdates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      if (data) {
        set({ userProfile: data });
      }
      return data;
    } catch (e) {
      console.error('Error updating user profile:', e);
      throw e;
    }
  },

  fetchPublicProfile: async (userId) => {
    if (!userId) return null;
    try {
      // 1. Datos básicos del usuario
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (userError) throw userError;

      // 2. Gimnasio
      let gymName = null;
      if (userRow?.gym_id) {
        const { data: gymData } = await supabase
          .from('gyms')
          .select('name')
          .eq('id', userRow.gym_id)
          .single();
        gymName = gymData?.name || null;
      }

      // 3. Estadísticas de entrenamiento (con fallback al volumen histórico consolidado)
      let totalVolume = parseFloat(userRow?.lifetime_volume_kg) || 0;
      let totalWorkouts = 0;

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('id, total_volume_kg, started_at')
        .eq('user_id', userId);

      if (sessions && sessions.length > 0) {
        totalWorkouts = sessions.length;
        const calculatedVol = sessions.reduce((acc, curr) => acc + (parseFloat(curr.total_volume_kg) || 0), 0);
        if (calculatedVol > 0) totalVolume = calculatedVol;
      }

      // 4. PRs del usuario
      let prs = [];
      try {
        prs = await get().getCurrentPRs(userId);
      } catch (err) {
        console.error('Error loading PRs for public profile:', err);
      }

      return {
        ...userRow,
        gymName,
        totalWorkouts,
        totalVolume: Math.round(totalVolume),
        lifetime_volume_kg: totalVolume,
        prs
      };
    } catch (e) {
      console.error('Error fetching public profile:', e);
      return null;
    }
  },

  // =========================================================================
  // SISTEMA DE AMIGOS Y SOLICITUDES DE SEGUIMIENTO
  // =========================================================================
  friends: [],
  friendsTraining: [],
  pendingFollowRequests: [],

  fetchFriends: async () => {
    const user = get().user;
    if (!user) return;
    try {
      // 1. Obtener solicitudes aceptadas donde el usuario participa
      const { data: requests, error } = await supabase
        .from('follow_requests')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      if (requests && requests.length > 0) {
        const friendIds = requests.map(r => r.sender_id === user.id ? r.receiver_id : r.sender_id);
        const { data: friendsData } = await supabase
          .from('users')
          .select('id, username, avatar_url, bio, instagram, gym_id, lifetime_volume_kg, current_level, prestige_rank, is_active_training, active_routine_title, active_training_started_at')
          .in('id', friendIds);

        const enrichedFriends = friendsData || [];
        set({ friends: enrichedFriends });

        // 2. Detectar amigos que están ACTIVAMENTE entrenando en vivo (is_active_training = true)
        const now = Date.now();
        const maxActiveDurationMs = 3 * 60 * 60 * 1000; // Máximo 3 horas de margen

        const trainingNow = enrichedFriends.filter(f => {
          if (!f.is_active_training) return false;
          if (!f.active_training_started_at) return true;
          const started = new Date(f.active_training_started_at).getTime();
          return (now - started) < maxActiveDurationMs;
        });

        set({ friendsTraining: trainingNow });
      } else {
        set({ friends: [], friendsTraining: [] });
      }
    } catch (e) {
      console.error('Error fetching friends:', e);
    }
  },

  fetchPendingFollowRequests: async () => {
    const user = get().user;
    if (!user) return;
    try {
      const { data: requests, error } = await supabase
        .from('follow_requests')
        .select('id, sender_id, created_at')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (requests && requests.length > 0) {
        const senderIds = requests.map(r => r.sender_id);
        const { data: senders } = await supabase
          .from('users')
          .select('id, username, avatar_url, bio, instagram')
          .in('id', senderIds);

        const mapped = requests.map(req => {
          const senderInfo = senders?.find(s => s.id === req.sender_id);
          return {
            id: req.id,
            sender_id: req.sender_id,
            created_at: req.created_at,
            sender: senderInfo || { username: 'Atleta', avatar_url: null }
          };
        });

        set({ pendingFollowRequests: mapped });
      } else {
        set({ pendingFollowRequests: [] });
      }
    } catch (e) {
      console.error('Error fetching pending follow requests:', e);
    }
  },

  // =========================================================================
  // REALTIME / SINCRONIZACIÓN EN VIVO DE ACTIVIDAD Y AMIGOS
  // =========================================================================
  subscribeToLiveSocialActivity: () => {
    const user = get().user;
    if (!user) return () => {};

    // 1. Carga inicial
    get().fetchFriends();
    get().fetchPendingFollowRequests();

    // 2. Suscripción a Realtime Channel en Supabase
    const channel = supabase
      .channel('live-social-activity')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          get().fetchFriends();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follow_requests' },
        () => {
          get().fetchFriends();
          get().fetchPendingFollowRequests();
        }
      )
      .subscribe();

    // 3. Fallback de refresco automático cada 15 segundos y al volver a la app (visibilidad)
    const intervalId = setInterval(() => {
      get().fetchFriends();
    }, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        get().fetchFriends();
        get().fetchPendingFollowRequests();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Función de limpieza al desmontar la vista
    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  },

  getFollowStatus: async (targetUserId) => {
    const user = get().user;
    if (!user || !targetUserId || user.id === targetUserId) return 'self';
    try {
      const { data, error } = await supabase
        .from('follow_requests')
        .select('id, sender_id, receiver_id, status')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
        .maybeSingle();

      if (error) throw error;
      if (!data) return 'none';

      if (data.status === 'accepted') return 'following';
      if (data.status === 'pending') {
        return data.sender_id === user.id ? 'pending_sent' : 'pending_received';
      }
      return 'none';
    } catch (e) {
      console.error('Error getting follow status:', e);
      return 'none';
    }
  },

  sendFollowRequest: async (targetUserId) => {
    const user = get().user;
    if (!user || !targetUserId) return;
    try {
      const { error } = await supabase
        .from('follow_requests')
        .insert({
          sender_id: user.id,
          receiver_id: targetUserId,
          status: 'pending'
        });
      if (error) throw error;
    } catch (e) {
      console.error('Error sending follow request:', e);
      throw e;
    }
  },

  acceptFollowRequest: async (requestId) => {
    try {
      const { error } = await supabase
        .from('follow_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);
      if (error) throw error;
      await get().fetchPendingFollowRequests();
      await get().fetchFriends();
    } catch (e) {
      console.error('Error accepting follow request:', e);
      throw e;
    }
  },

  rejectFollowRequest: async (requestId) => {
    try {
      const { error } = await supabase
        .from('follow_requests')
        .delete()
        .eq('id', requestId);
      if (error) throw error;
      await get().fetchPendingFollowRequests();
    } catch (e) {
      console.error('Error rejecting follow request:', e);
      throw e;
    }
  },

  cancelFollowRequest: async (targetUserId) => {
    const user = get().user;
    if (!user || !targetUserId) return;
    try {
      const { error } = await supabase
        .from('follow_requests')
        .delete()
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`);
      if (error) throw error;
      await get().fetchFriends();
    } catch (e) {
      console.error('Error canceling follow / unfollowing:', e);
      throw e;
    }
  },

  searchUsers: async (queryText) => {
    const user = get().user;
    if (!queryText.trim()) return [];
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, bio, instagram, gym_id, lifetime_volume_kg, current_level, prestige_rank')
        .neq('id', user?.id || '')
        .ilike('username', `%${queryText.trim()}%`)
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error searching users:', e);
      return [];
    }
  },

  initializeAuth: () => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, authInitialized: true });
      if (session?.user) get().fetchUserProfile(session.user.id);
      else set({ profileLoaded: true });
    }).catch(() => {
      set({ authInitialized: true, profileLoaded: true });
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, authInitialized: true });
      if (session?.user) get().fetchUserProfile(session.user.id);
      else set({ profileLoaded: true, userProfile: null });
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });
    if (error) throw error;
    set({ user: data.user, session: data.session });
    if (data.user?.id) {
      await get().fetchUserProfile(data.user.id);
    }
    return data;
  },

  registerWithEmail: async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          username: username ? username.trim() : null
        }
      }
    });
    if (error) throw error;
    set({ user: data.user, session: data.session });
    if (data.user?.id) {
      await get().fetchUserProfile(data.user.id);
    }
    return data;
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/login'
    });
    if (error) throw error;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, userProfile: null, profileLoaded: false });
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

  deleteRoutine: async (routineId) => {
    if (!routineId) return;
    try {
      // 1. Borrar routine_exercises (por seguridad en caso de que la FK no tenga CASCADE)
      await supabase.from('routine_exercises').delete().eq('routine_id', routineId);

      // 2. Borrar la rutina en Supabase
      const { error } = await supabase.from('routines').delete().eq('id', routineId);
      if (error) throw error;

      // 3. Actualización optimista de estado inmediata
      set((state) => ({
        workouts: state.workouts.filter((w) => w.id !== routineId)
      }));
    } catch (e) {
      console.error('Error deleting routine:', e);
      throw e;
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

  currentPRs: [],
  getCurrentPRs: async (targetUserId) => {
    const user = get().user;
    const uid = targetUserId || user?.id;
    if (!uid) return [];
    try {
      const { data, error } = await supabase.rpc('get_user_prs', { p_user_id: uid });
      if (error) throw error;
      let prs = data || [];

      // Si los PRs no traen nombre del ejercicio, enriquecer con la tabla exercises
      if (prs.length > 0 && !prs[0].exercise_name) {
        const exIds = prs.map(p => p.exercise_id).filter(Boolean);
        if (exIds.length > 0) {
          const { data: exData } = await supabase
            .from('exercises')
            .select('id, name, muscle_group')
            .in('id', exIds);
          if (exData) {
            const exMap = Object.fromEntries(exData.map(e => [e.id, e]));
            prs = prs.map(p => ({
              ...p,
              exercise_name: exMap[p.exercise_id]?.name || 'Ejercicio',
              muscle_group: exMap[p.exercise_id]?.muscle_group || 'General',
              max_weight_kg: p.max_weight_kg || p.max_1rm
            }));
          }
        }
      }

      if (!targetUserId || targetUserId === user?.id) {
        set({ currentPRs: prs });
      }
      return prs;
    } catch (e) {
      console.error('Error fetching PRs:', e);
      return [];
    }
  },

  // =========================================================================
  // HISTORIAL DE ENTRENAMIENTOS Y ELIMINACIÓN DE SESIONES
  // =========================================================================
  workoutHistory: [],
  isLoadingHistory: false,

  fetchWorkoutHistory: async (userId) => {
    const targetUserId = userId || get().user?.id;
    if (!targetUserId) return [];
    set({ isLoadingHistory: true });
    try {
      // 1. Obtener sesiones
      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          user_id,
          routine_id,
          started_at,
          ended_at,
          total_volume_kg
        `)
        .eq('user_id', targetUserId)
        .order('started_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        set({ workoutHistory: [], isLoadingHistory: false });
        return [];
      }

      // 2. Obtener nombres de rutinas si existen
      const routineIds = [...new Set(sessions.map(s => s.routine_id).filter(Boolean))];
      let routinesMap = {};
      if (routineIds.length > 0) {
        const { data: routinesData } = await supabase
          .from('routines')
          .select('id, title')
          .in('id', routineIds);
        if (routinesData) {
          routinesData.forEach(r => {
            routinesMap[r.id] = r.title;
          });
        }
      }

      // 3. Obtener sets y ejercicios de estas sesiones
      const sessionIds = sessions.map(s => s.id);
      const { data: sets, error: setsError } = await supabase
        .from('workout_sets')
        .select(`
          id,
          session_id,
          exercise_id,
          weight_kg,
          reps,
          is_pr,
          exercises (
            id,
            name,
            muscle_group
          )
        `)
        .in('session_id', sessionIds);

      const formattedHistory = sessions.map(sess => {
        const sessionSets = (sets || []).filter(s => s.session_id === sess.id);
        
        // Agrupar sets por ejercicio
        const exerciseMap = {};
        let prCount = 0;

        sessionSets.forEach(st => {
          if (st.is_pr) prCount++;
          const exId = st.exercise_id || 'unknown';
          const exName = st.exercises?.name || 'Ejercicio';
          const muscle = st.exercises?.muscle_group || 'General';

          if (!exerciseMap[exId]) {
            exerciseMap[exId] = {
              id: exId,
              name: exName,
              muscle_group: muscle,
              sets: []
            };
          }

          exerciseMap[exId].sets.push({
            id: st.id,
            weight_kg: parseFloat(st.weight_kg) || 0,
            reps: parseInt(st.reps) || 0,
            is_pr: !!st.is_pr
          });
        });

        // Calcular duración en minutos
        let durationMinutes = 45;
        if (sess.started_at && sess.ended_at) {
          const diffMs = new Date(sess.ended_at) - new Date(sess.started_at);
          durationMinutes = Math.max(1, Math.round(diffMs / 60000));
        }

        return {
          id: sess.id,
          title: routinesMap[sess.routine_id] || 'Entrenamiento Libre',
          started_at: sess.started_at,
          ended_at: sess.ended_at,
          total_volume_kg: Math.round(parseFloat(sess.total_volume_kg) || 0),
          durationMinutes,
          totalSetsCount: sessionSets.length,
          prsCount: prCount,
          exercises: Object.values(exerciseMap)
        };
      });

      set({ workoutHistory: formattedHistory, isLoadingHistory: false });
      return formattedHistory;
    } catch (e) {
      console.error('Error fetching workout history:', e);
      set({ isLoadingHistory: false });
      return [];
    }
  },

  deleteWorkoutSession: async (sessionId) => {
    const user = get().user;
    if (!sessionId || !user?.id) return;
    try {
      // 1. Borrar workout_sets asociados
      await supabase.from('workout_sets').delete().eq('session_id', sessionId);

      // 2. Borrar la sesión en Supabase
      const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId);
      if (error) throw error;

      // 3. Actualización optimista de estado
      set((state) => {
        const updatedHistory = state.workoutHistory.filter(s => s.id !== sessionId);
        const newLifetimeVol = updatedHistory.reduce((acc, s) => acc + (s.total_volume_kg || 0), 0);
        return {
          workoutHistory: updatedHistory,
          lifetimeVolumeKg: newLifetimeVol
        };
      });

      // 4. Recargar datos frescos del usuario y PRs
      get().fetchUserProfile(user.id);
      get().getCurrentPRs();
    } catch (e) {
      console.error('Error deleting workout session:', e);
      throw e;
    }
  },

  // --- Rankings ---
  currentRanking: [],
  isRankingLoading: false,

  fetchVolumeRanking: async (timeframe, gymId = null) => {
    set({ isRankingLoading: true });
    try {
      const { data, error } = await supabase.rpc('get_volume_ranking', {
        p_timeframe: timeframe,
        p_gym_id: gymId
      });
      if (error) throw error;
      
      // Enriquecer con datos del usuario (nombre, avatar)
      if (data && data.length > 0) {
        const userIds = data.map(d => d.user_id);
        const { data: usersData } = await supabase.from('users').select('id, username, avatar_url').in('id', userIds);
        
        const enriched = data.map(r => {
          const u = usersData?.find(u => u.id === r.user_id);
          return { ...r, username: u?.username || 'Usuario', avatar_url: u?.avatar_url };
        });
        set({ currentRanking: enriched, isRankingLoading: false });
      } else {
        set({ currentRanking: [], isRankingLoading: false });
      }
    } catch (e) {
      console.error('Error fetching volume ranking:', e);
      set({ currentRanking: [], isRankingLoading: false });
    }
  },

  fetchExerciseRanking: async (exerciseId, metric, timeframe, gymId = null) => {
    set({ isRankingLoading: true });
    try {
      const { data, error } = await supabase.rpc('get_exercise_ranking', {
        p_exercise_id: exerciseId,
        p_metric: metric,
        p_timeframe: timeframe,
        p_gym_id: gymId
      });
      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = data.map(d => d.user_id);
        const { data: usersData } = await supabase.from('users').select('id, username, avatar_url').in('id', userIds);
        
        const enriched = data.map(r => {
          const u = usersData?.find(u => u.id === r.user_id);
          return { ...r, username: u?.username || 'Usuario', avatar_url: u?.avatar_url };
        });
        set({ currentRanking: enriched, isRankingLoading: false });
      } else {
        set({ currentRanking: [], isRankingLoading: false });
      }
    } catch (e) {
      console.error('Error fetching exercise ranking:', e);
      set({ currentRanking: [], isRankingLoading: false });
    }
  },

  dbExercises: [],
  fetchDbExercises: async () => {
    if (get().dbExercises.length > 0) return; // Already fetched
    try {
      const { data, error } = await supabase.from('exercises').select('*').order('name');
      if (error) throw error;
      set({ dbExercises: data || [] });
    } catch (e) {
      console.error('Error fetching exercises:', e);
    }
  },

  activeWorkout: null,
  activeWorkoutSets: null,
  lastCompletedWorkout: null,
  
  startWorkout: (workout) => {
    const user = get().user;
    const routineTitle = workout?.title || 'Entrenamiento';
    set({ activeWorkout: { ...workout, startTime: Date.now() }, activeWorkoutSets: null });
    
    // Marcar usuario como activo en vivo en la base de datos
    if (user?.id) {
      supabase.from('users').update({
        is_active_training: true,
        active_routine_title: routineTitle,
        active_training_started_at: new Date().toISOString()
      }).eq('id', user.id).then(() => {});
    }
  },
  
  finishWorkout: (summaryData) => {
    const user = get().user;
    set((state) => ({ 
      lastCompletedWorkout: summaryData,
      lifetimeVolumeKg: state.lifetimeVolumeKg + (parseFloat(summaryData?.volume) || 0)
    }));

    // Desactivar estado en vivo
    if (user?.id) {
      supabase.from('users').update({
        is_active_training: false,
        active_routine_title: null,
        active_training_started_at: null
      }).eq('id', user.id).then(() => {});
    }
  },
  
  clearWorkout: () => {
    const user = get().user;
    set({
      activeWorkout: null,
      activeWorkoutSets: null,
      lastCompletedWorkout: null
    });

    if (user?.id) {
      supabase.from('users').update({
        is_active_training: false,
        active_routine_title: null,
        active_training_started_at: null
      }).eq('id', user.id).then(() => {});
    }
  },
  
  cancelWorkout: () => {
    const user = get().user;
    set({ activeWorkout: null, activeWorkoutSets: null });

    if (user?.id) {
      supabase.from('users').update({
        is_active_training: false,
        active_routine_title: null,
        active_training_started_at: null
      }).eq('id', user.id).then(() => {});
    }
  },
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
