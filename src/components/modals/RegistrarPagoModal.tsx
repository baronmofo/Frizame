import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HandCoins, X, Check } from 'lucide-react';

interface RegistrarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number | string | null;
}

export const RegistrarPagoModal: React.FC<RegistrarPagoModalProps> = ({
  isOpen,
  onClose,
  clientId,
}) => {
  const { clients, registerPayment } = useApp();

  const client = clients.find((c) => c.id === clientId || String(c.id) === String(clientId));

  const [monto, setMonto] = useState<number>(client?.saldo || 0);
  const [metodo, setMetodo] = useState('Efectivo');
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Update default payment amount when client changes
  React.useEffect(() => {
    if (client) {
      setMonto(client.saldo);
      setFecha(new Date().toISOString().split('T')[0]);
    }
  }, [clientId, client]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !client) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (monto <= 0) return;

    registerPayment(client.id, monto, metodo, fecha);
    alert(
      `¡Pago de $${monto.toLocaleString(
        'es-AR'
      )} registrado el ${fecha} para ${client.nombre} via ${metodo}!`
    );
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
          <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-[#017E9A]" />
            Registrar Pago del Cliente
          </h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs md:text-sm">
          <div>
            <label className="text-xs text-gray-500 font-semibold block">Cliente:</label>
            <h4 className="font-brand font-bold text-lg text-[#0B4F6C]">{client.nombre}</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#E8F4F8] p-3 rounded-xl border border-[#D1E3EB]">
            <div>
              <span className="text-xs text-gray-500 block font-semibold">Saldo Pendiente:</span>
              <h3 className="font-brand font-bold text-base text-amber-600">
                ${client.saldo.toLocaleString('es-AR')}
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                Monto a Abonar ($)
              </label>
              <input
                type="number"
                min="1"
                required
                value={monto}
                onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                className="w-full p-1.5 border border-[#D1E3EB] rounded-lg font-bold text-[#0B4F6C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Fecha del Pago
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white focus:outline-none focus:border-[#017E9A]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Método de Pago
              </label>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white focus:outline-none focus:border-[#017E9A]"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Mercado Pago QR">Mercado Pago QR</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#D1E3EB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D1E3EB] text-gray-700 font-brand rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Registrar Cobro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
