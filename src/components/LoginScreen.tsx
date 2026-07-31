import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FrizameLogo } from './FrizameLogo';
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { users, loginUser, sessionExpiredMsg, clearSessionExpiredMsg } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (clearSessionExpiredMsg) clearSessionExpiredMsg();

    if (!email.trim()) {
      setErrorMessage('Por favor, ingrese su correo electrónico.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Por favor, ingrese su contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = loginUser(email, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'Error de autenticación.');
      }
    }, 200);
  };

  const handleSelectDemoUser = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('frizame2026');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0B4F6C] via-[#083b52] to-[#012e40] p-4 relative overflow-hidden">
      {/* Background Subtle Geometric Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#017E9A]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-[#D1E3EB]/40 overflow-hidden z-10 animate-scaleUp">
        {/* Top Header Card Banner */}
        <div className="bg-gradient-to-r from-[#0B4F6C] to-[#017E9A] p-6 text-center text-white relative">
          <div className="flex justify-center mb-3">
            <FrizameLogo variant="header" className="h-12" />
          </div>
          <p className="text-xs text-sky-100 font-medium">
            Congelados Premium • Control de Acceso Unificado
          </p>
        </div>

        {/* Login Form Body */}
        <div className="p-6 md:p-8 space-y-5">
          <div className="text-center space-y-1">
            <h2 className="font-brand font-bold text-xl text-[#0B4F6C] flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#017E9A]" />
              <span>Iniciar Sesión</span>
            </h2>
            <p className="text-xs text-gray-500">
              Ingrese sus credenciales registradas para ingresar al sistema
            </p>
          </div>

          {sessionExpiredMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{sessionExpiredMsg}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0B4F6C] mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#017E9A]" />
                <span>Correo Electrónico / Usuario</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@frizame.com"
                  className="w-full p-3 border border-[#D1E3EB] rounded-xl text-xs md:text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#017E9A] focus:ring-2 focus:ring-[#017E9A]/20 bg-[#F4F8FA]"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B4F6C] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#017E9A]" />
                  <span>Contraseña</span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Clave Requerida</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 pr-10 border border-[#D1E3EB] rounded-xl text-xs md:text-sm font-bold text-gray-800 focus:outline-none focus:border-[#017E9A] focus:ring-2 focus:ring-[#017E9A]/20 bg-[#F4F8FA]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  title={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Validando Credenciales...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice Footer */}
          <div className="pt-4 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-500 font-medium">
              Acceso protegido. Consulte con el Administrador si requiere restablecer su clave.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
