import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Plus, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WorkoutHub() {
  const workouts = useAppStore((state) => state.workouts);
  const navigate = useNavigate();

  return (
    <div className="p-6 relative min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 mt-4">Mis Rutinas</h1>
      
      <Button className="w-full mb-8 text-lg" size="lg" onClick={() => navigate('/workouts/active')}>
        Empezar Entrenamiento Libre
      </Button>

      <div className="space-y-4 mb-24">
        {workouts.map((w) => (
          <Card key={w.id} className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{w.title}</h3>
              <p className="text-sm text-gray-400">{w.type} • {w.duration} • {w.exercises} ej.</p>
            </div>
            <button 
              className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-primary hover:bg-surface-2/80 transition-colors"
              onClick={() => navigate('/workouts/active')}
            >
              <Play size={20} fill="currentColor" />
            </button>
          </Card>
        ))}
      </div>

      <div className="fixed bottom-24 right-6 z-40">
        <button 
          onClick={() => navigate('/workouts/create')}
          className="w-16 h-16 rounded-full bg-primary text-surface-0 flex items-center justify-center shadow-glow"
        >
          <Plus size={32} />
        </button>
      </div>
    </div>
  );
}
