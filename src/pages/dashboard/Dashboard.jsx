import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Bell, ArrowRight, Maximize2, Heart, MessageSquare, Trophy, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const currentWorkout = useAppStore((state) => state.activeWorkout);
  const userProfile = useAppStore((state) => state.userProfile);
  const navigate = useNavigate();

  return (
    <div className="p-6 pb-32 min-h-screen bg-surface-0 flex flex-col max-w-md mx-auto">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-8 pt-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Hola, {userProfile?.username?.split(' ')[0] || 'Atleta'}</h1>
          <p className="text-gray-400 font-medium">Listo para aplastar tus metas?</p>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#2a2a2a]">
          <img src={userProfile?.avatar_url || "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=150&q=80"} alt="Profile" className="w-full h-full object-cover" />
        </div>
      </header>

        {/* Amigos entrenando bar */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-3 flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex -space-x-2">
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80" className="w-8 h-8 rounded-full border-2 border-surface-1 object-cover" />
              <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80" className="w-8 h-8 rounded-full border-2 border-surface-1 object-cover" />
              <div className="w-8 h-8 rounded-full bg-surface-2 border-2 border-surface-1 flex items-center justify-center text-xs font-bold z-10">+1</div>
            </div>
            <span className="text-sm font-medium text-gray-300">3 amigos entrenando</span>
          </div>
          <button className="text-primary text-sm font-bold flex items-center">
            Ver <ArrowRight size={16} className="ml-1" />
          </button>
        </div>

        {/* Hero Workout Card */}
        <div className="relative rounded-[24px] overflow-hidden mb-6 p-5 flex flex-col justify-between min-h-[300px] border border-surface-2 shadow-[0_0_20px_rgba(204,255,0,0.05)] bg-surface-1">
          {/* Background Image */}
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop" 
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90"></div>

          <div className="relative z-10 flex justify-between items-start mb-12">
            <div className="bg-surface-1/90 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center border border-surface-2">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              <span className="text-xs font-bold text-white">Rutina de hoy</span>
            </div>
            <div className="bg-surface-1/90 backdrop-blur-md rounded-full px-3 py-1.5 border border-surface-2">
              <span className="text-lg font-black text-primary">45:00</span>
            </div>
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold mb-3 text-white shadow-sm">Pecho y Tríceps</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {['FUERZA', 'HIPERTROFIA', 'AVANZADO'].map(tag => (
                <span key={tag} className="bg-surface-2/90 backdrop-blur-sm text-xs font-bold px-3 py-1.5 rounded-full border border-surface-2 text-gray-200">
                  {tag}
                </span>
              ))}
            </div>
            <Button className="w-full text-lg shadow-none" onClick={() => navigate('/workouts/active')}>
              Iniciar Entrenamiento
            </Button>
          </div>
        </div>

        {/* Alert Notification Card */}
        <div className="bg-surface-1 border border-[#3c4d00]/40 rounded-xl p-4 flex items-center mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5"></div>
          <div className="w-12 h-12 bg-surface-2 rounded-full flex items-center justify-center mr-4 relative z-10 flex-shrink-0">
            <span className="text-2xl">🔥</span>
          </div>
          <div className="relative z-10 flex-1">
            <p className="text-sm text-gray-200 leading-snug mb-1">
              Alguien superó tu récord de <span className="font-bold text-white">Sentadilla</span> hoy en tu gimnasio.
            </p>
            <button className="text-primary text-sm font-bold flex items-center hover:text-primary-dim transition-colors" onClick={() => navigate('/rankings')}>
              ¡Mirá el ranking! <ArrowRight size={14} className="ml-1" />
            </button>
          </div>
        </div>

        {/* Social Feed Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Actividad de Amigos</h3>
          <button className="text-gray-400 hover:text-white">
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {/* Social Feed List */}
        <div className="space-y-4">
          
          {/* Feed Item 1 */}
          <Card className="p-4" padding="">
            <div className="flex items-center mb-3">
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80" className="w-10 h-10 rounded-full object-cover mr-3 border border-surface-2" />
              <div>
                <p className="text-sm"><span className="font-bold text-white">Carlos</span> completó una rutina</p>
                <p className="text-xs text-gray-400">Hace 2 horas</p>
              </div>
            </div>
            
            <div className="bg-surface-2 rounded-lg p-3 flex justify-between items-center mb-4">
              <div className="flex items-center text-sm font-medium">
                <Maximize2 size={16} className="text-primary mr-2" />
                Espalda y Bíceps
              </div>
              <span className="text-sm text-gray-400">60 min</span>
            </div>

            <div className="flex space-x-6 text-gray-400">
              <button className="flex items-center text-sm hover:text-white">
                <Heart size={18} className="mr-2" /> 12
              </button>
              <button className="flex items-center text-sm hover:text-white">
                <MessageSquare size={18} className="mr-2" /> 3
              </button>
            </div>
          </Card>

          {/* Feed Item 2 */}
          <Card className="p-4" padding="">
            <div className="flex items-center mb-3">
              <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80" className="w-10 h-10 rounded-full object-cover mr-3 border border-surface-2" />
              <div>
                <p className="text-sm"><span className="font-bold text-white">Sofia</span> batió su récord personal</p>
                <p className="text-xs text-gray-400">Hace 4 horas</p>
              </div>
            </div>
            
            <div className="bg-[#1e3a2b]/30 border border-primary/20 rounded-lg p-4 mb-4 flex items-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <Trophy size={20} className="text-surface-0" />
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-1">Peso Muerto</p>
                <div className="flex items-end">
                  <span className="text-2xl font-black text-primary leading-none mr-2">100 kg</span>
                  <span className="text-xs text-gray-500 line-through pb-0.5">95 kg</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-6 text-gray-400">
              <button className="flex items-center text-sm text-primary">
                <Heart size={18} className="mr-2" fill="currentColor" /> 24
              </button>
              <button className="flex items-center text-sm hover:text-white">
                <MessageSquare size={18} className="mr-2" /> 5
              </button>
            </div>
          </Card>
        </div>
      </div>
  );
}
