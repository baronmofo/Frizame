import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { FrizameLogo } from './FrizameLogo';
import {
  PieChart,
  Boxes,
  Users,
  Printer,
  RotateCw,
  Calculator,
  ShieldCheck,
  Download,
  Upload,
  Settings,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { role, setRole, exportData, importData, currentUser, requireLogin, logoutUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        const success = importData(jsonData);
        if (success) {
          alert('¡Datos importados con éxito!');
        } else {
          alert('El archivo no tiene la estructura correcta de Frizame.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="no-print bg-gradient-to-r from-[#0B4F6C] to-[#083b52] text-white px-4 py-3 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div
          className="flex items-center cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => setActiveTab('mod-dashboard')}
        >
          <FrizameLogo variant="header" className="h-10" />
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap gap-1 bg-white/10 p-1.5 rounded-xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab('mod-dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-brand text-xs md:text-sm font-medium transition-all ${
              activeTab === 'mod-dashboard'
                ? 'bg-[#017E9A] text-white shadow-md'
                : 'text-sky-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('mod-stock')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-brand text-xs md:text-sm font-medium transition-all ${
              activeTab === 'mod-stock'
                ? 'bg-[#017E9A] text-white shadow-md'
                : 'text-sky-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>1. Ventas</span>
          </button>

          <button
            onClick={() => setActiveTab('mod-clientes')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-brand text-xs md:text-sm font-medium transition-all ${
              activeTab === 'mod-clientes'
                ? 'bg-[#017E9A] text-white shadow-md'
                : 'text-sky-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Clientes</span>
          </button>

          <button
            onClick={() => setActiveTab('mod-rotulos')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-brand text-xs md:text-sm font-medium transition-all ${
              activeTab === 'mod-rotulos'
                ? 'bg-[#017E9A] text-white shadow-md'
                : 'text-sky-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>3. Imprimir</span>
          </button>

          <button
            onClick={() => setActiveTab('mod-fraccionamiento')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-brand text-xs md:text-sm font-medium transition-all ${
              activeTab === 'mod-fraccionamiento'
                ? 'bg-[#017E9A] text-white shadow-md'
                : 'text-sky-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            <span>4. Productos</span>
          </button>

          {role === 'Admin' && (
            <button
              onClick={() => setActiveTab('mod-costos')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-brand text-xs md:text-sm font-medium transition-all ${
                activeTab === 'mod-costos'
                  ? 'bg-[#017E9A] text-white shadow-md'
                  : 'text-sky-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>5. Proveedores</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('mod-configuracion')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-brand text-xs md:text-sm font-medium transition-all ${
              activeTab === 'mod-configuracion'
                ? 'bg-[#017E9A] text-white shadow-md'
                : 'text-sky-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>6. Configuración</span>
          </button>
        </nav>

        {/* Role Selector & Backup Actions */}
        <div className="flex items-center gap-2">
          <div className="bg-white/15 px-3 py-1 rounded-lg flex items-center gap-2 text-white text-xs">
            <ShieldCheck className="w-4 h-4 text-[#A3D9E8]" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'Admin' | 'Vendedor')}
              className="bg-transparent text-white font-brand font-semibold outline-none cursor-pointer text-xs focus:bg-[#0B4F6C]"
            >
              <option value="Admin" className="bg-[#0B4F6C] text-white">
                Rol: Administrador
              </option>
              <option value="Vendedor" className="bg-[#0B4F6C] text-white">
                Rol: Vendedor / Operador
              </option>
            </select>
          </div>

          {currentUser && (
            <div className="bg-white/15 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-white text-xs" title={`Sesión activa: ${currentUser.email}`}>
              <UserIcon className="w-3.5 h-3.5 text-sky-200" />
              <span className="font-semibold max-w-[120px] truncate hidden sm:inline">
                {currentUser.nombre.split(' ')[0]}
              </span>
            </div>
          )}

          <button
            onClick={exportData}
            title="Respaldar Datos (JSON)"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors border border-white/10"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Importar Backup"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors border border-white/10"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

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
