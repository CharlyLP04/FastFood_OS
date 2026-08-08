import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginApi } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { consumeAuthMessage, getDefaultRouteForRole } from '../utils/auth';
import { Icon, ICONS } from '../components/ui/Icon';

const loginSchema = z.object({
  username: z
    .string()
    .min(1, { message: "El usuario es obligatorio." }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    const pendingMessage = consumeAuthMessage();
    if (pendingMessage) {
      setApiError(pendingMessage);
    }
  }, []);

  const onSubmit = async (data) => {
    setApiError('');
    setLoading(true);

    try {
      const responseData = await loginApi(data.username.trim(), data.password);
      login(responseData.usuario);
      navigate(getDefaultRouteForRole(responseData.usuario?.rol), { replace: true });
    } catch (err) {
      setApiError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col justify-between font-body relative overflow-hidden">
      
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E85D2F]/10 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#C1272D]/10 blur-[140px] rounded-full pointer-events-none"></div>

      {/* Header / Brand Bar */}
      <header className="w-full p-6 max-w-7xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-[#E85D2F]/15 border border-[#E85D2F]/30 p-2 rounded-xl text-[#E85D2F] flex items-center justify-center shadow-sm">
            <Icon path={ICONS.burger} size={22} />
          </div>
          <span className="font-heading font-black tracking-wider text-base text-white uppercase">
            A LA BURGER OS
          </span>
        </div>
        <span className="text-[11px] font-bold px-3 py-1 bg-[#1C1C20] text-zinc-400 border border-white/10 rounded-full">
          v2.0 Security Hardened
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-8 z-10">
        
        {/* Left Column: Hero Copy */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E85D2F]/30 bg-[#E85D2F]/10">
            <span className="w-2 h-2 rounded-full bg-[#E85D2F]"></span>
            <span className="text-xs font-bold tracking-wider text-[#E85D2F] uppercase">PLATAFORMA GASTRONÓMICA</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-heading font-black tracking-tight text-white uppercase leading-none">
            Tu operación,<br />
            <span className="text-[#E85D2F]">deliciosa y sin caos.</span>
          </h1>

          <p className="text-zinc-400 text-base md:text-lg max-w-md leading-relaxed">
            A La Burger OS centraliza pedidos, inventario, KDS y caja en un solo lugar con la mejor experiencia visual.
          </p>

          <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 pt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[#7A8450]">✓</span> Control de stock
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#7A8450]">✓</span> KDS en tiempo real
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#7A8450]">✓</span> JWT Security
            </div>
          </div>
        </div>

        {/* Right Column: Login Card */}
        <div className="w-full max-w-md mx-auto lg:ml-auto">
          <div className="bg-[#141416] text-white p-8 rounded-xl border border-[#242428] shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-heading font-black tracking-wider uppercase text-white">Iniciar Sesión</h2>
              <p className="text-xs text-zinc-400 mt-1">Ingresa tus credenciales para acceder al sistema</p>
            </div>
            
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              {apiError && (
                <div className="text-xs font-bold text-[#C1272D] bg-[#C1272D]/15 border border-[#C1272D]/30 rounded-xl px-4 py-3">
                  {apiError}
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Usuario
                </label>
                <input 
                  type="text" 
                  {...register('username')}
                  placeholder="ej. admin"
                  className={`w-full bg-[#1C1C20] border text-white rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-zinc-600 font-medium ${
                    errors.username ? 'border-[#C1272D] focus:ring-1 focus:ring-[#C1272D]' : 'border-[#2D2D35] focus:border-[#E85D2F] focus:ring-1 focus:ring-[#E85D2F]'
                  }`}
                />
                {errors.username && (
                  <p className="text-xs text-[#C1272D] pl-1 font-semibold">{errors.username.message}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="password"
                    {...register('password')}
                    placeholder="••••••••"
                    className={`w-full bg-[#1C1C20] border text-white rounded-xl pl-4 pr-12 py-3 text-sm outline-none transition-all placeholder:text-zinc-600 font-medium ${
                      errors.password ? 'border-[#C1272D] focus:ring-1 focus:ring-[#C1272D]' : 'border-[#2D2D35] focus:border-[#E85D2F] focus:ring-1 focus:ring-[#E85D2F]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-[#C1272D] pl-1 font-semibold">{errors.password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#E85D2F] hover:bg-[#d64e21] text-white font-heading font-bold py-3.5 rounded-full transition-all duration-200 shadow-md mt-4 disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-wider text-sm cursor-pointer active:scale-95"
              >
                {loading ? 'Iniciando sesión...' : 'Ingresar al sistema'}
              </button>
            </form>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full p-6 text-center text-xs text-zinc-500 border-t border-white/5 z-10">
        © 2026 A La Burger OS. Todos los derechos reservados.
      </footer>
    </div>
  );
}