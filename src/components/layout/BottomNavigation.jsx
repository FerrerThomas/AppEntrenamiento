import React from 'react';
import { Home, Library, Trophy, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { id: 'dashboard', path: '/', icon: Home, label: 'Inicio' },
    { id: 'workouts', path: '/workouts', icon: Library, label: 'Rutinas' },
    { id: 'rankings', path: '/rankings', icon: Trophy, label: 'Ranking' },
    { id: 'profile', path: '/profile', icon: User, label: 'Perfil' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
      <div className="glass rounded-xl flex items-center justify-around py-3 px-2 mx-auto max-w-md">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-16 h-16 transition-colors ${isActive ? 'text-surface-0' : 'text-gray-400 hover:text-white'}`}
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-full ${isActive ? 'bg-primary shadow-glow' : ''}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
