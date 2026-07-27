import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CartItem, OrderOP, SaleChannel } from '../../types';
import { ShoppingCart, X, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface VentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleConfirmed?: (order: OrderOP) => void;
  orderToEdit?: OrderOP | null;
}

export const VentaModal: React.FC<VentaModalProps> = ({
  isOpen,
  onClose,
  onSaleConfirmed,
  orderToEdit,
}) => {
  const { products, clients, addMultiItemSale, updateOrderOP, cancelOrderOP } = useApp();

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [canal, setCanal] = useState<SaleChannel>('Particular');
  const [formaPago, setFormaPago] = useState<'Efectivo' | 'Transferencia' | 'Cuenta Corriente'>('Cuenta Corriente');
  const [selectedClientId, setSelectedClientId] = useState<number | string>(clients[0]?.id || '');
  const [observaciones, setObservaciones] = useState<string>('');

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Item selector state
  const [selectedProductId, setSelectedProductId] = useState<number | string>(products[0]?.id || '');
  const [itemCantidad, setItemCantidad] = useState<number>(1);
  const [itemPrecioUnit, setItemPrecioUnit] = useState<number>(0);
  const [itemLote, setItemLote] = useState<string>('');
  const [itemVencimiento, setItemVencimiento] = useState<string>('');

  const [descuento, setDescuento] = useState<number>(0);

  const selectedClient = clients.find(
    (c) => c.id === selectedClientId || String(c.id) === String(selectedClientId)
  );
  const selectedProduct = products.find(
    (p) => p.id === selectedProductId || String(p.id) === String(selectedProductId)
  );

  // Helper for FIFO lot suggestion
  const getFifoLotAndExp = (prod: any) => {
    if (!prod) return { lote: 'L-2608', vencimiento: '2026-08-15' };
    if (prod.lotes && prod.lotes.length > 0) {
      const sorted = [...prod.lotes].sort((a: any, b: any) => a.vencimiento.localeCompare(b.vencimiento));
      return { lote: sorted[0].lote, vencimiento: sorted[0].vencimiento };
    }
    if (prod.loteDefault && prod.vencimientoDefault) {
      return { lote: prod.loteDefault, vencimiento: prod.vencimientoDefault };
    }
    const expDate = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
    return { lote: `L-2608-${prod.codigo}`, vencimiento: expDate };
  };

  // Populate when modal opens or orderToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (orderToEdit) {
        setFecha(orderToEdit.fecha || new Date().toISOString().split('T')[0]);
        setCanal(orderToEdit.canal || 'Particular');
        setFormaPago(orderToEdit.formaPago || 'Cuenta Corriente');
        setSelectedClientId(orderToEdit.clientId);
        setObservaciones(orderToEdit.observaciones || '');
        setDescuento(orderToEdit.descuento || 0);
        setCartItems(orderToEdit.items || []);
      } else {
        setFecha(new Date().toISOString().split('T')[0]);
        setCanal('Particular');
        setFormaPago('Cuenta Corriente');
        setSelectedClientId(clients[0]?.id || '');
        setObservaciones('');
        setDescuento(0);
        setCartItems([]);
      }
    }
  }, [isOpen, orderToEdit, clients]);

  // Pre-fill item price and FIFO batch when selected product or channel changes
  useEffect(() => {
    if (selectedProduct) {
      let unitPrice = selectedProduct.precioParticular;
      if (canal === 'Comercio') {
        unitPrice = selectedProduct.precioComercio || selectedProduct.precioParticular * 0.85;
      } else if (canal === 'Especial') {
        unitPrice = selectedProduct.precioParticular * 0.8;
      }
      setItemPrecioUnit(Math.round(unitPrice));

      // Calculate FIFO lot
      const fifo = getFifoLotAndExp(selectedProduct);
      setItemLote(fifo.lote);
      setItemVencimiento(fifo.vencimiento);
    }
  }, [selectedProductId, canal, selectedProduct]);

  // Sync client channel when selecting client
  useEffect(() => {
    if (selectedClient && selectedClient.canal) {
      setCanal(selectedClient.canal);
    }
  }, [selectedClientId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddToCart = () => {
    if (!selectedProduct || itemCantidad <= 0) return;

    const existingIndex = cartItems.findIndex(
      (item) => item.productId === selectedProduct.id || String(item.productId) === String(selectedProduct.id)
    );

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      const newQty = updated[existingIndex].cantidad + itemCantidad;
      updated[existingIndex].cantidad = newQty;
      updated[existingIndex].subtotal = newQty * updated[existingIndex].precioUnitario;
      if (itemLote) updated[existingIndex].lote = itemLote;
      if (itemVencimiento) updated[existingIndex].vencimiento = itemVencimiento;
      setCartItems(updated);
    } else {
      const newItem: CartItem = {
        productId: selectedProduct.id,
        codigo: selectedProduct.codigo,
        nombre: selectedProduct.nombre,
        tipo: selectedProduct.tipo,
        cantidad: itemCantidad,
        precioUnitario: itemPrecioUnit,
        subtotal: itemCantidad * itemPrecioUnit,
        lote: itemLote,
        vencimiento: itemVencimiento,
      };
      setCartItems([...cartItems, newItem]);
    }

    setItemCantidad(1);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    const updated = [...cartItems];
    updated[index].cantidad = newQty;
    updated[index].subtotal = newQty * updated[index].precioUnitario;
    setCartItems(updated);
  };

  const subtotalCart = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const totalFinal = Math.max(0, subtotalCart - descuento);

  const handleProcessOrder = (estado: 'Reservado' | 'Confirmado') => {
    if (!selectedClient) {
      alert('Por favor selecciona un cliente.');
      return;
    }
    if (cartItems.length === 0) {
      alert('Debes agregar al menos un producto al pedido.');
      return;
    }

    let resultOrder: OrderOP | null = null;

    if (orderToEdit) {
      resultOrder = updateOrderOP(orderToEdit.id, {
        fecha,
        clientId: selectedClient.id,
        items: cartItems,
        canal,
        descuento,
        formaPago,
        observaciones,
        estado,
      });
    } else {
      resultOrder = addMultiItemSale({
        fecha,
        clientId: selectedClient.id,
        items: cartItems,
        canal,
        descuento,
        formaPago,
        observaciones,
        estado,
      });
    }

    if (resultOrder) {
      if (estado === 'Confirmado' && onSaleConfirmed) {
        onSaleConfirmed(resultOrder);
      } else {
        alert(
          `¡Pedido (${estado}) ${resultOrder.numeroOP} guardado con éxito!\nCliente: ${selectedClient.nombre}\nTotal: $${totalFinal.toLocaleString(
            'es-AR'
          )}`
        );
      }
      onClose();
    }
  };

  const handleCancelReservation = () => {
    if (orderToEdit) {
      setShowCancelConfirm(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessOrder('Confirmado');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0B4F6C]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-[#D1E3EB] flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-[#E8F4F8] px-5 py-3.5 border-b border-[#D1E3EB] flex justify-between items-center">
          <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#017E9A]" />
            {orderToEdit ? `Editar Pedido / Reserva ${orderToEdit.numeroOP}` : 'Cargar Pedido de Preventa Multi-Producto'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs md:text-sm">
          {/* Header Data */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Fecha de la Venta</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg focus:outline-none focus:border-[#017E9A]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Canal de Precio</label>
              <select
                value={canal}
                onChange={(e) => setCanal(e.target.value as SaleChannel)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white focus:outline-none focus:border-[#017E9A]"
              >
                <option value="Particular">Particular</option>
                <option value="Comercio">Comercio</option>
                <option value="Especial">Especial (Descuento)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Forma de Pago</label>
              <select
                value={formaPago}
                onChange={(e) =>
                  setFormaPago(e.target.value as 'Efectivo' | 'Transferencia' | 'Cuenta Corriente')
                }
                className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white focus:outline-none focus:border-[#017E9A]"
              >
                <option value="Cuenta Corriente">Cuenta Corriente (Fiado)</option>
                <option value="Efectivo">Efectivo Al Contado</option>
                <option value="Transferencia">Transferencia Bancaria</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Cliente / Destinatario</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white focus:outline-none focus:border-[#017E9A]"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            {selectedClient && (
              <div className="bg-[#E8F4F8] p-2.5 rounded-lg border border-[#D1E3EB] text-xs text-gray-700 mt-2 flex flex-wrap justify-between gap-2">
                <div>
                  <span className="font-semibold text-[#0B4F6C]">Dirección:</span>{' '}
                  <span className="font-bold text-gray-800">{selectedClient.direccion || 'Sin registrar'}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#0B4F6C]">Teléfono:</span>{' '}
                  <span className="font-bold text-gray-800">{selectedClient.telefono || 'Sin registrar'}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#0B4F6C]">Saldo Cta Cte:</span>{' '}
                  <span className="font-bold text-amber-700">${selectedClient.saldo.toLocaleString('es-AR')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Add Item Row Panel */}
          <div className="bg-[#F4F8FA] p-3.5 rounded-xl border border-[#D1E3EB] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-brand font-bold text-xs text-[#0B4F6C] block uppercase tracking-wider">
                Agregar Producto al Carrito
              </span>
              <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded border border-emerald-200">
                Lote Sugerido FIFO (Vencimiento más próximo)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Producto</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white text-xs focus:outline-none focus:border-[#017E9A]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.codigo}] {p.nombre} ({p.tipo === 'Bandeja' ? `Stock: ${p.stockBandejas} band.` : `Stock: ${p.stockGranelKg} kg`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                  Cant ({selectedProduct?.tipo === 'Bandeja' ? 'u.' : 'Kg'})
                </label>
                <input
                  type="number"
                  min="1"
                  value={itemCantidad}
                  onChange={(e) => setItemCantidad(parseInt(e.target.value) || 1)}
                  className="w-full p-2 border border-[#D1E3EB] rounded-lg text-xs focus:outline-none focus:border-[#017E9A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Lote (FIFO)</label>
                <input
                  type="text"
                  value={itemLote}
                  onChange={(e) => setItemLote(e.target.value)}
                  placeholder="Lote"
                  className="w-full p-2 border border-[#D1E3EB] rounded-lg text-xs font-mono font-bold text-[#0B4F6C] focus:outline-none focus:border-[#017E9A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Vencimiento</label>
                <input
                  type="date"
                  value={itemVencimiento}
                  onChange={(e) => setItemVencimiento(e.target.value)}
                  className="w-full p-2 border border-[#D1E3EB] rounded-lg text-xs font-medium focus:outline-none focus:border-[#017E9A]"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-2 bg-[#017E9A] hover:bg-[#016278] text-white font-brand text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cart List Table */}
          <div className="border border-[#D1E3EB] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E8F4F8] text-[#0B4F6C] font-brand border-b border-[#D1E3EB]">
                <tr>
                  <th className="p-2">Cód</th>
                  <th className="p-2">Producto / Lote FIFO</th>
                  <th className="p-2 text-center">Cantidad</th>
                  <th className="p-2 text-right">P. Unit</th>
                  <th className="p-2 text-right">Subtotal</th>
                  <th className="p-2 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E3EB]">
                {cartItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-400 italic">
                      No hay productos en el pedido aún. Selecciona arriba y presiona "Agregar".
                    </td>
                  </tr>
                ) : (
                  cartItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 font-mono text-gray-500 font-bold">{item.codigo}</td>
                      <td className="p-2 font-medium text-gray-800">
                        <div>{item.nombre}</div>
                        {(item.lote || item.vencimiento) && (
                          <div className="text-[10px] text-gray-500 font-mono flex gap-2 mt-0.5">
                            {item.lote && (
                              <span>
                                Lote: <strong className="text-[#0B4F6C]">{item.lote}</strong>
                              </span>
                            )}
                            {item.vencimiento && (
                              <span>
                                Venc: <strong className="text-amber-800">{item.vencimiento}</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(idx, item.cantidad - 1)}
                            className="px-1.5 py-0.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="font-bold text-[#0B4F6C] w-6 text-center">
                            {item.cantidad}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(idx, item.cantidad + 1)}
                            className="px-1.5 py-0.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-2 text-right">${item.precioUnitario.toLocaleString('es-AR')}</td>
                      <td className="p-2 text-right font-bold text-gray-800">
                        ${item.subtotal.toLocaleString('es-AR')}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(idx)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar del pedido"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Observations & Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Observaciones / Notas OP</label>
              <input
                type="text"
                placeholder="Ej: Entregar de mañana, llamar antes..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg focus:outline-none focus:border-[#017E9A]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Descuento Global ($)</label>
              <input
                type="number"
                min="0"
                value={descuento}
                onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg focus:outline-none focus:border-[#017E9A]"
              />
            </div>
          </div>

          {/* Total Box */}
          <div className="bg-[#0B4F6C] text-white p-3.5 rounded-xl border border-[#017E9A] flex justify-between items-center">
            <div>
              <span className="text-xs text-sky-200 block">Subtotal: ${subtotalCart.toLocaleString('es-AR')}</span>
              {descuento > 0 && (
                <span className="text-xs text-amber-300 block">Descuento: -${descuento.toLocaleString('es-AR')}</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs text-sky-200 uppercase font-semibold block">Total Final OP</span>
              <h2 className="font-brand font-bold text-2xl text-emerald-300">
                ${totalFinal.toLocaleString('es-AR')}
              </h2>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-[#D1E3EB]">
            <div>
              {orderToEdit && (
                <button
                  type="button"
                  onClick={handleCancelReservation}
                  className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-brand rounded-lg transition-colors text-xs font-bold flex items-center gap-1 border border-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancelar Reserva</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#D1E3EB] text-gray-700 font-brand rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={() => handleProcessOrder('Reservado')}
                className={`px-4 py-2 font-brand rounded-lg transition-colors flex items-center gap-1.5 shadow-sm text-xs font-semibold ${
                  cartItems.length > 0
                    ? 'bg-[#017E9A] hover:bg-[#016278] text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>{orderToEdit ? 'Guardar Cambios (Reserva)' : 'Guardar y Reservar Mercadería'}</span>
              </button>
              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={() => handleProcessOrder('Confirmado')}
                className={`px-5 py-2 font-brand rounded-lg transition-colors flex items-center gap-1.5 shadow-sm text-xs font-bold text-white ${
                  cartItems.length > 0
                    ? 'bg-[#0B4F6C] hover:bg-[#083b52]'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{orderToEdit ? 'Confirmar Venta y Generar OP' : 'Confirmar Venta y Generar OP'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Modal for Order Cancellation */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          if (orderToEdit) {
            cancelOrderOP(orderToEdit.id);
            setShowCancelConfirm(false);
            onClose();
          }
        }}
        title="Cancelar Reserva / Pedido"
        message={
          <p>
            ¿Está seguro de cancelar y anular la orden <strong>{orderToEdit?.numeroOP}</strong>? El pedido quedará marcado como <strong>"Anulado"</strong> y el stock reservado se liberará inmediatamente al inventario.
          </p>
        }
        confirmText="Confirmar Anulación"
        cancelText="Cancelar"
      />
    </div>
  );
};
