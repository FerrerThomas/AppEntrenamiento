import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Check, PlaySquare, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const [sets, setSets] = useState([
    { id: 1, kg: 80, reps: 10, done: true },
    { id: 2, kg: 80, reps: 8, done: false },
    { id: 3, kg: 80, reps: 8, done: false },
  ]);

  const toggleSet = (id) => {
    setSets(sets.map(s => s.id === id ? { ...s, done: !s.done } : s));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-6 pb-2 pt-10 flex justify-between items-center bg-surface-1 border-b border-surface-2 sticky top-0 z-10">
        <div>
          <h2 className="text-xs text-primary font-bold uppercase tracking-wider">Entrenando</h2>
          <h1 className="text-xl font-bold">Pecho y Tríceps</h1>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold">14:23</p>
          <button className="text-xs text-error font-bold" onClick={() => navigate('/workouts/summary')}>TERMINAR</button>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <button className="p-2 bg-surface-1 rounded-full"><ChevronLeft size={24}/></button>
          <div className="text-center flex-1">
            <h3 className="font-extrabold text-2xl">Press Banca</h3>
            <p className="text-gray-400 text-sm">Ejercicio 1 de 5</p>
          </div>
          <button className="p-2 bg-surface-1 rounded-full"><ChevronRight size={24}/></button>
        </div>

        <Card className="aspect-video mb-8 flex items-center justify-center bg-surface-2 overflow-hidden relative">
          <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-50" alt="Bench Press" />
          <button className="absolute bg-surface-0/50 backdrop-blur-md p-3 rounded-full text-white border border-surface-2">
            <PlaySquare size={32} />
          </button>
        </Card>

        <div className="space-y-3">
          <div className="flex text-xs font-bold text-gray-500 uppercase px-4 mb-2">
            <span className="w-12">Set</span>
            <span className="flex-1 text-center">kg</span>
            <span className="flex-1 text-center">Reps</span>
            <span className="w-12 text-center">Check</span>
          </div>

          {sets.map((set, i) => (
            <Card key={set.id} className={`flex items-center px-4 py-2 ${set.done ? 'bg-primary/5 border-primary/30' : ''}`} padding="">
              <span className="w-12 font-bold text-gray-400">{i + 1}</span>
              <input type="number" defaultValue={set.kg} className={`flex-1 bg-transparent text-center font-bold text-xl focus:outline-none ${set.done ? 'text-primary' : 'text-white'}`} />
              <input type="number" defaultValue={set.reps} className={`flex-1 bg-transparent text-center font-bold text-xl focus:outline-none ${set.done ? 'text-primary' : 'text-white'}`} />
              <div className="w-12 flex justify-center">
                <button 
                  onClick={() => toggleSet(set.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${set.done ? 'bg-primary text-surface-0 shadow-glow' : 'bg-surface-2 text-surface-2'}`}
                >
                  <Check size={20} className={set.done ? 'opacity-100' : 'opacity-0'} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
