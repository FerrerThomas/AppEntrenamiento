import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Trophy, Share2, TrendingUp } from 'lucide-react';
import Confetti from 'react-confetti';

export default function WorkoutSummary() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen p-6 relative overflow-hidden bg-gradient-to-b from-primary/10 to-surface-0">
      <div className="absolute inset-0 pointer-events-none">
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={200} colors={['#CCFF00', '#ffffff']} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center mt-12 z-10">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 shadow-glow">
          <Trophy size={40} className="text-primary" />
        </div>
        
        <h1 className="text-4xl font-extrabold mb-2">¡Completado!</h1>
        <p className="text-gray-400 mb-8">45:20 • Pecho y Tríceps</p>

        <Card className="w-full py-8 border-primary/50 bg-surface-1/80 backdrop-blur-md mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Volumen Total</p>
          <p className="text-6xl font-black">4,250<span className="text-2xl text-gray-400">kg</span></p>
        </Card>

        <div className="w-full text-left space-y-4">
          <h3 className="font-bold text-lg mb-2 flex items-center"><TrendingUp className="mr-2 text-primary" size={20} /> Nuevos Récords</h3>
          
          <Card glass className="flex justify-between items-center px-4 py-3 border-l-4 border-l-primary">
            <div>
              <p className="font-bold">Press Banca</p>
              <p className="text-sm text-gray-400">3x10</p>
            </div>
            <div className="bg-primary/20 text-primary px-2 py-1 rounded text-sm font-bold">
              +5 kg
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-8 space-y-4 z-10">
        <Button className="w-full gap-2 text-surface-0 font-bold text-lg" size="lg">
          <Share2 size={20} /> Compartir Logro
        </Button>
        <Button variant="ghost" className="w-full" size="lg" onClick={() => navigate('/')}>
          Volver al Inicio
        </Button>
      </div>
    </div>
  );
}
