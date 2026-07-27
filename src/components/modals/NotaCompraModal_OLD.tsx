import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FileText, X, Plus, Trash2, Check, Share2, Printer, ShoppingBag } from 'lucide-react';

interface NotaCompraItem {
  id: string;
  type: 'insumo' | 'producto';
  itemId: number | string;
  nombre: string;
  presentacion: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

interface PrefilledItemData {
  type: 'insumo' | 'producto';
  itemId: number | string;
  nombre: string;
  cantidadSugerida?: number;
  supplierId?: number | string;
}

interface NotaCompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledItem?: PrefilledItemData | null;
}

export const NotaCompraModal: React.FC<NotaCompraModalProps> = ({
  isOpen,
  onClose,
  prefilledItem,
}) => {
  const { suppliers, rawMaterials, products, registerSupplierInvoice } = useApp();

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | string>('');
  const [items, setItems] = useState<NotaCompraItem[]>([]);
  const [descuento, setDescuento] = useState<number>(0);
  const [observaciones, setObservaciones] = useState('');

  // Form controls for adding an item
  const [itemType, setItemType] = useState<'insumo' | 'producto'>('insumo');
  const [selectedItemId, setSelectedItemId] = useState<number | string>('');
  const [cantidadInput, setCantidadInput] = useState<number>(1);
  const [costoInput, setCostoInput] = useState<number>(0);

  const selectedSupplier = suppliers.find(
    (s) => String(s.id) === String(selectedSupplierId)
  ) || suppliers[0];

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen) {
      setFecha(new Date().toISOString().split('T')[0]);
      
      const defaultSupplier = prefilledItem?.supplierId 
        ? suppliers.find(s => String(s.id) === String(prefilledItem.supplierId)) || suppliers[0]
        : suppliers[0];

      if (defaultSupplier) {
        setSelectedSupplierId(defaultSupplier.id);
      }

      setItemType(prefilledItem?.type || 'insumo');
      setCantidadInput(1);
      setDescuento(0);

      if (prefilledItem) {
        const qty = prefilledItem.cantidadSugerida && prefilledItem.cantidadSugerida > 0 ? prefilledItem.cantidadSugerida : 10;
        let foundCost = 0;
        let foundPres = 'Unidad';

        if (prefilledItem.type === 'insumo') {
          const mat = rawMaterials.find((m) => String(m.id) === String(prefilledItem.itemId) || m.nombre.toLowerCase().includes(prefilledItem.nombre.toLowerCase()));
          if (mat) {
            foundCost = mat.costo || mat.costoUnidad || 0;
            foundPres = mat.presentacion || mat.unidad || 'Unidad';
          }
        } else {
          const prod = products.find((p) => String(p.id) === String(prefilledItem.itemId) || p.nombre.toLowerCase().includes(prefilledItem.nombre.toLowerCase()));
          if (prod) {
            foundCost = prod.costo || 0;
            foundPres = prod.tipo === 'Bandeja' ? 'Bandeja' : 'Kg';
          }
        }

        const preItem: NotaCompraItem = {
          id: `pre-${Date.now()}`,
          type: prefilledItem.type,
          itemId: prefilledItem.itemId,
          nombre: prefilledItem.nombre,
          presentacion: foundPres,
          cantidad: qty,
          costoUnitario: foundCost,
          subtotal: qty * foundCost,
        };

        setItems([preItem]);
        setObservaciones(`Nota generada automáticamente para reposición de stock: ${prefilledItem.nombre}`);
      } else {
        setItems([]);
        setObservaciones('');
      }

      // Set initial item selection
      if (rawMaterials.length > 0) {
        setSelectedItemId(rawMaterials[0].id);
        setCostoInput(rawMaterials[0].costo || rawMaterials[0].costoUnidad || 0);
      }
    }
  }, [isOpen]);

  // Set default item selection when itemType changes
  const handleItemTypeChange = (newType: 'insumo' | 'producto') => {
    setItemType(newType);
    if (newType === 'insumo' && rawMaterials.length > 0) {
      const match = rawMaterials[0];
      setSelectedItemId(match.id);
      setCostoInput(match.costo || match.costoUnidad || 0);
    } else if (newType === 'producto' && products.length > 0) {
      const match = products[0];
      setSelectedItemId(match.id);
      setCostoInput(match.costo || 0);
    }
  };

  // Handle dropdown change for selected item
  const handleItemSelectChange = (idVal: string) => {
    setSelectedItemId(idVal);
    if (itemType === 'insumo') {
      const ins = rawMaterials.find((r) => String(r.id) === idVal);
      if (ins) setCostoInput(ins.costo || ins.costoUnidad || 0);
    } else {
      const prd = products.find((p) => String(p.id) === idVal);
      if (prd) setCostoInput(prd.costo || 0);
    }
  };

  // Handle Escape key to close modal
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

  const handleAddItem = () => {
    if (!selectedItemId || cantidadInput <= 0 || costoInput < 0) return;

    let nombre = '';
    let presentacion = '';

    if (itemType === 'insumo') {
      const ins = rawMaterials.find((r) => String(r.id) === String(selectedItemId));
      if (!ins) return;
      nombre = ins.nombre;
      presentacion = ins.presentacion || ins.unidad || 'Unidad';
    } else {
      const prd = products.find((p) => String(p.id) === String(selectedItemId));
      if (!prd) return;
      nombre = `[${prd.codigo}] ${prd.nombre}`;
      presentacion = prd.tipo;
    }

    const subtotal = cantidadInput * costoInput;
    const newItem: NotaCompraItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      type: itemType,
      itemId: selectedItemId,
      nombre,
      presentacion,
      cantidad: cantidadInput,
      costoUnitario: costoInput,
      subtotal,
    };

    setItems((prev) => [...prev, newItem]);
    setCantidadInput(1);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const total = Math.max(0, subtotal - descuento);

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || items.length === 0) {
      alert('Por favor seleccione un proveedor e ingrese al menos un insumo.');
      return;
    }

    const summaryStr = items.map((i) => `${i.nombre} x${i.cantidad}`).join(', ');
    const concepto = `Nota de Compra / Pedido a Proveedor: ${summaryStr}`;

    registerSupplierInvoice(selectedSupplier.id, total, concepto, fecha);

    alert(`¡Nota de compra por $${total.toLocaleString('es-AR')} registrada exitosamente para ${selectedSupplier.nombre}!`);
    setItems([]);
    onClose();
  };

  const handleShareWhatsApp = () => {
    if (!selectedSupplier) return;

    let phoneClean = (selectedSupplier.telefono || '').replace(/\D/g, '');
    if (!phoneClean) {
      phoneClean = '549341000000'; // fallback
    } else if (!phoneClean.startsWith('54')) {
      phoneClean = `549${phoneClean}`;
    }

    let text = `📋 *NOTA DE COMPRA / PEDIDO A PROVEEDOR FRIZAME*\n`;
    text += `*Fecha:* ${fecha}\n`;
    text += `*Proveedor:* ${selectedSupplier.nombre}\n`;
    if (selectedSupplier.cuit) text += `*CUIT:* ${selectedSupplier.cuit}\n`;
    if (selectedSupplier.direccion) text += `*Dirección de Entrega:* ${selectedSupplier.direccion}\n`;
    text += `-----------------------------------\n`;
    text += `*DETALLE DE COMPRA:*\n`;

    items.forEach((it, idx) => {
      text += `${idx + 1}. *${it.nombre}* (${it.presentacion})\n`;
      text += `   • Cantidad: ${it.cantidad}\n`;
      text += `   • Precio Unit.: $${it.costoUnitario.toLocaleString('es-AR')}\n`;
      text += `   • Subtotal: $${it.subtotal.toLocaleString('es-AR')}\n`;
    });

    text += `-----------------------------------\n`;
    if (descuento > 0) text += `*Descuento Aplicado:* -$${descuento.toLocaleString('es-AR')}\n`;
    text += `*TOTAL COMPRA:* $${total.toLocaleString('es-AR')}\n\n`;
    if (observaciones) text += `*Observaciones:* ${observaciones}\n\n`;
    text += `Por favor confirmar recepción y fecha aproximada de entrega. ¡Muchas gracias!`;

    const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0B4F6C]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-[#D1E3EB] animate-fadeIn max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#E8F4F8] px-5 py-3.5 border-b border-[#D1E3EB] flex justify-between items-center shrink-0">
          <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#017E9A]" />
            Cargar Nota de Compra a Proveedores
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmitPurchase} className="p-5 space-y-4 text-xs md:text-sm overflow-y-auto flex-1">
          {/* Top Row: Date & Supplier Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#F4F8FA] p-3 rounded-xl border border-[#D1E3EB]">
            <div>
              <label className="block font-bold text-[#0B4F6C] mb-1">Fecha de Compra</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white font-semibold text-gray-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[#0B4F6C] mb-1">Proveedor</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white font-bold text-[#0B4F6C]"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Supplier Info Details Badge */}
          {selectedSupplier && (
            <div className="bg-[#E8F4F8] p-3 rounded-xl border border-[#D1E3EB] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-gray-500 block">Contacto:</span>
                <strong className="text-[#0B4F6C]">{selectedSupplier.contacto || 'Sin contacto'}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Teléfono:</span>
                <strong className="text-gray-800">{selectedSupplier.telefono || 'Sin teléfono'}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Dirección:</span>
                <strong className="text-gray-800">{selectedSupplier.direccion || 'Sin dirección'}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Saldo Actual:</span>
                <strong className="text-emerald-700 font-bold">${selectedSupplier.saldo.toLocaleString('es-AR')}</strong>
              </div>
            </div>
          )}

          {/* Add Item Form Controls */}
          <div className="bg-white p-3 rounded-xl border border-[#D1E3EB] space-y-3 shadow-xs">
            <h4 className="font-brand font-bold text-[#0B4F6C] text-xs flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#017E9A]" />
              Agregar Insumo o Producto a la Nota de Compra
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Tipo de Item</label>
                <select
                  value={itemType}
                  onChange={(e) => handleItemTypeChange(e.target.value as any)}
                  className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white font-semibold text-xs"
                >
                  <option value="insumo">Materia Prima / Insumo</option>
                  <option value="producto">Producto Elaborado</option>
                </select>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Seleccionar Insumo/Producto</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => handleItemSelectChange(e.target.value)}
                  className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white font-semibold text-xs"
                >
                  {itemType === 'insumo'
                    ? rawMaterials.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre} ({r.presentacion}) - Costo: ${r.costo || r.costoUnidad || 0}
                        </option>
                      ))
                    : products.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.codigo}] {p.nombre} - Costo: ${p.costo || 0}
                        </option>
                      ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={cantidadInput}
                  onChange={(e) => setCantidadInput(parseFloat(e.target.value) || 1)}
                  className="w-full p-2 border border-[#D1E3EB] rounded-lg font-bold text-[#0B4F6C] text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Costo Unit. ($)</label>
                <input
                  type="number"
                  min="0"
                  value={costoInput}
                  onChange={(e) => setCostoInput(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-[#D1E3EB] rounded-lg font-bold text-emerald-800 text-xs"
                />
              </div>

              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full p-2 bg-[#017E9A] hover:bg-[#016278] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-xs"
                  title="Añadir a la orden"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Table of Order Items */}
          <div className="border border-[#D1E3EB] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#E8F4F8] text-[#0B4F6C] font-semibold sticky top-0 border-b border-[#D1E3EB]">
                <tr>
                  <th className="p-2.5">Item / Insumo</th>
                  <th className="p-2.5">Presentación</th>
                  <th className="p-2.5 text-center">Cant.</th>
                  <th className="p-2.5 text-right">Costo Unit.</th>
                  <th className="p-2.5 text-right">Subtotal</th>
                  <th className="p-2.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E3EB]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500 italic">
                      No se han agregado insumos a esta nota de compra. Use el formulario superior para añadir items.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id} className="hover:bg-gray-50">
                      <td className="p-2.5 font-bold text-gray-800">{it.nombre}</td>
                      <td className="p-2.5 text-gray-600">{it.presentacion}</td>
                      <td className="p-2.5 text-center font-bold text-[#0B4F6C]">{it.cantidad}</td>
                      <td className="p-2.5 text-right text-gray-700">${it.costoUnitario.toLocaleString('es-AR')}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-800">${it.subtotal.toLocaleString('es-AR')}</td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
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

          {/* Totals & Observations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Observaciones / Notas</label>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Entregar por la mañana. Enviar factura B."
                className="w-full p-2 border border-[#D1E3EB] rounded-lg text-xs"
              />
            </div>

            <div className="bg-[#E8F4F8] p-3 rounded-xl border border-[#D1E3EB] space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal Items:</span>
                <strong className="text-gray-800">${subtotal.toLocaleString('es-AR')}</strong>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Descuento ($):</span>
                <input
                  type="number"
                  min="0"
                  value={descuento}
                  onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                  className="w-24 p-1 border border-[#D1E3EB] rounded text-right font-semibold"
                />
              </div>

              <div className="flex justify-between text-sm font-bold text-[#0B4F6C] pt-1.5 border-t border-[#D1E3EB]">
                <span>Total Nota de Compra:</span>
                <span className="text-emerald-700 text-base">${total.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-[#D1E3EB]">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 border border-[#D1E3EB] text-gray-700 font-brand font-semibold rounded-lg hover:bg-gray-100 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#D1E3EB] bg-gray-100 hover:bg-gray-200 text-gray-700 font-brand font-semibold rounded-lg text-xs transition-colors"
              >
                Cancelar / Salir
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                disabled={items.length === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-brand font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartir</span>
              </button>

              <button
                type="submit"
                disabled={items.length === 0}
                className="px-5 py-2 bg-[#0B4F6C] hover:bg-[#083b52] disabled:bg-gray-300 text-white font-brand font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Registrar Nota de Compra</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
