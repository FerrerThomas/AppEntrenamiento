import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { ChevronLeft, Plus, Search, GripVertical, Trash2 } from 'lucide-react';

export default function WorkoutCreator() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([
    { id: 1, name: 'Press Banca Plano', sets: 4 },
    { id: 2, name: 'Aperturas Inclinadas', sets: 3 },
  ]);

  return (
    <div className="flex flex-col min-h-screen p-6">
      <header className="flex items-center mb-8 pt-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white">
          <ChevronLeft size={28} />
        </button>
        <input 
          type="text" 
          placeholder="Nombre de la rutina..." 
          className="bg-transparent border-none text-2xl font-bold ml-2 focus:outline-none w-full placeholder-gray-600"
          defaultValue="Nueva Rutina"
        />
      </header>

      <div className="flex-1 space-y-3">
        {exercises.map((ex, i) => (
          <Card key={ex.id} className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-3">
              <GripVertical size={20} className="text-gray-500 cursor-grab" />
              <div>
                <h4 className="font-bold">{ex.name}</h4>
                <p className="text-sm text-primary">{ex.sets} series</p>
              </div>
            </div>
            <button className="text-gray-500 hover:text-error p-2">
              <Trash2 size={20} />
            </button>
          </Card>
        ))}

        <button className="w-full border-2 border-dashed border-surface-2 rounded-xl p-4 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-colors mt-4">
          <Plus size={20} className="mr-2" /> Agregar Ejercicio
        </button>
      </div>

      <div className="mt-8">
        <Button className="w-full" size="lg" onClick={() => navigate(-1)}>Guardar Rutina</Button>
      </div>
    </div>
  );
}
