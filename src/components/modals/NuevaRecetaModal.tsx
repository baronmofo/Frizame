import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Receipt, X, Check, Plus, Trash2 } from 'lucide-react';
import { RecipeItem } from '../../types';

interface NuevaRecetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductId?: number | string | null;
}

export const NuevaRecetaModal: React.FC<NuevaRecetaModalProps> = ({
  isOpen,
  onClose,
  initialProductId,
}) => {
  const { products, rawMaterials, recipes, addRecipe } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<number | string>(
    initialProductId || products[0]?.id || ''
  );

  // Available insumos items pool: rawMaterials + bulk products (1XX)
  const allInsumoOptions = [
    ...products
      .filter((p) => p.codigo.startsWith('1'))
      .map((p) => ({
        id: p.id,
        nombre: `[${p.codigo}] ${p.nombre}`,
        costo: p.costo,
        unidadDefault: 'grs',
      })),
    ...rawMaterials.map((r) => ({
      id: r.id,
      nombre: `[Insumo] ${r.nombre} (${r.presentacion})`,
      costo: r.costo,
      unidadDefault: r.presentacion.toLowerCase().includes('pack') || r.presentacion.toLowerCase().includes('bolsa') ? 'u' : 'grs',
    })),
  ];

  const [items, setItems] = useState<RecipeItem[]>([]);

  React.useEffect(() => {
    const targetId = initialProductId || selectedProductId || products[0]?.id;
    if (targetId) {
      setSelectedProductId(targetId);
      const existing = recipes.find(
        (r) => r.productoId === targetId || String(r.productoId) === String(targetId)
      );
      if (existing && existing.insumos && existing.insumos.length > 0) {
        setItems(existing.insumos);
      } else if (allInsumoOptions.length > 0) {
        setItems([
          {
            insumoId: allInsumoOptions[0].id,
            insumoNombre: allInsumoOptions[0].nombre,
            gramosOCantidad: 400,
            unidad: 'grs',
          },
        ]);
      }
    }
  }, [isOpen, initialProductId]);

  React.useEffect(() => {
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
    const firstOpt = allInsumoOptions[0];
    if (!firstOpt) return;
    setItems((prev) => [
      ...prev,
      {
        insumoId: firstOpt.id,
        insumoNombre: firstOpt.nombre,
        gramosOCantidad: 1,
        unidad: firstOpt.unidadDefault,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof RecipeItem, value: any) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i === index) {
          if (field === 'insumoId') {
            const opt = allInsumoOptions.find((o) => o.id === value || String(o.id) === String(value));
            return {
              ...it,
              insumoId: value,
              insumoNombre: opt ? opt.nombre : it.insumoNombre,
            };
          }
          return { ...it, [field]: value };
        }
        return it;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || items.length === 0) return;

    addRecipe({
      productoId: selectedProductId,
      insumos: items,
    });

    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0B4F6C]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-[#D1E3EB] animate-fadeIn"
      >
        <div className="bg-[#E8F4F8] px-5 py-3.5 border-b border-[#D1E3EB] flex justify-between items-center">
          <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#017E9A]" />
            Nueva Receta / Composición Múltiple
          </h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs md:text-sm">
          {/* Producto Destino 2XX */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Producto
            </label>
            <select
              value={selectedProductId}
              disabled={!!initialProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className={`w-full p-2.5 border rounded-lg font-medium focus:outline-none ${
                initialProductId
                  ? 'bg-gray-100 text-gray-600 cursor-not-allowed border-gray-300'
                  : 'bg-white border-[#D1E3EB] focus:border-[#017E9A]'
              }`}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.codigo}] {p.nombre} ({p.tipo || 'Producto'})
                </option>
              ))}
            </select>
          </div>

          {/* Insumos List */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold text-gray-700">
                Insumos &amp; Materias Primas de la Receta
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-[#017E9A] font-brand font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Insumo</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="bg-[#F4F8FA] p-2.5 rounded-xl border border-[#D1E3EB] flex flex-wrap items-center gap-2"
                >
                  <select
                    value={it.insumoId}
                    onChange={(e) => handleUpdateItem(idx, 'insumoId', e.target.value)}
                    className="flex-1 min-w-[160px] p-1.5 border border-[#D1E3EB] rounded-lg bg-white text-xs focus:outline-none focus:border-[#017E9A]"
                  >
                    {allInsumoOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.nombre}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={it.gramosOCantidad}
                    onChange={(e) =>
                      handleUpdateItem(idx, 'gramosOCantidad', parseFloat(e.target.value) || 0)
                    }
                    className="w-20 p-1.5 border border-[#D1E3EB] rounded-lg bg-white text-xs font-semibold text-center focus:outline-none focus:border-[#017E9A]"
                  />

                  <select
                    value={it.unidad || 'grs'}
                    onChange={(e) => handleUpdateItem(idx, 'unidad', e.target.value)}
                    className="w-16 p-1.5 border border-[#D1E3EB] rounded-lg bg-white text-xs font-semibold focus:outline-none focus:border-[#017E9A]"
                  >
                    <option value="grs">grs</option>
                    <option value="u">u.</option>
                    <option value="kg">Kg</option>
                  </select>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Quitar de la receta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
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
              <span>Guardar Receta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
