import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import Button from '../../components/ui/Button';
import { LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const user = useAppStore((state) => state.user);
  const userProfile = useAppStore((state) => state.userProfile);
  const logout = useAppStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-6 pb-24">
      <header className="flex justify-between items-center mb-8 mt-4">
        <h1 className="text-3xl font-extrabold">Perfil</h1>
        <button className="text-gray-400 hover:text-white"><Settings size={24} /></button>
      </header>

      <div className="flex flex-col items-center mb-8">
        <img src={userProfile?.avatar_url || 'https://i.pravatar.cc/150'} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-surface-2 mb-4 object-cover" />
        <h2 className="text-2xl font-bold">{userProfile?.username || 'Atleta'}</h2>
        <p className="text-gray-400">{user?.email}</p>
      </div>

      <div className="space-y-4 mt-12">
        <Button variant="secondary" className="w-full text-left justify-start" onClick={handleLogout}>
          <LogOut size={20} className="mr-3 text-error" /> <span className="text-error">Cerrar Sesión</span>
        </Button>
      </div>
    </div>
  );
}
