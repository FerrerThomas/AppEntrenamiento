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
  const authInitialized = useAppStore((state) => state.authInitialized);

  if (!authInitialized) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-primary font-bold">Cargando...</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth & Onboarding (No Bottom Nav) */}
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding/:step" element={user ? <Onboarding /> : <Navigate to="/login" />} />
        
        {/* Workouts specific (No Bottom Nav or Custom Nav) */}
        <Route path="/workouts/create" element={user ? <WorkoutCreator /> : <Navigate to="/login" />} />
        <Route path="/workouts/active" element={user ? <ActiveWorkout /> : <Navigate to="/login" />} />
        <Route path="/workouts/summary" element={user ? <WorkoutSummary /> : <Navigate to="/login" />} />

        {/* Main App (With Bottom Nav) */}
        <Route element={<AppLayout showNav={true} />}>
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/workouts" element={user ? <WorkoutHub /> : <Navigate to="/login" />} />
          <Route path="/rankings" element={user ? <Rankings /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
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
