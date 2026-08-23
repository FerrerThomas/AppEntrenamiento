import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Mail, Lock, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const loginWithGoogle = useAppStore((state) => state.loginWithGoogle);
  const loginWithEmail = useAppStore((state) => state.loginWithEmail);

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    await loginWithEmail('user@example.com', 'password123'); // Fallback mock
    navigate('/onboarding/1');
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Error logging in with Google:', error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-[#0a0a0a]">
      <div className="flex flex-col items-center mb-10 -mt-10">
        <h1 className="text-[40px] font-black tracking-tighter">
          <span className="text-white">F</span><span className="text-primary">Training</span>
        </h1>
        <p className="text-gray-400 mt-2 text-sm font-medium">Planifica, entrena, registra y rankea</p>
      </div>

      <div className="w-full bg-[#131313] border border-[#1c1b1b] rounded-3xl p-6">
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[11px] font-black text-primary mb-2 tracking-wider">EMAIL</label>
            <Input 
              type="email" 
              placeholder="tu@email.com" 
              icon={Mail} 
              required 
            />
          </div>
          <div>
            <label className="block text-[11px] font-black text-primary mb-2 tracking-wider">CONTRASEÑA</label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              icon={Lock} 
              rightIcon={EyeOff}
              required 
            />
          </div>
          
          <div className="flex justify-end pt-1">
            <button type="button" className="text-primary text-xs font-bold hover:text-primary-dim transition-colors">
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <Button type="submit" className="w-full h-14 flex items-center justify-center gap-2 mt-2 shadow-none rounded-2xl" size="lg">
            <span className="text-black font-semibold text-base">Iniciar Sesión</span>
            <ArrowRight size={20} className="text-black" strokeWidth={2.5} />
          </Button>
        </form>
        
        <div className="mt-10 flex items-center w-full">
          <div className="flex-1 border-t border-[#2a2a2a]"></div>
          <span className="px-4 text-[10px] font-black tracking-widest text-gray-400 bg-[#131313]">o</span>
          <div className="flex-1 border-t border-[#2a2a2a]"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="w-full mt-10 bg-[#1c1b1b] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-white rounded-2xl h-14 flex items-center justify-center gap-3 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l2.59-2.02.09-.82z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="font-semibold text-sm">Continuar con Google</span>
        </button>
      </div>
    </div>
  );
}
