import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
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
  const userProfile = useAppStore((state) => state.userProfile);

  const [gyms, setGyms] = useState([]);
  const [loadingGyms, setLoadingGyms] = useState(false);
  const [gymSearchQuery, setGymSearchQuery] = useState('');
  
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setOnboardingData({ avatarFile: file });
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    // Pre-cargar datos provistos por Google Auth si existen y no han sido modificados
    if (userProfile && !data.name) {
      setOnboardingData({ 
        name: userProfile.username || '', 
      });
      if (userProfile.avatar_url && !avatarPreview) {
        setAvatarPreview(userProfile.avatar_url);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    if (currentStep === 3) {
      const fetchGyms = async () => {
        setLoadingGyms(true);
        try {
          const { data: dbGyms, error } = await supabase
            .from('gyms')
            .select('*')
            .order('name', { ascending: true });
          if (error) throw error;
          if (dbGyms && dbGyms.length > 0) {
            // Priorizar los 3 gimnasios populares especificados
            const getPopularRank = (g) => {
              const nameLower = (g.name || '').toLowerCase().trim();
              if (g.id === '0e762f63-3815-4f34-800c-78fb6d85ab93' || nameLower.startsWith('fit club')) return 1;
              if (g.id === 'addf3fd0-dcd0-4d0f-b467-2c299d389cb1' || nameLower.startsWith('skay gym')) return 2;
              if (g.id === 'df4463b7-98bc-4fad-b847-2a85104310f0' || nameLower.startsWith('gym time')) return 3;
              return 999;
            };

            const mapped = dbGyms.map(g => ({
              id: g.id,
              name: g.name,
              loc: g.address || '',
              icon: Dumbbell,
              logo: g.logo_url,
              isPopular: getPopularRank(g) <= 3
            })).sort((a, b) => {
              const rankA = getPopularRank(a);
              const rankB = getPopularRank(b);
              if (rankA !== rankB) return rankA - rankB;
              return a.name.localeCompare(b.name);
            });

            setGyms(mapped);
          } else {
            throw new Error("No gyms found");
          }
        } catch (err) {
          // Fallback a los 3 populares si la DB no responde
          setGyms([
            { id: '0e762f63-3815-4f34-800c-78fb6d85ab93', name: 'Fit Club', loc: '49 y diagonal 74, La Plata', icon: Dumbbell, isPopular: true },
            { id: 'addf3fd0-dcd0-4d0f-b467-2c299d389cb1', name: 'Skay Gym', loc: 'Muchas sedes (lavan plata)', icon: Activity, isPopular: true },
            { id: 'df4463b7-98bc-4fad-b847-2a85104310f0', name: 'Gym Time', loc: '7 entre 40 y 39, La Plata', icon: Dumbbell, isPopular: true },
          ]);
        } finally {
          setLoadingGyms(false);
        }
      };
      fetchGyms();
    }
  }, [currentStep]);

  const handleNext = async () => {
    if (currentStep < 3) {
      navigate(`/onboarding/${currentStep + 1}`);
    } else {
      setIsSubmitting(true);
      try {
        const user = useAppStore.getState().user;
        let avatarUrl = null;

        // Subir imagen a Supabase Storage si existe
        if (data.avatarFile && user?.id) {
          const fileExt = data.avatarFile.name.split('.').pop();
          const fileName = `${user.id}_${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, data.avatarFile, { upsert: true });
          
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
            avatarUrl = publicUrlData.publicUrl;
          }
        }

        // Guardar perfil en base de datos
        if (user?.id) {
          await supabase.from('users').upsert({
            id: user.id,
            username: data.name || userProfile?.username, // Usar el nombre de Google si no se editó
            birth_date: data.birthDate || null,
            weight_kg: data.weight,
            height_cm: data.height,
            gym_id: data.gym || null,
            avatar_url: avatarUrl || userProfile?.avatar_url // Mantener el de Google si no subió uno nuevo
          });
          // Recargar el perfil para que el Dashboard lo tenga inmediatamente
          await useAppStore.getState().fetchUserProfile(user.id);
        }
        
        navigate('/');
      } catch (error) {
        console.error("Error al guardar perfil:", error);
        navigate('/'); // Fallback
      } finally {
        setIsSubmitting(false);
      }
    }
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
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-[52px] h-[52px] rounded-full border-[1.5px] border-primary flex items-center justify-center hover:bg-primary/10 transition-colors overflow-hidden"
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="text-primary" size={20} strokeWidth={2} />
                      )}
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
              placeholder="Buscar por nombre o calle (ej. 50, Skay, OnFit)..." 
              value={gymSearchQuery}
              onChange={(e) => setGymSearchQuery(e.target.value)}
              className="bg-[#131313] border-[#1c1b1b] py-4"
            />

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-black text-primary tracking-wider uppercase">
                  {gymSearchQuery ? 'RESULTADOS DE BÚSQUEDA' : 'GIMNASIOS POPULARES'}
                </h3>
                <span className="text-[11px] font-bold text-gray-500">
                  {gyms.filter(g => 
                    g.name.toLowerCase().includes(gymSearchQuery.toLowerCase()) || 
                    (g.loc && g.loc.toLowerCase().includes(gymSearchQuery.toLowerCase()))
                  ).length} gimnasios
                </span>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {loadingGyms ? (
                  <div className="text-center text-sm text-gray-500 py-6">Cargando gimnasios...</div>
                ) : gyms.filter(g => 
                    g.name.toLowerCase().includes(gymSearchQuery.toLowerCase()) || 
                    (g.loc && g.loc.toLowerCase().includes(gymSearchQuery.toLowerCase()))
                  ).length === 0 ? (
                  <div className="text-center text-sm text-gray-400 py-8 bg-[#131313] rounded-2xl border border-[#1c1b1b]">
                    <p className="font-bold text-white mb-1">No encontramos ese gimnasio</p>
                    <p className="text-xs text-gray-500">Intenta buscar por el número de calle o nombre abreviado.</p>
                  </div>
                ) : (
                  gyms
                    .filter(g => 
                      g.name.toLowerCase().includes(gymSearchQuery.toLowerCase()) || 
                      (g.loc && g.loc.toLowerCase().includes(gymSearchQuery.toLowerCase()))
                    )
                    .map(gym => (
                      <div 
                        key={gym.id}
                        onClick={() => setOnboardingData({ gym: gym.id })}
                        className={`flex items-center justify-between p-4 bg-[#131313] border ${data.gym === gym.id ? 'border-primary shadow-[0_0_15px_rgba(204,255,0,0.1)]' : 'border-[#1c1b1b]'} rounded-2xl cursor-pointer hover:border-gray-500 transition-all active:scale-[0.99]`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-[#1c1b1b] rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-[#222]">
                            {gym.logo ? (
                              <img src={gym.logo} alt={gym.name} className="w-full h-full object-cover" />
                            ) : (
                              <gym.icon size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-sm text-white truncate">{gym.name}</h4>
                            <div className="flex items-center text-[12px] text-gray-400 mt-0.5 truncate">
                              <MapPin size={12} className="mr-1 shrink-0 text-primary" /> 
                              <span className="truncate">{gym.loc}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 ml-3 ${data.gym === gym.id ? 'border-primary bg-transparent' : 'border-gray-600'} flex items-center justify-center transition-colors`}>
                          {data.gym === gym.id && <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_8px_rgba(204,255,0,0.8)]" />}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pb-4">
          <Button className="w-full h-14 flex items-center justify-center gap-2 shadow-none rounded-2xl" size="lg" onClick={handleNext} disabled={isSubmitting}>
            <span className="text-black font-semibold text-base">
              {isSubmitting ? 'Guardando...' : (currentStep === 3 ? 'Comenzar' : 'Siguiente')}
            </span>
            {!isSubmitting && <ArrowRight size={20} className="text-black" strokeWidth={2.5} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
