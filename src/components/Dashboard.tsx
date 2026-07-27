import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Boxes,
  HandCoins,
  ShoppingCart,
  AlertTriangle,
  Printer,
  FileText,
  CheckCircle2,
  TrendingUp,
  Building2,
  Shield,
  UserCheck,
  Search,
  ArrowUpRight,
  Receipt,
  RotateCw,
  Package,
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  openVentaModal: () => void;
  openNotaCompraModal: (prefilled?: any) => void;
  onSelectCliente: (id: number | string) => void;
  onNavigateToProveedores?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  openVentaModal,
  openNotaCompraModal,
  onSelectCliente,
  onNavigateToProveedores,
}) => {
  const { products, clients, movements, suppliers, rawMaterials, ordersOP, role, systemConfig } = useApp();

  const [activeRolePerspective, setActiveRolePerspective] = useState<'Admin' | 'Vendedor'>(
    role || 'Admin'
  );
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  // Common Calculations
  const totalBandejas = products.reduce((acc, p) => acc + (p.stockBandejas || 0), 0);
  const totalKg = products.reduce((acc, p) => acc + (p.stockGranelKg || 0), 0);

  const deudores = clients.filter((c) => c.saldo > 0);
  const totalDeudaClientes = deudores.reduce((acc, c) => acc + c.saldo, 0);

  const proveedoresConSaldo = suppliers.filter((s) => s.saldo > 0);
  const totalDeudaProveedores = proveedoresConSaldo.reduce((acc, s) => acc + s.saldo, 0);

  const preventaMovs = movements.filter((m) => m.tipo === 'Salida Preventa');

  const lowStockProducts = products.filter(
    (p) => (p.stockBandejas || 0) <= 5 && (p.stockGranelKg || 0) <= 5
  );

  const outdatedInsumos = rawMaterials.filter((m) => {
    if (!m.fechaUltimaActualizacionCosto) return true;
    const diffTime = Math.abs(new Date().getTime() - new Date(m.fechaUltimaActualizacionCosto).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > (systemConfig?.diasAlertaDesactualizacionCosto || 30);
  });

  const totalInventoryValuation = products.reduce((acc, p) => {
    const costKg = p.costo || 0;
    const valKg = (p.stockGranelKg || 0) * costKg;
    const valBandejas = (p.stockBandejas || 0) * (costKg * ((p.pesoGrs || 400) / 1000));
    return acc + valKg + valBandejas;
  }, 0);

  const pendingReservas = ordersOP.filter((o) => o.estado === 'Reservado');

  const filteredClientsForVendedor = clients.filter(
    (c) =>
      c.nombre.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      c.telefono.includes(clientSearchTerm)
  );

  const [lastSyncDate, setLastSyncDate] = useState<Date>(() => new Date());
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    const now = new Date();
    return `${now.toLocaleDateString('es-AR')} ${now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`;
  });
  const [elapsedText, setElapsedText] = useState<string>('Hace unos segundos');

  const updateElapsedText = (syncDate: Date) => {
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - syncDate.getTime()) / 1000);
    if (diffSec < 10) {
      setElapsedText('Hace unos segundos');
    } else if (diffSec < 60) {
      setElapsedText(`Hace ${diffSec} segundos`);
    } else if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      setElapsedText(`Hace ${mins} min${mins > 1 ? 's' : ''}`);
    } else {
      const hrs = Math.floor(diffSec / 3600);
      setElapsedText(`Hace ${hrs} hora${hrs > 1 ? 's' : ''}`);
    }
  };

  useEffect(() => {
    updateElapsedText(lastSyncDate);
    const timer = setInterval(() => {
      updateElapsedText(lastSyncDate);
    }, 5000);
    return () => clearInterval(timer);
  }, [lastSyncDate]);

  const handleRefreshSync = () => {
    const now = new Date();
    setLastSyncDate(now);
    setLastSyncTime(`${now.toLocaleDateString('es-AR')} ${now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`);
    updateElapsedText(now);
  };

  const handleNavigateToSection = (tab: string, elementId?: string) => {
    setActiveTab(tab);
    if (elementId) {
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  const todayStr = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#D1E3EB] pb-4">
        <div>
          <h2 className="font-brand font-bold text-2xl text-[#0B4F6C] flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-[#017E9A]" />
            Panel General Frizame
          </h2>
          <p className="text-sm text-[#607D8B]">
            Resumen ejecutivo del negocio. Haz clic en cualquier tarjeta para navegar directamente al detalle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="bg-[#E8F4F8] text-[#0B4F6C] font-semibold text-xs px-3 py-1 rounded-full capitalize border border-[#017E9A]/20">
              {todayStr}
            </span>
            <span className="text-[11px] text-[#017E9A] font-medium flex items-center gap-1 mt-1">
              <RotateCw className="w-3 h-3 animate-spin-slow" />
              Última sincr.: <strong>{lastSyncTime}</strong>
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-0.5 shadow-2xs">
              ⏱ Transcurrido: {elapsedText}
            </span>
          </div>
          <button
            onClick={handleRefreshSync}
            title="Actualizar / Sincronizar datos"
            className="p-1.5 bg-[#E8F4F8] hover:bg-[#017E9A] text-[#0B4F6C] hover:text-white rounded-lg transition-colors border border-[#D1E3EB]"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stock Card */}
        <div
          onClick={() => setActiveTab('mod-stock')}
          className="bg-white p-4 rounded-xl border border-[#D1E3EB] shadow-sm hover:shadow-md hover:border-[#017E9A] transition-all cursor-pointer flex items-center gap-4 group"
        >
          <div className="w-13 h-13 rounded-xl bg-[#0B4F6C] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#607D8B]">Stock Disponible Total</span>
            <h3 className="font-brand font-bold text-xl text-[#0B4F6C]">
              {totalBandejas} Band. | {totalKg} Kg
            </h3>
            <small className="text-xs text-gray-500">Kg a granel + Bandejas</small>
          </div>
        </div>

        {/* Debts Card */}
        <div
          onClick={() => setActiveTab('mod-clientes')}
          className="bg-white p-4 rounded-xl border border-[#D1E3EB] shadow-sm hover:shadow-md hover:border-[#017E9A] transition-all cursor-pointer flex items-center gap-4 group"
        >
          <div className="w-13 h-13 rounded-xl bg-[#FF9F1C] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <HandCoins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#607D8B]">Cuentas por Cobrar (Deuda)</span>
            <h3 className="font-brand font-bold text-xl text-[#FF9F1C]">
              ${totalDeudaClientes.toLocaleString('es-AR')}
            </h3>
            <small className="text-xs font-medium text-amber-600">
              {deudores.length} clientes con saldo
            </small>
          </div>
        </div>

        {/* Preventas Card */}
        <div
          onClick={() => setActiveTab('mod-stock')}
          className="bg-white p-4 rounded-xl border border-[#D1E3EB] shadow-sm hover:shadow-md hover:border-[#017E9A] transition-all cursor-pointer flex items-center gap-4 group"
        >
          <div className="w-13 h-13 rounded-xl bg-[#017E9A] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#607D8B]">Preventas Registradas</span>
            <h3 className="font-brand font-bold text-xl text-[#017E9A]">
              {preventaMovs.length} ops.
            </h3>
            <small className="text-xs text-gray-500">Historial de movimientos</small>
          </div>
        </div>

        {/* Alerts Card */}
        <div
          onClick={openNotaCompraModal}
          className="bg-white p-4 rounded-xl border border-[#D1E3EB] shadow-sm hover:shadow-md hover:border-[#E74C3C] transition-all cursor-pointer flex items-center gap-4 group"
        >
          <div className="w-13 h-13 rounded-xl bg-[#E74C3C] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#607D8B]">Alertas de Stock Bajo</span>
            <h3 className="font-brand font-bold text-xl text-[#E74C3C]">
              {lowStockProducts.length} Alertas
            </h3>
            <small className="text-xs text-red-600 font-medium">Generar Nota de Compra</small>
          </div>
        </div>
      </div>

      {/* Quick Actions & Alerts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden">
          <div className="bg-[#E8F4F8] px-5 py-3 border-b border-[#D1E3EB]">
            <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#017E9A]" />
              Acciones Rápidas
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Primary Actions */}
            <button
              onClick={openVentaModal}
              className="py-2.5 px-3 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand font-bold rounded-lg text-xs md:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Nueva Venta</span>
            </button>

            <button
              onClick={() => setActiveTab('mod-rotulos')}
              className="py-2.5 px-3 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-bold rounded-lg text-xs md:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Materiales</span>
            </button>

            <button
              onClick={openNotaCompraModal}
              className="py-2.5 px-3 bg-[#FF9F1C] hover:bg-[#e08912] text-white font-brand font-bold rounded-lg text-xs md:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Nueva Adquisición</span>
            </button>

            {/* Navigation Actions with Rich Themed Color Palette */}
            <button
              onClick={() => handleNavigateToSection('mod-fraccionamiento', 'sec-fraccionamiento')}
              className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-brand font-bold rounded-lg text-xs md:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <RotateCw className="w-4 h-4 text-indigo-100" />
              <span>Fraccionar</span>
            </button>

            <button
              onClick={() => handleNavigateToSection('mod-stock', 'sec-stock-productos')}
              className="py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-brand font-bold rounded-lg text-xs md:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Boxes className="w-4 h-4 text-teal-100" />
              <span>Consultar Stock</span>
            </button>

            <button
              onClick={() => setActiveTab('mod-clientes')}
              className="py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-brand font-bold rounded-lg text-xs md:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <HandCoins className="w-4 h-4 text-sky-100" />
              <span>Clientes</span>
            </button>

            <button
              onClick={() => {
                if (onNavigateToProveedores) {
                  onNavigateToProveedores();
                } else {
                  setActiveTab('mod-costos');
                }
              }}
              className="py-2.5 px-3 bg-slate-700 hover:bg-slate-800 text-white font-brand font-bold rounded-lg text-xs md:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Building2 className="w-4 h-4 text-slate-200" />
              <span>Proveedores</span>
            </button>

            <button
              onClick={() => handleNavigateToSection('mod-fraccionamiento', 'sec-catalogo-productos')}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-brand font-bold rounded-lg text-xs md:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Package className="w-4 h-4 text-emerald-100" />
              <span>Productos</span>
            </button>

            <button
              onClick={() => setActiveTab('mod-configuracion')}
              className="py-2.5 px-3 bg-violet-600 hover:bg-violet-700 text-white font-brand font-bold rounded-lg text-xs md:text-sm transition-colors flex items-center justify-center gap-2 sm:col-span-2 shadow-xs"
            >
              <UserCheck className="w-4 h-4 text-violet-100" />
              <span>Configuración</span>
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden">
          <div className="bg-[#E8F4F8] px-5 py-3 border-b border-[#D1E3EB]">
            <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#FF9F1C]" />
              Alertas de Stock y Deudores
            </h3>
          </div>
          <div className="p-5">
            {lowStockProducts.length === 0 && deudores.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-4 rounded-lg text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>¡Todo al día! Sin alertas pendientes de stock ni deudas.</span>
              </div>
            ) : (
              <ul className="divide-y divide-[#D1E3EB] max-h-72 overflow-y-auto">
                {lowStockProducts.map((p) => (
                  <li key={`low-${p.id}`} className="py-3 flex items-center justify-between gap-2 text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        Stock Bajo: <strong>{p.nombre}</strong> ({p.stockBandejas || 0} band. / {p.stockGranelKg || 0} kg)
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        openNotaCompraModal({
                          type: 'producto',
                          itemId: p.id,
                          nombre: p.nombre,
                          cantidadSugerida: 20,
                        })
                      }
                      className="px-2.5 py-1 bg-[#E8F4F8] text-[#0B4F6C] hover:bg-[#017E9A] hover:text-white rounded-md font-brand font-bold text-xs transition-colors shrink-0"
                    >
                      Reponer
                    </button>
                  </li>
                ))}

                {deudores.map((c) => (
                  <li key={`debt-${c.id}`} className="py-3 flex items-center justify-between gap-2 text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                      <HandCoins className="w-4 h-4 text-red-500 shrink-0" />
                      <span>
                        Deuda: <strong>{c.nombre}</strong> (${c.saldo.toLocaleString('es-AR')})
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('mod-clientes');
                        onSelectCliente(c.id);
                      }}
                      className="px-2.5 py-1 bg-[#FF9F1C] text-white hover:bg-amber-600 rounded-md font-brand text-xs transition-colors shrink-0"
                    >
                      Cobrar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
