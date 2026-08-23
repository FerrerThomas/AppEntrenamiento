import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layouts
import AppLayout from './components/layout/AppLayout';

// Pages
import Login from './pages/auth/Login';
import Onboarding from './pages/onboarding/Onboarding';
import Dashboard from './pages/dashboard/Dashboard';
import WorkoutHub from './pages/workouts/WorkoutHub';
import WorkoutCreator from './pages/workouts/WorkoutCreator';
import ActiveWorkout from './pages/workouts/ActiveWorkout';
import WorkoutSummary from './pages/workouts/WorkoutSummary';
import Rankings from './pages/rankings/Rankings';
import Profile from './pages/profile/Profile';

import { useAppStore } from './store/useAppStore';

function AnimatedRoutes() {
  const location = useLocation();
  const user = useAppStore((state) => state.user);
  const userProfile = useAppStore((state) => state.userProfile);
  const authInitialized = useAppStore((state) => state.authInitialized);
  const profileLoaded = useAppStore((state) => state.profileLoaded);

  if (!authInitialized || (user && !profileLoaded)) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-primary font-bold">Cargando...</div>;
  }

  // Wrapper para forzar Onboarding si el usuario no tiene perfil completo (ej. no tiene peso configurado)
  const requireProfile = (element) => {
    if (!user) return <Navigate to="/login" />;
    if (!userProfile?.weight_kg) return <Navigate to="/onboarding/1" />;
    return element;
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth & Onboarding (No Bottom Nav) */}
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding/:step" element={user ? <Onboarding /> : <Navigate to="/login" />} />
        
        {/* Workouts specific (No Bottom Nav or Custom Nav) */}
        <Route element={<AppLayout showNav={false} />}>
          <Route path="/workouts/create" element={requireProfile(<WorkoutCreator />)} />
          <Route path="/workouts/active" element={requireProfile(<ActiveWorkout />)} />
          <Route path="/workouts/summary" element={requireProfile(<WorkoutSummary />)} />
        </Route>

        {/* Main App (With Bottom Nav) */}
        <Route element={<AppLayout showNav={true} />}>
          <Route path="/" element={requireProfile(<Dashboard />)} />
          <Route path="/workouts" element={requireProfile(<WorkoutHub />)} />
          <Route path="/rankings" element={requireProfile(<Rankings />)} />
          <Route path="/profile" element={requireProfile(<Profile />)} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const initializeAuth = useAppStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
