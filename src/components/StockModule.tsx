import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { OrderOP, Product } from '../types';
import { getReservedQtyForProduct } from '../utils/stockUtils';
import {
  Boxes,
  ShoppingCart,
  RotateCw,
  Warehouse,
  ChevronDown,
  Eye,
  EyeOff,
  ArrowRightLeft,
  DollarSign,
  Calendar,
  FileText,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Layers,
  Pencil,
  Plus,
  ArrowUpRight,
  Clock,
  PackageCheck,
} from 'lucide-react';

interface StockModuleProps {
  openVentaModal: () => void;
  setActiveTab: (tab: string) => void;
  onSelectOrderOP?: (order: OrderOP) => void;
  onEditOrderOP?: (order: OrderOP) => void;
}

type PeriodFilter = 'hoy' | '7dias' | 'mes' | 'año';

export const StockModule: React.FC<StockModuleProps> = ({
  openVentaModal,
  setActiveTab,
  onSelectOrderOP,
  onEditOrderOP,
}) => {
  const { products, movements, ordersOP, showValorizacion, setShowValorizacion, role } = useApp();

  const [period, setPeriod] = useState<PeriodFilter>('mes');
  const [showOrderTotals, setShowOrderTotals] = useState<boolean>(false);
  const [selectedMovType, setSelectedMovType] = useState<string>('todos');

  // Filter OP Orders by selected Period
  const filteredOrders = useMemo(() => {
    const today = new Date();
    return ordersOP.filter((order) => {
      if (!order.fecha) return true;
      const orderDate = new Date(order.fecha);
      const diffTime = Math.abs(today.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (period === 'hoy') {
        return order.fecha === today.toISOString().split('T')[0];
      }
      if (period === '7dias') {
        return diffDays <= 7;
      }
      if (period === 'mes') {
        return diffDays <= 30;
      }
      if (period === 'año') {
        return diffDays <= 365;
      }
      return true;
    });
  }, [ordersOP, period]);

  // Filter Movements by selected Period & Type
  const filteredMovements = useMemo(() => {
    const today = new Date();
    return movements.filter((mov) => {
      if (selectedMovType !== 'todos' && mov.tipo !== selectedMovType) {
        return false;
      }
      if (!mov.fecha) return true;
      const movDate = new Date(mov.fecha);
      const diffTime = Math.abs(today.getTime() - movDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (period === 'hoy') {
        return mov.fecha === today.toISOString().split('T')[0];
      }
      if (period === '7dias') {
        return diffDays <= 7;
      }
      if (period === 'mes') {
        return diffDays <= 30;
      }
      if (period === 'año') {
        return diffDays <= 365;
      }
      return true;
    });
  }, [movements, period, selectedMovType]);

  // Arqueo de Caja Calculations for Filtered Period (excluding Anulado orders)
  const arqueo = useMemo(() => {
    let efectivo = 0;
    let transferencia = 0;
    let ctaCte = 0;

    filteredOrders.forEach((o) => {
      if (o.estado === 'Anulado') return;
      if (o.formaPago === 'Efectivo') efectivo += o.total;
      else if (o.formaPago === 'Transferencia') transferencia += o.total;
      else ctaCte += o.total;
    });

    const totalCobrado = efectivo + transferencia;
    const totalGeneral = totalCobrado + ctaCte;

    return { efectivo, transferencia, ctaCte, totalCobrado, totalGeneral };
  }, [filteredOrders]);

  // Associated Product Pairs (e.g. Bulk 101 with Tray 201)
  const pairedProducts = useMemo(() => {
    const bulkProducts = products.filter((p) => p.codigo.startsWith('1'));
    const trayProducts = products.filter((p) => p.codigo.startsWith('2'));

    return bulkProducts.map((bulk) => {
      // Find matching tray product (e.g., code 101 -> 201)
      const matchingCode = '2' + bulk.codigo.substring(1);
      const tray = trayProducts.find((t) => t.codigo === matchingCode) || products.find(
        (t) => t.id !== bulk.id && t.nombre.toLowerCase().includes(bulk.nombre.replace('X KG.', '').trim().toLowerCase())
      );

      const granelKg = bulk.stockGranelKg || 0;
      const bandejas = tray?.stockBandejas || 0;
      const grsPerBandeja = bulk.grsPorBandeja || tray?.pesoGrs || 400;
      const bandejasProducibles = Math.floor((granelKg * 1000) / grsPerBandeja);
      const valBulk = granelKg * (bulk.costo || 0);
      const valTray = bandejas * (tray?.costo || (bulk.costo || 0) * 0.4);
      const valTotal = valBulk + valTray;

      return {
        bulk,
        tray,
        granelKg,
        bandejas,
        grsPerBandeja,
        bandejasProducibles,
        valTotal,
      };
    });
  }, [products]);

  // Total valuation calculation for associated stock
  const totalStockVal = useMemo(() => {
    return pairedProducts.reduce((acc, pair) => acc + (pair.valTotal || 0), 0);
  }, [pairedProducts]);

  return (
    <div className="space-y-6">
      {/* Top Header & Period Switcher */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#D1E3EB] pb-4 bg-white p-5 rounded-2xl shadow-sm border">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-7 h-7 text-[#017E9A]" />
            <h2 className="font-brand font-bold text-2xl text-[#0B4F6C]">
              Gestión Integrada: Preventa, Movimientos y Arqueo de Caja
            </h2>
          </div>
          <p className="text-xs md:text-sm text-[#607D8B] mt-1">
            Panel unificado de preventas, movimientos del día, arqueo de caja e inventario asociado (Granel vs. Bandejas).
          </p>
        </div>
      </div>

      {/* 3-COLUMN MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMN 1: PREVENTAS Y VENTAS DESGLOSADAS */}
        <div className="space-y-4 flex flex-col">
          <div className="bg-white rounded-2xl border border-[#D1E3EB] shadow-sm overflow-hidden flex-1 flex flex-col">
            {/* Card Header */}
            <div className="bg-[#E8F4F8] px-4 py-3 border-b border-[#D1E3EB] flex items-center justify-between">
              <h3 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#017E9A]" />
                1. Preventas y Ventas ({filteredOrders.length})
              </h3>

              <button
                onClick={() => setShowOrderTotals(!showOrderTotals)}
                title="Mostrar/Ocultar Totales de Valorización"
                className="p-1.5 bg-white hover:bg-slate-100 text-[#0B4F6C] rounded-lg border border-[#D1E3EB] transition-colors text-xs flex items-center gap-1 font-semibold"
              >
                {showOrderTotals ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ocultar Valorización</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Valorización</span>
                  </>
                )}
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
              {/* Sales Summary KPI */}
              <div className="bg-[#F4F8FA] p-3.5 rounded-xl border border-[#D1E3EB]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[#607D8B] font-bold uppercase tracking-wider block">
                    Total Pedidos en Período
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                  <h3 className="font-brand font-extrabold text-2xl text-[#0B4F6C]">
                    {showOrderTotals
                      ? `$${arqueo.totalGeneral.toLocaleString('es-AR')}`
                      : '••••••••'}
                  </h3>
                  <span className="text-xs font-bold text-[#017E9A]">
                    ({filteredOrders.length} {filteredOrders.length === 1 ? 'OP Emitida' : 'OPs Emitidas'})
                  </span>
                </div>
              </div>

              {/* OP Orders List */}
              <div className="space-y-2.5 overflow-y-auto max-h-[420px] pr-1">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs italic bg-slate-50 rounded-xl p-4 border border-dashed">
                    No hay preventas registradas para este período.
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3 bg-white hover:bg-[#F4F8FA] rounded-xl border border-[#D1E3EB] transition-colors flex justify-between items-center group shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#0B4F6C] bg-[#E8F4F8] px-2 py-0.5 rounded border border-[#D1E3EB]">
                            {order.numeroOP}
                          </span>
                          <span className="text-xs font-bold text-gray-800">
                            {order.clientNombre}
                          </span>
                          {order.estado === 'Reservado' ? (
                            <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                              RESERVA
                            </span>
                          ) : order.estado === 'Anulado' ? (
                            <span className="text-[10px] font-extrabold text-red-800 bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                              ANULADO
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                              CONFIRMADO
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500">
                          {order.items.length} item(s) • {order.fecha} • {order.formaPago}
                        </p>
                      </div>

                      <div className="text-right flex items-center gap-1.5">
                        <span className={`font-brand font-bold text-sm block mr-1 ${order.estado === 'Anulado' ? 'line-through text-gray-400' : 'text-[#0B4F6C]'}`}>
                          {showOrderTotals
                            ? `$${order.total.toLocaleString('es-AR')}`
                            : '•••••'}
                        </span>

                        {onEditOrderOP && (
                          <button
                            onClick={() => onEditOrderOP(order)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition-colors flex items-center gap-1 text-[11px] font-bold"
                            title="Editar / Confirmar Reserva"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                        )}

                        {onSelectOrderOP && (
                          <button
                            onClick={() => onSelectOrderOP(order)}
                            className="p-1.5 bg-[#E8F4F8] hover:bg-[#0B4F6C] text-[#0B4F6C] hover:text-white rounded-lg border border-[#D1E3EB] transition-colors"
                            title="Ver / Imprimir Comprobante OP"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action */}
              <button
                onClick={openVentaModal}
                className="w-full py-2.5 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>+ Nueva Preventa / Pedido OP</span>
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2: MOVIMIENTOS DEL DÍA Y HISTORIAL */}
        <div className="space-y-4 flex flex-col">
          <div className="bg-white rounded-2xl border border-[#D1E3EB] shadow-sm overflow-hidden flex-1 flex flex-col">
            {/* Card Header */}
            <div className="bg-[#E8F4F8] px-4 py-3 border-b border-[#D1E3EB] flex items-center justify-between">
              <h3 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#017E9A]" />
                2. Movimientos y Trazabilidad ({filteredMovements.length})
              </h3>

              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-[#D1E3EB]">
                <Filter className="w-3 h-3 text-gray-500" />
                <select
                  value={selectedMovType}
                  onChange={(e) => setSelectedMovType(e.target.value)}
                  className="text-[11px] font-semibold text-gray-700 bg-transparent border-none focus:outline-none"
                >
                  <option value="todos">Todos</option>
                  <option value="Salida Preventa">Salidas</option>
                  <option value="Entrada Stock">Entradas</option>
                  <option value="Ajuste Manual">Ajustes Manuales</option>
                  <option value="Fraccionamiento">Fraccionamientos</option>
                  <option value="Cobro Cta Cte">Cobros</option>
                </select>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                {filteredMovements.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs italic bg-slate-50 rounded-xl p-4 border border-dashed">
                    Sin movimientos para el período seleccionado.
                  </div>
                ) : (
                  filteredMovements.map((mov) => (
                    <div
                      key={mov.id}
                      className="p-3 bg-white hover:bg-[#F4F8FA] rounded-xl border border-[#D1E3EB] transition-colors flex justify-between items-start text-xs space-x-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              mov.tipo === 'Salida Preventa'
                                ? 'bg-amber-100 text-amber-800'
                                : mov.tipo === 'Entrada Stock'
                                ? 'bg-emerald-100 text-emerald-800'
                                : mov.tipo === 'Ajuste Manual'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : mov.tipo === 'Cobro Cta Cte'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {mov.tipo}
                          </span>
                          <span className="text-[11px] font-mono text-gray-400">
                            {mov.fecha}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-800 text-xs">{mov.item}</p>
                        <p className="text-[11px] text-gray-500">
                          Cliente/Orig: <strong>{mov.clienteProveedor}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-[#0B4F6C] text-xs bg-[#E8F4F8] px-2 py-1 rounded-lg inline-block">
                          {mov.cantidad}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: PANEL DE ACCIONES Y ARQUEO DE CAJA */}
        <div className="space-y-4 flex flex-col h-full">
          <div className="bg-white rounded-2xl border border-[#D1E3EB] shadow-sm p-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3.5">
              <h3 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2 border-b border-[#D1E3EB] pb-2">
                <DollarSign className="w-5 h-5 text-[#017E9A]" />
                3. Acciones y Arqueo de Caja
              </h3>

              {/* Action Buttons Panel */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Acciones Rápidas
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={openVentaModal}
                    className="p-3 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cargar Preventa</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('mod-fraccionamiento')}
                    className="p-3 bg-[#E8F4F8] hover:bg-[#d1e8f0] text-[#0B4F6C] border border-[#D1E3EB] font-brand rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all transform active:scale-98"
                  >
                    <PackageCheck className="w-4 h-4 text-[#017E9A]" />
                    <span>Fraccionar</span>
                  </button>
                </div>

                {/* Period Selector inside Acciones Rápidas */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Filtro de Período
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-[#E8F4F8] p-1 rounded-xl border border-[#D1E3EB] text-xs font-semibold">
                    <button
                      onClick={() => setPeriod('hoy')}
                      className={`py-1.5 rounded-lg text-center transition-all ${
                        period === 'hoy'
                          ? 'bg-[#0B4F6C] text-white shadow-sm font-bold'
                          : 'text-[#0B4F6C] hover:bg-white/60'
                      }`}
                    >
                      Hoy
                    </button>
                    <button
                      onClick={() => setPeriod('7dias')}
                      className={`py-1.5 rounded-lg text-center transition-all ${
                        period === '7dias'
                          ? 'bg-[#0B4F6C] text-white shadow-sm font-bold'
                          : 'text-[#0B4F6C] hover:bg-white/60'
                      }`}
                    >
                      7 Días
                    </button>
                    <button
                      onClick={() => setPeriod('mes')}
                      className={`py-1.5 rounded-lg text-center transition-all ${
                        period === 'mes'
                          ? 'bg-[#0B4F6C] text-white shadow-sm font-bold'
                          : 'text-[#0B4F6C] hover:bg-white/60'
                      }`}
                    >
                      Mes
                    </button>
                    <button
                      onClick={() => setPeriod('año')}
                      className={`py-1.5 rounded-lg text-center transition-all ${
                        period === 'año'
                          ? 'bg-[#0B4F6C] text-white shadow-sm font-bold'
                          : 'text-[#0B4F6C] hover:bg-white/60'
                      }`}
                    >
                      Año
                    </button>
                  </div>
                </div>
              </div>

              {/* Botonera / Arqueo de Caja Grid */}
              <div className="space-y-2 pt-2 border-t border-[#D1E3EB]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Arqueo del Período
                  </span>
                  <span className="text-[11px] font-bold text-[#0B4F6C]">
                    {period === 'hoy' ? 'Hoy' : period === '7dias' ? '7 días' : period === 'mes' ? 'Mes' : 'Año'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-emerald-700 font-bold text-[10px] block flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Efectivo
                      </span>
                      <span className="font-brand font-extrabold text-sm text-emerald-900 mt-0.5 block">
                        ${arqueo.efectivo.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-teal-700 font-bold text-[10px] block flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> Transferencia
                      </span>
                      <span className="font-brand font-extrabold text-sm text-teal-900 mt-0.5 block">
                        ${arqueo.transferencia.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-amber-700 font-bold text-[10px] block flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Cta. Cte.
                      </span>
                      <span className="font-brand font-extrabold text-sm text-amber-900 mt-0.5 block">
                        ${arqueo.ctaCte.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#0B4F6C] text-white rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-sky-200 font-bold text-[10px] block">
                        Total Arqueado
                      </span>
                      <span className="font-brand font-extrabold text-sm text-white mt-0.5 block">
                        ${arqueo.totalGeneral.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: STOCK PRODUCTOS ASOCIADOS (GRANEL / BANDEJAS) */}
      <div id="sec-stock-productos" className="bg-white rounded-2xl border border-[#D1E3EB] shadow-sm overflow-hidden mt-6">
        <div className="bg-[#E8F4F8] px-5 py-3.5 border-b border-[#D1E3EB] flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#017E9A]" />
            Stock Productos Asociados (Granel / Bandejas)
          </h3>

          <div className="flex items-center gap-2">
            <span className="font-brand font-extrabold text-xs md:text-sm text-[#0B4F6C] bg-white px-3 py-1 rounded-lg border border-[#D1E3EB]">
              Valorización Total: {showValorizacion ? `$${Math.round(totalStockVal).toLocaleString('es-AR')}` : '••••••••'}
            </span>
            <button
              onClick={() => setShowValorizacion(!showValorizacion)}
              className="p-1.5 bg-white hover:bg-slate-100 text-[#0B4F6C] rounded-lg border border-[#D1E3EB] transition-colors text-xs font-bold"
              title="Mostrar u ocultar valorización"
            >
              {showValorizacion ? 'Ocultar Valorización' : 'Ver Valorización'}
            </button>
          </div>
        </div>

        {/* Explanation Banner */}
        <div className="bg-[#E8F4F8]/60 p-3 border-b border-[#D1E3EB] text-xs text-[#0B4F6C] font-brand">
          <strong>Relación de Productos:</strong> El código <strong>101</strong> (Granel x Kg) es el producto fraccionado para producir la bandeja <strong>201</strong> (400g / 16 u.).
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse font-brand">
            <thead>
              <tr className="bg-[#E8F4F8] text-[#0B4F6C] border-b border-[#D1E3EB]">
                <th className="p-3 font-bold">Producto (Granel ➔ Bandeja)</th>
                <th className="p-3 font-bold text-center">Stock Granel</th>
                <th className="p-3 font-bold text-center">Bandejas Armadas</th>
                <th className="p-3 font-bold text-center">Producibles desde Granel</th>
                {showValorizacion && <th className="p-3 font-bold text-right">Valorización</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1E3EB]">
              {pairedProducts.map((pair, idx) => {
                const bulkReserved = getReservedQtyForProduct(pair.bulk, ordersOP);
                const trayReserved = pair.tray ? getReservedQtyForProduct(pair.tray, ordersOP) : 0;

                return (
                  <tr key={idx} className="hover:bg-[#E8F4F8]/40 transition-colors">
                    <td className="p-3 font-semibold text-gray-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-[#0B4F6C] bg-[#E8F4F8] px-2 py-0.5 rounded font-bold border border-[#D1E3EB]">
                          [{pair.bulk.codigo} ➔ {pair.tray?.codigo || '201'}]
                        </span>
                        <span>{pair.bulk.nombre.replace('X KG.', '').trim()}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold text-[#0B4F6C]">
                      {pair.granelKg}
                      {bulkReserved > 0 && (
                        <span
                          className="ml-1 text-amber-900 bg-amber-100 border border-amber-300 font-extrabold px-1.5 py-0.5 rounded text-xs inline-block"
                          title={`${bulkReserved} Kg reservados en Preventa (RESERVA)`}
                        >
                          (-{bulkReserved}*)
                        </span>
                      )}{' '}
                      <span className="text-xs font-normal text-gray-500">Kg</span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`font-bold px-2.5 py-1 rounded-lg ${
                          pair.bandejas <= 5
                            ? 'bg-red-100 text-red-700 font-extrabold border border-red-200'
                            : 'bg-sky-100 text-[#017E9A] border border-sky-200'
                        }`}
                      >
                        {pair.bandejas}
                        {trayReserved > 0 && (
                          <span
                            className="ml-1 text-amber-900 bg-amber-200 border border-amber-400 font-black px-1.5 py-0.5 rounded text-[11px]"
                            title={`${trayReserved} bandejas reservadas en Preventa (RESERVA)`}
                          >
                            (-{trayReserved}*)
                          </span>
                        )}{' '}
                        band.
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold inline-block">
                        ~{pair.bandejasProducibles} bandejas
                      </span>
                    </td>
                    {showValorizacion && (
                      <td className="p-3 text-right font-bold text-emerald-700">
                        ${Math.round(pair.valTotal).toLocaleString('es-AR')}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footnote Legend for Reserved Stock */}
        <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-xs text-amber-900 font-bold flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>* Cantidad Reservada:</strong> Muestra la cantidad de producto comprometida en Órdenes de Pedido en estado <strong>RESERVA</strong>.</span>
          </span>
        </div>
      </div>
    </div>
  );
};
