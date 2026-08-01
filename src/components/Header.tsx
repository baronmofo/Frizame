import React from 'react';
import { useApp } from '../context/AppContext';
import { FrizameLogo } from './FrizameLogo';
import {
  LayoutDashboard,
  Scale,
  Users,
  Printer,
  Calculator,
  ShieldCheck,
  Settings,
  LogOut,
  User as UserIcon,
  Boxes,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { role, currentUser, requireLogin, logoutUser } = useApp();

  return (
    <header className="no-print bg-gradient-to-r from-[#0B4F6C] to-[#083b52] text-white px-3 sm:px-4 py-2.5 sm:py-3 shadow-md sticky top-0 z-50 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div
          className="flex items-center cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => setActiveTab('mod-dashboard')}
        >
          <FrizameLogo variant="header" className="h-10" />
        </div>

        {/* Navigation Tabs (Native Mobile Botonera Style) */}
        <nav className="flex items-center justify-around sm:justify-start gap-1 sm:gap-1.5 overflow-x-auto max-w-full py-1.5 px-1.5 bg-[#083144]/80 sm:bg-white/10 rounded-2xl backdrop-blur-md border border-white/15 shadow-inner scrollbar-none snap-x snap-mandatory">
          <button
            onClick={() => setActiveTab('mod-dashboard')}
            title="Inicio"
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-brand text-xs sm:text-sm font-semibold transition-all shrink-0 snap-start active:scale-95 touch-manipulation ${
              activeTab === 'mod-dashboard'
                ? 'bg-[#017E9A] text-white shadow-md border border-sky-300/30'
                : 'text-sky-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Inicio</span>
          </button>

          <button
            onClick={() => setActiveTab('mod-stock')}
            title="Ventas"
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-brand text-xs sm:text-sm font-semibold transition-all shrink-0 snap-start active:scale-95 touch-manipulation ${
              activeTab === 'mod-stock'
                ? 'bg-[#017E9A] text-white shadow-md border border-sky-300/30'
                : 'text-sky-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Boxes className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Ventas</span>
          </button>

          <button
            onClick={() => setActiveTab('mod-clientes')}
            title="Clientes"
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-brand text-xs sm:text-sm font-semibold transition-all shrink-0 snap-start active:scale-95 touch-manipulation ${
              activeTab === 'mod-clientes'
                ? 'bg-[#017E9A] text-white shadow-md border border-sky-300/30'
                : 'text-sky-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Clientes</span>
          </button>

          <button
            onClick={() => setActiveTab('mod-fraccionamiento')}
            title="Productos"
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-brand text-xs sm:text-sm font-semibold transition-all shrink-0 snap-start active:scale-95 touch-manipulation ${
              activeTab === 'mod-fraccionamiento'
                ? 'bg-[#017E9A] text-white shadow-md border border-sky-300/30'
                : 'text-sky-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Scale className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Productos</span>
          </button>

          {role === 'Admin' && (
            <button
              onClick={() => setActiveTab('mod-costos')}
              title="Costos"
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-brand text-xs sm:text-sm font-semibold transition-all shrink-0 snap-start active:scale-95 touch-manipulation ${
                activeTab === 'mod-costos'
                  ? 'bg-[#017E9A] text-white shadow-md border border-sky-300/30'
                  : 'text-sky-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Calculator className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Costos</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('mod-rotulos')}
            title="Imprimir"
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-brand text-xs sm:text-sm font-semibold transition-all shrink-0 snap-start active:scale-95 touch-manipulation ${
              activeTab === 'mod-rotulos'
                ? 'bg-[#017E9A] text-white shadow-md border border-sky-300/30'
                : 'text-sky-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Printer className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            onClick={() => setActiveTab('mod-configuracion')}
            title="Configuración"
            aria-label="Configuración"
            className={`flex items-center justify-center p-2.5 sm:px-3 sm:py-2 rounded-xl font-brand transition-all shrink-0 snap-start active:scale-95 touch-manipulation ${
              activeTab === 'mod-configuracion'
                ? 'bg-[#017E9A] text-white shadow-md border border-sky-300/30'
                : 'text-sky-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
          </button>
        </nav>

        {/* Role Selector & User Actions */}
        <div className="flex items-center gap-2">
          {/* User Role Badge (Role is managed in Config) */}
          <div className="bg-white/15 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-white text-xs font-semibold border border-white/10 shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#A3D9E8] shrink-0" />
            <span className="font-brand font-semibold text-xs text-sky-100">
              Rol: {role === 'Admin' ? 'Administrador' : 'Vendedor / Operador'}
            </span>
          </div>

          {currentUser && (
            <div className="bg-white/15 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-white text-xs" title={`Sesión activa: ${currentUser.email}`}>
              <UserIcon className="w-3.5 h-3.5 text-sky-200" />
              <span className="font-semibold max-w-[120px] truncate hidden sm:inline">
                {currentUser.nombre.split(' ')[0]}
              </span>
            </div>
          )}

          {(requireLogin || currentUser) && (
            <button
              onClick={logoutUser}
              title="Cerrar Sesión de Usuario"
              className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-100 rounded-lg font-brand text-xs font-bold transition-colors border border-red-400/30 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Salir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
