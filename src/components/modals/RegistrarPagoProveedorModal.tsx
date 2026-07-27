import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Check, DollarSign, Receipt } from 'lucide-react';
import { Supplier } from '../../types';

interface RegistrarPagoProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

export const RegistrarPagoProveedorModal: React.FC<RegistrarPagoProveedorModalProps> = ({
  isOpen,
  onClose,
  supplier,
}) => {
  const { registerSupplierPayment } = useApp();

  const [monto, setMonto] = useState<number>(0);
  const [metodo, setMetodo] = useState<string>('Transferencia');
  const [concepto, setConcepto] = useState<string>('Pago Parcial Cta Cte');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !supplier) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (monto <= 0) return;

    registerSupplierPayment(supplier.id, monto, metodo, concepto, fecha);
    setMonto(0);
    setConcepto('Pago Parcial Cta Cte');
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0B4F6C]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-[#D1E3EB] animate-fadeIn"
      >
        <div className="bg-[#E8F4F8] px-5 py-3.5 border-b border-[#D1E3EB] flex justify-between items-center">
          <h3 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Cargar Pago Efectuado a Proveedor
          </h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs md:text-sm">
          <div className="bg-[#F4F8FA] p-3 rounded-xl border border-[#D1E3EB]">
            <span className="text-gray-500 block text-[11px]">Proveedor Seleccionado:</span>
            <strong className="font-brand font-bold text-sm text-[#0B4F6C] block">{supplier.nombre}</strong>
            <div className="flex justify-between items-center pt-1 border-t border-gray-200 mt-1.5">
              <span className="text-gray-600">Saldo Actual Pendiente:</span>
              <span className="font-bold text-amber-700 font-mono text-sm">
                ${supplier.saldo.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Fecha de Pago</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Monto a Acreditar ($)</label>
              <input
                type="number"
                min="1"
                required
                placeholder="0.00"
                value={monto || ''}
                onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg font-bold text-emerald-800 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Forma de Pago</label>
            <select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
              className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white font-semibold text-gray-800"
            >
              <option value="Transferencia Bancaria">Transferencia Bancaria</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Cheque">Cheque Propio / Terceros</option>
              <option value="E-Cheq">E-Cheq</option>
              <option value="Mercado Pago">Mercado Pago</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Concepto / N° Comprobante</label>
            <input
              type="text"
              required
              placeholder="Ej: Pago de Factura A-0001 / Anticipo"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="w-full p-2 border border-[#D1E3EB] rounded-lg focus:outline-none focus:border-[#017E9A]"
            />
          </div>

          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs flex justify-between items-center">
            <span className="text-emerald-900 font-semibold">Nuevo Saldo Proyectado:</span>
            <strong className="text-emerald-700 font-bold font-mono text-sm">
              ${Math.max(0, supplier.saldo - monto).toLocaleString('es-AR')}
            </strong>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#D1E3EB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D1E3EB] text-gray-700 font-brand rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-brand font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Registrar Pago</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
