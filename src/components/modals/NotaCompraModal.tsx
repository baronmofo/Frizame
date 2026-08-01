import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingBag, X, Plus, Trash2, Check, Printer, Calendar, Tag } from 'lucide-react';
import { SearchableSelect, SelectOption } from '../common/SearchableSelect';

interface NotaCompraItem {
  id: string;
  type: 'insumo' | 'producto';
  itemId: number | string;
  nombre: string;
  presentacion: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  lote?: string;
  vencimiento?: string;
}

interface PrefilledItemData {
  type: 'insumo' | 'producto';
  itemId: number | string;
  nombre?: string;
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
  const { suppliers, rawMaterials, products, registerSupplierInvoice, updateRawMaterialCosto, addProductLot } = useApp();

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | string>('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<NotaCompraItem[]>([]);
  const [descuentoInput, setDescuentoInput] = useState<string>('0');

  // Form state for adding an item
  const [itemType, setItemType] = useState<'insumo' | 'producto'>('insumo');
  const [selectedItemId, setSelectedItemId] = useState<number | string>('');
  const [cantidadInput, setCantidadInput] = useState<string>('1');
  const [costoInput, setCostoInput] = useState<string>('0');
  const [loteInput, setLoteInput] = useState<string>('');
  const [vencimientoInput, setVencimientoInput] = useState<string>('');

  const [isSuccess, setIsSuccess] = useState(false);
  const [savedReceiptData, setSavedReceiptData] = useState<any>(null);

  // Initialize or reset modal fields ONCE when opened
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setSavedReceiptData(null);
      setFecha(new Date().toISOString().split('T')[0]);
      setObservaciones('');
      setDescuentoInput('0');
      setItems([]);

      // Validate prefilledItem to ensure it is a valid data payload (and not a React SyntheticEvent)
      const isPrefilledValid =
        prefilledItem &&
        typeof prefilledItem === 'object' &&
        (prefilledItem.type === 'insumo' || prefilledItem.type === 'producto') &&
        Boolean(prefilledItem.itemId);

      const validPrefilled = isPrefilledValid ? prefilledItem : null;

      const defaultSupplier = validPrefilled?.supplierId
        ? suppliers.find((s) => String(s.id) === String(validPrefilled.supplierId)) || suppliers[0]
        : suppliers[0];

      setSelectedSupplierId(defaultSupplier?.id || '');

      if (validPrefilled) {
        const typeVal = validPrefilled.type === 'producto' ? 'producto' : 'insumo';
        setItemType(typeVal);
        setSelectedItemId(validPrefilled.itemId);
        setCantidadInput(String(validPrefilled.cantidadSugerida || 1));

        if (typeVal === 'insumo') {
          const mat = rawMaterials.find((m) => String(m.id) === String(validPrefilled.itemId));
          setCostoInput(String(mat?.costo || 0));
        } else {
          const prod = products.find((p) => String(p.id) === String(validPrefilled.itemId));
          setCostoInput(String(prod?.costo || 0));
        }
      } else {
        setItemType('insumo');
        if (rawMaterials.length > 0) {
          setSelectedItemId(rawMaterials[0].id);
          setCostoInput(String(rawMaterials[0].costo || 0));
        } else if (products.length > 0) {
          setItemType('producto');
          setSelectedItemId(products[0].id);
          setCostoInput(String(products[0].costo || 0));
        }
        setCantidadInput('1');
      }
    }
  }, [isOpen]);

  // Escape key listener to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  // Update unit cost default when selected item changes in the form
  const handleItemSelectChange = (newId: number | string, currentType: 'insumo' | 'producto') => {
    setSelectedItemId(newId);
    if (currentType === 'insumo') {
      const mat = rawMaterials.find((m) => String(m.id) === String(newId));
      setCostoInput(String(mat ? mat.costo : 0));
    } else {
      const prod = products.find((p) => String(p.id) === String(newId));
      setCostoInput(String(prod ? prod.costo : 0));
    }
  };

  const handleTypeChange = (newType: 'insumo' | 'producto') => {
    setItemType(newType);
    if (newType === 'insumo' && rawMaterials.length > 0) {
      handleItemSelectChange(rawMaterials[0].id, 'insumo');
    } else if (newType === 'producto' && products.length > 0) {
      handleItemSelectChange(products[0].id, 'producto');
    }
  };

  const handleAddItem = () => {
    const cantNum = parseFloat(cantidadInput);
    const costoNum = parseFloat(costoInput);

    if (!selectedItemId || isNaN(cantNum) || cantNum <= 0 || isNaN(costoNum) || costoNum < 0) return;

    let nombre = '';
    let presentacion = '';

    if (itemType === 'insumo') {
      const mat = rawMaterials.find((m) => String(m.id) === String(selectedItemId));
      if (!mat) return;
      nombre = mat.nombre;
      presentacion = `${mat.presentacion} (${mat.unidad})`;
    } else {
      const prod = products.find((p) => String(p.id) === String(selectedItemId));
      if (!prod) return;
      nombre = prod.nombre;
      presentacion = prod.tipo === 'Bandeja' ? 'Bandeja' : 'Kg Granel';
    }

    const newItem: NotaCompraItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: itemType,
      itemId: selectedItemId,
      nombre,
      presentacion,
      cantidad: cantNum,
      costoUnitario: costoNum,
      subtotal: cantNum * costoNum,
      lote: loteInput.trim() || undefined,
      vencimiento: vencimientoInput.trim() || undefined,
    };

    setItems((prev) => [...prev, newItem]);
    setCantidadInput('1');
    setLoteInput('');
    setVencimientoInput('');
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const subtotal = items.reduce((acc, it) => acc + it.subtotal, 0);
  const descuentoNum = parseFloat(descuentoInput) || 0;
  const totalFinal = Math.max(0, subtotal - descuentoNum);

  const handleSubmitNota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || items.length === 0) return;

    const supplier = suppliers.find((s) => String(s.id) === String(selectedSupplierId));
    if (!supplier) return;

    const conceptoStr = `Nota de Compra - ${items.length} ítem(s) [${observaciones || 'Sin comprobante'}]`;

    // 1. Register invoice in supplier balance
    registerSupplierInvoice(supplier.id, totalFinal, conceptoStr, fecha);

    // 2. Update costs and lots of raw materials and products
    items.forEach((it) => {
      if (it.type === 'insumo') {
        updateRawMaterialCosto(it.itemId, it.costoUnitario);
      }
      if (it.lote) {
        addProductLot(it.itemId, it.lote, it.vencimiento || '', it.cantidad);
      }
    });

    const receipt = {
      fecha,
      supplierNombre: supplier.nombre,
      supplierCuit: supplier.cuit || 'S/N',
      items,
      subtotal,
      descuento: descuentoNum,
      totalFinal,
      observaciones,
    };

    setSavedReceiptData(receipt);
    setIsSuccess(true);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-[#D1E3EB] my-8 relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-[#D1E3EB] mb-4">
          <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#017E9A]" />
            Cargar Nota de Compra a Proveedores
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess && savedReceiptData ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-full">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-brand font-bold text-base">¡Nota de Compra Registrada Correctamente!</h4>
                <p className="text-xs text-emerald-800">
                  Se ha actualizado la cuenta corriente de <strong>{savedReceiptData.supplierNombre}</strong> y los costos de los insumos.
                </p>
              </div>
            </div>

            <div className="border border-[#D1E3EB] rounded-xl p-4 bg-[#F8FAFC] space-y-2 text-xs">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span>Proveedor: <strong>{savedReceiptData.supplierNombre}</strong></span>
                <span>Fecha: <strong>{savedReceiptData.fecha}</strong></span>
              </div>
              <div className="space-y-1 py-1">
                {savedReceiptData.items.map((it: NotaCompraItem) => (
                  <div key={it.id} className="flex justify-between">
                    <span>{it.nombre} ({it.presentacion}) x{it.cantidad}</span>
                    <strong className="text-gray-800">${it.subtotal.toLocaleString('es-AR')}</strong>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm text-[#0B4F6C]">
                <span>Total Registrado:</span>
                <span>${savedReceiptData.totalFinal.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 border border-[#D1E3EB] bg-white hover:bg-gray-50 text-gray-700 font-brand font-bold text-xs rounded-xl flex items-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir Comprobante
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-bold text-xs rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitNota} className="space-y-4 text-xs">
            {/* Top row: Proveedor, Fecha, Observaciones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Proveedor *</label>
                <SearchableSelect
                  value={selectedSupplierId}
                  onChange={(val) => setSelectedSupplierId(val)}
                  placeholder="-- Seleccionar Proveedor --"
                  options={suppliers.map((s) => ({
                    value: s.id,
                    label: `${s.nombre}${s.rubro ? ` (${s.rubro})` : ''}`,
                    sublabel: s.cuit ? `CUIT: ${s.cuit}` : undefined,
                  }))}
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Fecha de Factura / Carga *</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full p-2.5 border border-[#D1E3EB] rounded-lg bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">N° Comprobante / Remito</label>
                <input
                  type="text"
                  placeholder="Ej: Factura A-0001-1234"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full p-2.5 border border-[#D1E3EB] rounded-lg bg-white"
                />
              </div>
            </div>

            {/* Agregar Ítem Box */}
            <div className="bg-[#E8F4F8] p-3.5 rounded-xl border border-[#D1E3EB] space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-brand font-bold text-[#0B4F6C]">Agregar Ítem a la Nota:</span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="itemType"
                      checked={itemType === 'insumo'}
                      onChange={() => handleTypeChange('insumo')}
                      className="text-[#017E9A]"
                    />
                    <span className="font-semibold text-gray-700">Insumo / M. Prima</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="itemType"
                      checked={itemType === 'producto'}
                      onChange={() => handleTypeChange('producto')}
                      className="text-[#017E9A]"
                    />
                    <span className="font-semibold text-gray-700">Producto</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-4">
                  <label className="block font-semibold text-gray-700 mb-0.5">Seleccionar Ítem</label>
                  <SearchableSelect
                    value={selectedItemId}
                    onChange={(val) => handleItemSelectChange(val, itemType)}
                    placeholder="Seleccionar..."
                    options={
                      itemType === 'insumo'
                        ? rawMaterials.map((m) => ({
                            value: m.id,
                            label: m.nombre,
                            sublabel: `Presentación: ${m.presentacion} - Costo: $${m.costo}`,
                          }))
                        : products.map((p) => ({
                            value: p.id,
                            label: `[${p.codigo}] ${p.nombre}`,
                            sublabel: `Tipo: ${p.tipo} - Costo: $${p.costo}`,
                          }))
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-0.5">Cantidad</label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={cantidadInput}
                    onChange={(e) => setCantidadInput(e.target.value)}
                    className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white text-center font-bold text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-0.5">Costo Unit. ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={costoInput}
                    onChange={(e) => setCostoInput(e.target.value)}
                    className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white text-right font-bold text-emerald-800 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-0.5">Lote (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: L2408"
                    value={loteInput}
                    onChange={(e) => setLoteInput(e.target.value)}
                    className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white text-xs font-mono font-bold text-[#0B4F6C]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-0.5">Vencimiento</label>
                  <input
                    type="date"
                    value={vencimientoInput}
                    onChange={(e) => setVencimientoInput(e.target.value)}
                    className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-bold rounded-lg flex items-center justify-center gap-1 transition-colors text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar a la Nota</span>
                </button>
              </div>
            </div>

            {/* Table of added items */}
            <div className="border border-[#D1E3EB] rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#E8F4F8] text-[#0B4F6C] font-brand border-b border-[#D1E3EB] sticky top-0 z-10">
                  <tr>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Ítem / Detalle</th>
                    <th className="p-2">Lote / Venc.</th>
                    <th className="p-2 text-center">Cant.</th>
                    <th className="p-2 text-right">Costo U.</th>
                    <th className="p-2 text-right">Subtotal</th>
                    <th className="p-2 text-center">Quitar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E3EB]">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500 italic">
                        No se han agregado ítems a esta nota de compra.
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => (
                      <tr key={it.id} className="hover:bg-gray-50">
                        <td className="p-2 font-semibold text-gray-600">
                          {it.type === 'insumo' ? 'Insumo' : 'Producto'}
                        </td>
                        <td className="p-2 font-bold text-[#0B4F6C]">
                          {it.nombre} <span className="font-normal text-gray-500">({it.presentacion})</span>
                        </td>
                        <td className="p-2 font-mono text-[11px]">
                          {it.lote ? (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-900 font-bold rounded border border-blue-200">
                              {it.lote} {it.vencimiento ? `(Venc: ${it.vencimiento})` : ''}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-normal">Sin lote</span>
                          )}
                        </td>
                        <td className="p-2 text-center font-bold">{it.cantidad}</td>
                        <td className="p-2 text-right font-medium">${it.costoUnitario.toLocaleString('es-AR')}</td>
                        <td className="p-2 text-right font-bold text-emerald-700">
                          ${it.subtotal.toLocaleString('es-AR')}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.id)}
                            className="p-1 text-red-500 hover:text-red-700 rounded transition-colors"
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

            {/* Totals and Discount */}
            <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#D1E3EB] flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="font-semibold text-gray-700">Descuento / Ajuste ($):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={descuentoInput}
                  onChange={(e) => setDescuentoInput(e.target.value)}
                  className="w-24 p-1.5 border border-[#D1E3EB] rounded-lg text-right font-bold bg-white"
                />
              </div>

              <div className="text-right">
                <span className="text-gray-500 mr-3">Subtotal: ${subtotal.toLocaleString('es-AR')}</span>
                <strong className="text-base text-[#0B4F6C] font-brand font-extrabold">
                  Total Final: ${totalFinal.toLocaleString('es-AR')}
                </strong>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#D1E3EB]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#D1E3EB] hover:bg-gray-100 text-gray-700 font-brand font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={items.length === 0 || !selectedSupplierId}
                className="px-5 py-2 bg-[#017E9A] hover:bg-[#016278] disabled:bg-gray-300 text-white font-brand font-bold rounded-xl transition-colors shadow-sm"
              >
                Registrar Nota de Compra
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
