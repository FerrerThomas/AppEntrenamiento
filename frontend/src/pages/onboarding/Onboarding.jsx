import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ArrowLeft, ArrowRight, Calendar, Search, MapPin, Dumbbell, Activity, Camera } from 'lucide-react';

export default function Onboarding() {
  const { step } = useParams();
  const navigate = useNavigate();
  const currentStep = parseInt(step) || 1;
  const setOnboardingData = useAppStore((state) => state.setOnboardingData);
  const data = useAppStore((state) => state.onboardingData);

  const handleNext = () => {
    if (currentStep < 3) navigate(`/onboarding/${currentStep + 1}`);
    else navigate('/');
  };
  
  const handleBack = () => {
    if (currentStep > 1) navigate(`/onboarding/${currentStep - 1}`);
    else navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      
      {/* Header */}
      <header className="p-6 pb-4 flex flex-col pt-8">
        <div className="flex items-center justify-between w-full mb-6 relative">
          <button onClick={handleBack} className="w-10 h-10 bg-[#1c1b1b] rounded-full flex items-center justify-center hover:bg-[#2a2a2a] transition-colors absolute left-0 z-10">
            <ArrowLeft size={20} />
          </button>
          <div className="w-full text-center">
            <span className="text-[10px] font-black tracking-widest text-gray-300">PASO {currentStep} DE 3</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex space-x-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= currentStep ? 'bg-primary shadow-[0_0_8px_rgba(204,255,0,0.5)]' : 'bg-[#2a2a2a]'}`} />
          ))}
        </div>
      </header>

      <div className="flex-1 p-6 flex flex-col">
        {/* Step 1 */}
        {currentStep === 1 && (
          <div className="space-y-6 flex-1">
            <div className="mb-8 mt-4">
              <h1 className="text-[42px] font-black leading-[1.05] tracking-tight mb-3">¡Hola! ¿Cómo<br/>te llamas?</h1>
              <p className="text-gray-400 text-sm font-medium">Este nombre será visible en los rankings.</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-primary mb-2 tracking-wider">NOMBRE DE USUARIO</label>
                <div className="flex space-x-2">
                  <div className="flex-1 min-w-0">
                    <Input 
                      placeholder="Tu nombre" 
                      className="bg-[#131313] border-[#1c1b1b] h-16 rounded-2xl text-base"
                      value={data.name || ''}
                      onChange={(e) => setOnboardingData({ name: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col items-center shrink-0 ml-2">
                    <button className="w-[52px] h-[52px] rounded-full border-[1.5px] border-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
                      <Camera className="text-primary" size={20} strokeWidth={2} />
                    </button>
                    <span className="text-[9px] text-gray-500 mt-1.5 font-bold tracking-widest">OPCIONAL</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-black text-primary mb-2 tracking-wider">FECHA DE NACIMIENTO</label>
                <Input 
                  type="date"
                  placeholder="dd/mm/aaaa" 
                  className="bg-[#131313] border-[#1c1b1b] h-16 rounded-2xl text-base [color-scheme:dark]"
                  rightIcon={Calendar}
                  value={data.birthDate || ''}
                  onChange={(e) => setOnboardingData({ birthDate: e.target.value })}
                />
              </div>
            </div>

            <p className="text-gray-500 text-xs mt-6 font-medium">Debes ser mayor de 16 años para unirte.</p>
          </div>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <div className="space-y-6 flex-1">
            <div className="mb-8 mt-4">
              <h1 className="text-[42px] font-black leading-[1.05] tracking-tight mb-3">Tus métricas</h1>
              <p className="text-gray-400 text-sm font-medium">Esto nos ayuda a calcular tu progreso.</p>
            </div>
            
            <div className="space-y-4">
              {/* Peso */}
              <div className="bg-[#131313] border border-[#1c1b1b] rounded-[24px] p-6 flex flex-col items-center">
                <label className="text-[11px] font-black text-primary tracking-wider mb-4">PESO (KG)</label>
                <div className="flex items-center justify-between w-full px-4">
                  <button onClick={() => setOnboardingData({ weight: Math.max(20, (data.weight || 72) - 1) })} className="w-12 h-12 rounded-full bg-[#1c1b1b] hover:bg-[#2a2a2a] flex items-center justify-center text-white transition-colors">
                    <span className="text-2xl font-light leading-none mt-[-2px]">-</span>
                  </button>
                  <div className="flex items-baseline">
                    <span className="text-[52px] font-black tracking-tighter">{data.weight || 72}</span>
                    <span className="text-xl font-bold text-gray-400 ml-1">kg</span>
                  </div>
                  <button onClick={() => setOnboardingData({ weight: (data.weight || 72) + 1 })} className="w-12 h-12 rounded-full bg-[#1c1b1b] hover:bg-[#2a2a2a] flex items-center justify-center text-white transition-colors">
                    <span className="text-2xl font-light leading-none mt-[-2px]">+</span>
                  </button>
                </div>
              </div>

              {/* Altura */}
              <div className="bg-[#131313] border border-[#1c1b1b] rounded-[24px] p-6 flex flex-col items-center">
                <label className="text-[11px] font-black text-primary tracking-wider mb-4">ALTURA (CM)</label>
                <div className="flex items-center justify-between w-full px-4">
                  <button onClick={() => setOnboardingData({ height: Math.max(100, (data.height || 175) - 1) })} className="w-12 h-12 rounded-full bg-[#1c1b1b] hover:bg-[#2a2a2a] flex items-center justify-center text-white transition-colors">
                    <span className="text-2xl font-light leading-none mt-[-2px]">-</span>
                  </button>
                  <div className="flex items-baseline">
                    <span className="text-[52px] font-black tracking-tighter">{data.height || 175}</span>
                    <span className="text-xl font-bold text-gray-400 ml-1">cm</span>
                  </div>
                  <button onClick={() => setOnboardingData({ height: (data.height || 175) + 1 })} className="w-12 h-12 rounded-full bg-[#1c1b1b] hover:bg-[#2a2a2a] flex items-center justify-center text-white transition-colors">
                    <span className="text-2xl font-light leading-none mt-[-2px]">+</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <div className="space-y-6 flex-1">
            <div className="mb-6 mt-4">
              <h1 className="text-[42px] font-black leading-[1.05] tracking-tight mb-3">Tu gimnasio</h1>
              <p className="text-gray-400 text-sm font-medium">Selecciona donde entrenas para conectar con otros.</p>
            </div>
            
            <Input 
              icon={Search}
              placeholder="Nombre del gimnasio..." 
              className="bg-[#131313] border-[#1c1b1b] py-4"
            />

            <div className="mt-8">
              <h3 className="text-[11px] font-black text-primary tracking-wider mb-4">GIMNASIOS POPULARES</h3>
              <div className="space-y-3">
                
                {[
                  { id: 1, name: 'Titanium Fitness', loc: 'Madrid Centro', icon: Dumbbell },
                  { id: 2, name: 'Iron Forge Gym', loc: 'Barcelona Norte', icon: Activity },
                  { id: 3, name: 'Elite Performance Center', loc: 'Valencia Este', icon: Dumbbell },
                ].map(gym => (
                  <div 
                    key={gym.id}
                    onClick={() => setOnboardingData({ gym: gym.name })}
                    className={`flex items-center justify-between p-4 bg-[#131313] border ${data.gym === gym.name ? 'border-primary' : 'border-[#1c1b1b]'} rounded-2xl cursor-pointer hover:border-gray-500 transition-colors`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#1c1b1b] rounded-xl flex items-center justify-center">
                        <gym.icon size={20} className="text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{gym.name}</h4>
                        <div className="flex items-center text-[13px] text-gray-400 mt-0.5">
                          <MapPin size={12} className="mr-1" /> {gym.loc}
                        </div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${data.gym === gym.name ? 'border-primary bg-transparent' : 'border-gray-600'} flex items-center justify-center transition-colors`}>
                      {data.gym === gym.name && <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_8px_rgba(204,255,0,0.8)]" />}
                    </div>
                  </div>
                ))}

              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pb-4">
          <Button className="w-full h-14 flex items-center justify-center gap-2 shadow-none rounded-2xl" size="lg" onClick={handleNext}>
            <span className="text-black font-semibold text-base">{currentStep === 3 ? 'Comenzar' : 'Siguiente'}</span>
            <ArrowRight size={20} className="text-black" strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}
