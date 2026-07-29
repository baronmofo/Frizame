import React from 'react';
import { OrderOP } from '../../types';
import { Printer, X, CheckCircle } from 'lucide-react';
import { FrizameLogo } from '../FrizameLogo';

interface ReceiptOPModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderOP | null;
}

export const ReceiptOPModal: React.FC<ReceiptOPModalProps> = ({ isOpen, onClose, order }) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0B4F6C]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-[#D1E3EB] flex flex-col max-h-[90vh]"
      >
        {/* Modal Top Actions */}
        <div className="bg-[#0B4F6C] text-white px-5 py-3 flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-brand font-bold text-base">
              ¡Preventa Confirmada! — Comprobante Orden de Pedido
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#017E9A] hover:bg-[#016278] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir OP</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg text-white/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-[#1C2D37] print-content">
          {/* Header Receipt */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-[#0B4F6C] pb-4 gap-4">
            <div className="flex items-center gap-3">
              <FrizameLogo className="w-16 h-16" />
              <div>
                <h1 className="font-brand font-extrabold text-2xl text-[#0B4F6C] leading-none">
                  FRIZAME
                </h1>
                <p className="text-xs font-semibold text-[#017E9A] uppercase tracking-wider mt-1">
                  Productos Congelados • Venta Directa &amp; Distribuidores
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Buenos Aires, Argentina • Tel: 11-6409-6233
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right bg-[#E8F4F8] p-3 rounded-xl border border-[#D1E3EB] w-full sm:w-auto">
              <span className="text-xs text-gray-500 uppercase tracking-wider block font-bold">
                COMPROBANTE OP
              </span>
              <h2 className="font-mono font-bold text-xl text-[#0B4F6C]">
                {order.numeroOP}
              </h2>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    order.estado === 'Reservado'
                      ? 'bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  ESTADO: {order.estado || 'Confirmado'}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-600 block mt-1">
                Fecha: <strong>{order.fecha}</strong>
              </span>
            </div>
          </div>

          {/* Client & Order Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F4F8FA] p-4 rounded-xl border border-[#D1E3EB] text-xs md:text-sm">
            <div>
              <span className="text-[#017E9A] font-bold uppercase text-[11px] block mb-1">
                Datos del Cliente
              </span>
              <p className="font-bold text-gray-800 text-base">{order.clientNombre}</p>
              <p className="text-gray-600">
                Canal: <span className="font-semibold text-[#0B4F6C]">{order.canal}</span>
              </p>
              {order.clientTelefono && (
                <p className="text-gray-600">Tel: {order.clientTelefono}</p>
              )}
              {order.clientDireccion && (
                <p className="text-gray-600">
                  Dir: {order.clientDireccion}{order.clientLocalidad ? `, ${order.clientLocalidad}` : ''}
                </p>
              )}
              {order.clientContacto && (
                <p className="text-gray-600">Contacto: {order.clientContacto}</p>
              )}
            </div>

            <div>
              <span className="text-[#017E9A] font-bold uppercase text-[11px] block mb-1">
                Condiciones del Pedido
              </span>
              <p className="text-gray-700">
                Forma de Pago:{' '}
                <span className="font-bold text-[#0B4F6C]">{order.formaPago}</span>
              </p>
              {order.observaciones && (
                <p className="text-gray-600 mt-1 italic">
                  Nota: "{order.observaciones}"
                </p>
              )}
            </div>
          </div>

          {/* Table of Items */}
          <div className="border border-[#D1E3EB] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-[#E8F4F8] text-[#0B4F6C] font-brand border-b border-[#D1E3EB]">
                <tr>
                  <th className="p-2.5">Código</th>
                  <th className="p-2.5">Descripción del Producto</th>
                  <th className="p-2.5 text-center">Cant.</th>
                  <th className="p-2.5 text-right">P. Unitario</th>
                  <th className="p-2.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E3EB]">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono text-xs text-gray-500 font-bold">
                      {item.codigo}
                    </td>
                    <td className="p-2.5 font-medium text-gray-800">
                      <div>{item.nombre}</div>
                      {(item.lote || item.vencimiento) && (
                        <div className="text-[11px] text-gray-500 font-mono flex gap-2 mt-0.5">
                          {item.lote && <span>Lote: <strong className="text-[#0B4F6C]">{item.lote}</strong></span>}
                          {item.vencimiento && <span>Venc: <strong className="text-amber-800">{item.vencimiento}</strong></span>}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 text-center font-bold text-[#0B4F6C]">
                      {item.cantidad} {item.tipo === 'Bandeja' ? 'u.' : 'Kg'}
                    </td>
                    <td className="p-2.5 text-right text-gray-600">
                      ${item.precioUnitario.toLocaleString('es-AR')}
                    </td>
                    <td className="p-2.5 text-right font-bold text-gray-800">
                      ${item.subtotal.toLocaleString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Este comprobante certifica la reserva de preventa y descuento de stock.</p>
              <p>• Para consultas o cambios, referir la orden <strong>{order.numeroOP}</strong>.</p>
            </div>

            <div className="bg-[#0B4F6C] text-white p-4 rounded-xl border border-[#017E9A] min-w-[240px] space-y-1.5 text-right">
              <div className="flex justify-between text-xs text-sky-200">
                <span>Subtotal Pedido:</span>
                <span className="font-semibold">${order.subtotal.toLocaleString('es-AR')}</span>
              </div>
              {order.descuento > 0 && (
                <div className="flex justify-between text-xs text-amber-300">
                  <span>Descuento Aplicado:</span>
                  <span className="font-semibold">-${order.descuento.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="border-t border-white/20 pt-1 flex justify-between items-center text-base font-bold">
                <span>Total Final:</span>
                <span className="text-lg text-emerald-300">
                  ${order.total.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="bg-[#E8F4F8] px-6 py-3 border-t border-[#D1E3EB] flex justify-end gap-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#D1E3EB] hover:bg-gray-100 text-gray-700 font-brand rounded-lg text-sm transition-colors"
          >
            Cerrar Comprobante
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Exportar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
