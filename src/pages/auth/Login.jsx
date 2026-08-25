import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const loginWithGoogle = useAppStore((state) => state.loginWithGoogle);
  const loginWithEmail = useAppStore((state) => state.loginWithEmail);
  const registerWithEmail = useAppStore((state) => state.registerWithEmail);
  const resetPassword = useAppStore((state) => state.resetPassword);

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMsg('');
    setSuccessMsg('');
  };

  const mapAuthError = (err) => {
    if (!err) return 'Ha ocurrido un error. Inténtalo de nuevo.';
    const msg = err.message || err.toString();
    if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (msg.includes('User already registered')) return 'Ya existe una cuenta registrada con este correo.';
    if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
    if (msg.includes('Email not confirmed')) return 'Por favor revisa tu bandeja de entrada y confirma tu correo.';
    if (msg.includes('rate limit')) return 'Demasiados intentos. Por favor espera un momento.';
    if (msg.includes('invalid email')) return 'El formato del correo electrónico no es válido.';
    return msg;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!formData.email.trim() || !formData.password) {
          setErrorMsg('Por favor ingresa tu correo y contraseña.');
          setLoading(false);
          return;
        }

        const data = await loginWithEmail(formData.email, formData.password);
        const profile = useAppStore.getState().userProfile;
        
        if (profile?.weight_kg) {
          navigate('/');
        } else {
          navigate('/onboarding/1');
        }

      } else if (mode === 'register') {
        if (!formData.email.trim() || !formData.password) {
          setErrorMsg('Por favor completa todos los campos requeridos.');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setErrorMsg('Las contraseñas no coinciden.');
          setLoading(false);
          return;
        }

        const data = await registerWithEmail(formData.email, formData.password, formData.username);
        
        // Si Supabase devuelve sesión activa inmediatamente
        if (data?.session) {
          navigate('/onboarding/1');
        } else {
          setSuccessMsg('¡Cuenta creada con éxito! Si tu proyecto requiere confirmación por correo, revisa tu bandeja de entrada para ingresar.');
        }

      } else if (mode === 'forgot') {
        if (!formData.email.trim()) {
          setErrorMsg('Por favor escribe tu correo electrónico.');
          setLoading(false);
          return;
        }

        await resetPassword(formData.email);
        setSuccessMsg('Te hemos enviado un enlace a tu correo para restablecer tu contraseña.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg('');
      await loginWithGoogle();
    } catch (error) {
      console.error('Error logging in with Google:', error);
      setErrorMsg('No se pudo conectar con Google. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-8 bg-[#0a0a0a] text-white">
      
      {/* Brand Title */}
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-[42px] font-black tracking-tighter">
          <span className="text-white">F</span><span className="text-primary">Training</span>
        </h1>
        <p className="text-gray-400 mt-1.5 text-xs sm:text-sm font-semibold tracking-wide">
          Planifica, entrena, registra y rankea
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-[#131313] border border-[#1c1b1b] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Mode Switcher Pills (Only for login and register) */}
        {mode !== 'forgot' ? (
          <div className="flex bg-[#1c1c1e] border border-surface-2 rounded-2xl p-1 mb-6 relative">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-colors relative z-10 ${
                mode === 'login' ? 'text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {mode === 'login' && (
                <motion.div
                  layoutId="authTabPill"
                  className="absolute inset-0 bg-primary rounded-xl shadow-[0_0_12px_rgba(204,255,0,0.35)] -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              Iniciar Sesión
            </button>

            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-colors relative z-10 ${
                mode === 'register' ? 'text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {mode === 'register' && (
                <motion.div
                  layoutId="authTabPill"
                  className="absolute inset-0 bg-primary rounded-xl shadow-[0_0_12px_rgba(204,255,0,0.35)] -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              Registrarme
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className="p-2 rounded-full bg-[#1c1c1e] text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h3 className="font-extrabold text-base text-white">Recuperar Contraseña</h3>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-2.5 text-red-400 text-xs font-semibold"
          >
            <AlertCircle size={17} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </motion.div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-xl bg-primary/10 border border-primary/30 flex items-start space-x-2.5 text-primary text-xs font-semibold"
          >
            <CheckCircle2 size={17} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username (Only in Register mode) */}
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-black text-primary mb-1.5 tracking-wider uppercase">
                Nombre de Atleta
              </label>
              <Input
                type="text"
                placeholder="Ej. Lucas Silva"
                icon={User}
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                required
              />
            </div>
          )}

          {/* Email (In all modes) */}
          <div>
            <label className="block text-[11px] font-black text-primary mb-1.5 tracking-wider uppercase">
              Correo Electrónico
            </label>
            <Input
              type="email"
              placeholder="tu@email.com"
              icon={Mail}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>

          {/* Password (In Login & Register) */}
          {mode !== 'forgot' && (
            <div>
              <label className="block text-[11px] font-black text-primary mb-1.5 tracking-wider uppercase">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  icon={Lock}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password (Only in Register) */}
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-black text-primary mb-1.5 tracking-wider uppercase">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  icon={Lock}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                >
                  {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Forgot Password Link (Only in Login) */}
          {mode === 'login' && (
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-primary text-xs font-bold hover:underline transition-all"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-13 flex items-center justify-center gap-2 mt-4 shadow-none rounded-2xl active:scale-[0.99] font-black"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                <span className="text-black font-extrabold text-sm">Procesando...</span>
              </div>
            ) : mode === 'login' ? (
              <>
                <span className="text-black font-extrabold text-sm">Iniciar Sesión</span>
                <ArrowRight size={18} className="text-black" strokeWidth={2.5} />
              </>
            ) : mode === 'register' ? (
              <>
                <span className="text-black font-extrabold text-sm">Crear Cuenta</span>
                <ArrowRight size={18} className="text-black" strokeWidth={2.5} />
              </>
            ) : (
              <span className="text-black font-extrabold text-sm">Enviar Enlace de Recuperación</span>
            )}
          </Button>
        </form>

        {/* Google OAuth Section (Only in Login & Register) */}
        {mode !== 'forgot' && (
          <>
            <div className="mt-7 flex items-center w-full">
              <div className="flex-1 border-t border-[#2a2a2a]"></div>
              <span className="px-4 text-[10px] font-black tracking-widest text-gray-500 bg-[#131313] uppercase">o</span>
              <div className="flex-1 border-t border-[#2a2a2a]"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full mt-6 bg-[#1c1b1b] hover:bg-[#252528] border border-[#2a2a2a] text-white rounded-2xl h-13 flex items-center justify-center gap-3 transition-colors active:scale-[0.99]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l2.59-2.02.09-.82z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="font-bold text-xs sm:text-sm">Continuar con Google</span>
            </button>
          </>
        )}

      </div>
    </div>
  );
}
