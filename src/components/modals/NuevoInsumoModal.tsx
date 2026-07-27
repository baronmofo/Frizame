import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, X, Check, Package, AlertTriangle } from 'lucide-react';
import { RawMaterial } from '../../types';

interface NuevoInsumoModalProps {
  isOpen: boolean;
  onClose: () => void;
  insumoToEdit?: RawMaterial | null;
}

export const NuevoInsumoModal: React.FC<NuevoInsumoModalProps> = ({
  isOpen,
  onClose,
  insumoToEdit,
}) => {
  const { suppliers, systemConfig, rawMaterials, addRawMaterial, updateRawMaterial } = useApp();

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Insumo');
  const [proveedor, setProveedor] = useState('');
  const [marca, setMarca] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('Kg');
  const [presentacion, setPresentacion] = useState('');
  const [umPorPresentacion, setUmPorPresentacion] = useState<number>(1);
  const [costo, setCosto] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [stockMinimo, setStockMinimo] = useState<number>(5);
  const [stockMaximo, setStockMaximo] = useState<number>(100);

  const [codeError, setCodeError] = useState('');
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null);

  const categories = systemConfig?.productCategories
    ? systemConfig.productCategories.map((c) => (typeof c === 'string' ? c : c.nombre))
    : ['Insumo', '1XX - Granel (Kg)', '2XX - Bandeja', 'Marketing', 'Otros'];

  const getNextFreeCode = (catVal: string) => {
    const rule = systemConfig?.codeRules?.find((r) => r.categoria === catVal || catVal.includes(r.categoria) || r.categoria.includes(catVal));
    const minStart = rule?.min && rule.min > 0 ? rule.min : (catVal.toLowerCase().includes('marketing') ? 300 : 401);
    const usedCodes = new Set(
      rawMaterials
        .filter((r) => !insumoToEdit || r.id !== insumoToEdit.id)
        .map((r) => parseInt((r.codigo || '').replace(/\D/g, ''), 10))
        .filter((n) => !isNaN(n))
    );

    let candidate = minStart;
    while (usedCodes.has(candidate)) {
      candidate++;
    }
    return String(candidate);
  };

  const validateCode = (codeVal: string, catVal: string) => {
    if (!codeVal.trim()) {
      setCodeError('El código es obligatorio');
      setSuggestedCode(null);
      return false;
    }

    const isTaken = rawMaterials.some(
      (r) =>
        (!insumoToEdit || r.id !== insumoToEdit.id) &&
        r.codigo &&
        r.codigo.trim().toLowerCase() === codeVal.trim().toLowerCase()
    );

    if (isTaken) {
      const free = getNextFreeCode(catVal);
      setCodeError(`El código "${codeVal}" ya está asignado a otro insumo.`);
      setSuggestedCode(free);
      return false;
    }

    const rule = systemConfig?.codeRules?.find((r) => r.categoria === catVal || catVal.includes(r.categoria) || r.categoria.includes(catVal));
    if (!rule || rule.modo === 'libre') {
      setCodeError('');
      setSuggestedCode(null);
      return true;
    }

    const numVal = parseInt(codeVal.replace(/\D/g, ''), 10);
    if (isNaN(numVal)) {
      setCodeError(`La categoría ${catVal} requiere un código numérico válido.`);
      setSuggestedCode(getNextFreeCode(catVal));
      return false;
    }

    if (rule.modo === 'rango' && rule.min !== undefined && rule.max !== undefined) {
      if (numVal < rule.min || numVal > rule.max) {
        setCodeError(`Código fuera del rango para ${catVal} (${rule.min} a ${rule.max}).`);
        setSuggestedCode(getNextFreeCode(catVal));
        return false;
      }
    } else if (rule.modo === 'mayor' && rule.min !== undefined) {
      if (numVal <= rule.min) {
        setCodeError(`Código inválido. Para ${catVal} debe ser mayor a ${rule.min}.`);
        setSuggestedCode(getNextFreeCode(catVal));
        return false;
      }
    } else if (rule.modo === 'menor' && rule.max !== undefined) {
      if (numVal >= rule.max) {
        setCodeError(`Código inválido. Para ${catVal} debe ser menor a ${rule.max}.`);
        setSuggestedCode(getNextFreeCode(catVal));
        return false;
      }
    }

    setCodeError('');
    setSuggestedCode(null);
    return true;
  };

  // Track previous edit state to only reset when editing a different item or opening fresh
  const [lastEditId, setLastEditId] = useState<string | number | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (insumoToEdit) {
        if (lastEditId !== insumoToEdit.id) {
          setLastEditId(insumoToEdit.id);
          setCodigo(insumoToEdit.codigo || `INS-${insumoToEdit.id}`);
          setNombre(insumoToEdit.nombre || '');
          setCategoria(insumoToEdit.categoria || 'Insumo');
          setProveedor(insumoToEdit.proveedor || suppliers[0]?.nombre || 'General');
          setMarca(insumoToEdit.marca || '');
          setUnidadMedida(insumoToEdit.unidadMedida || insumoToEdit.unidad || 'Kg');
          setPresentacion(insumoToEdit.presentacion || '');
          setUmPorPresentacion(insumoToEdit.umPorPresentacion || 1);
          setCosto(insumoToEdit.costo || 0);
          setStock(insumoToEdit.stock || 0);
          setStockMinimo(insumoToEdit.stockMinimo !== undefined ? insumoToEdit.stockMinimo : 5);
          setStockMaximo(insumoToEdit.stockMaximo !== undefined ? insumoToEdit.stockMaximo : 100);
          validateCode(insumoToEdit.codigo || `INS-${insumoToEdit.id}`, insumoToEdit.categoria || 'Insumo');
        }
      } else {
        if (lastEditId !== 'new') {
          setLastEditId('new');
          const defaultCat = 'Insumo';
          const rule = systemConfig?.codeRules?.find((r) => r.categoria === defaultCat);
          const defaultCode = rule && rule.min ? String(rule.min) : `401`;
          setCodigo(defaultCode);
          setNombre('');
          setCategoria(defaultCat);
          setProveedor(suppliers[0]?.nombre || 'General');
          setMarca('');
          setUnidadMedida('Kg');
          setPresentacion('');
          setUmPorPresentacion(1);
          setCosto(0);
          setStock(10);
          setStockMinimo(5);
          setStockMaximo(100);
          validateCode(defaultCode, defaultCat);
        }
      }
    }
  }, [isOpen, insumoToEdit]);

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

  const costoUnidadCalc = umPorPresentacion > 0 ? costo / umPorPresentacion : costo;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCode(codigo, categoria)) return;
    if (!nombre.trim() || costo <= 0) return;

    const payload: Partial<RawMaterial> = {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      categoria,
      proveedor: proveedor || 'General',
      marca: marca || 'Marca Propia',
      unidadMedida,
      presentacion: presentacion || `Caja x ${umPorPresentacion} ${unidadMedida}`,
      umPorPresentacion,
      costo,
      costoUnidad: Math.round(costoUnidadCalc * 100) / 100,
      unidad: unidadMedida,
      stock,
      stockMinimo,
      stockMaximo,
      fechaUltimaActualizacionCosto: new Date().toISOString().split('T')[0],
      activo: true,
    };

    if (insumoToEdit) {
      updateRawMaterial(insumoToEdit.id, payload);
    } else {
      addRawMaterial(payload);
    }

    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0B4F6C]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-[#D1E3EB] animate-fadeIn max-h-[90vh] flex flex-col"
      >
        <div className="bg-[#E8F4F8] px-5 py-3.5 border-b border-[#D1E3EB] flex justify-between items-center shrink-0">
          <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#017E9A]" />
            {insumoToEdit ? `Editar Ficha de Insumo: [${insumoToEdit.codigo || insumoToEdit.id}]` : 'Alta de Ficha de Materia Prima / Insumo'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs md:text-sm overflow-y-auto flex-1">
          {/* Row 1: Categoría (top-left) & Código (top-right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setCategoria(newCat);
                  const autoCode = getNextFreeCode(newCat);
                  setCodigo(autoCode);
                  validateCode(autoCode, newCat);
                }}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white font-semibold text-[#0B4F6C]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Código Insumo</label>
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => {
                  const val = e.target.value;
                  setCodigo(val);
                  validateCode(val, categoria);
                }}
                placeholder="Ej: 401"
                className={`w-full p-2 border rounded-lg font-mono font-bold text-[#0B4F6C] focus:outline-none ${
                  codeError ? 'border-red-500 bg-red-50' : 'border-[#D1E3EB] focus:border-[#017E9A]'
                }`}
              />
              {/* Dynamic Legend for Valid Code Parameters */}
              <div className="mt-1 text-[11px] text-[#017E9A] font-medium bg-[#E8F4F8] p-1.5 rounded-md border border-[#D1E3EB] flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-[#017E9A] shrink-0" />
                <span>
                  <strong className="text-[#0B4F6C]">Rango [{categoria}]:</strong>{' '}
                  {(() => {
                    const rule = systemConfig?.codeRules?.find((r) => r.categoria === categoria || categoria.includes(r.categoria) || r.categoria.includes(categoria));
                    if (!rule || rule.modo === 'libre') return 'Código libre sin restricción de rango.';
                    if (rule.modo === 'rango') return `Valores numéricos de ${rule.min} a ${rule.max}.`;
                    if (rule.modo === 'mayor') return `Numérico mayor a ${rule.min}.`;
                    if (rule.modo === 'menor') return `Numérico menor a ${rule.max}.`;
                    return 'Código numérico válido.';
                  })()}
                </span>
              </div>
            </div>
          </div>

          {codeError && (
            <div className="p-2.5 bg-red-100 border border-red-300 rounded-lg text-red-700 font-semibold text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 animate-fadeIn">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{codeError}</span>
              </div>
              {suggestedCode && (
                <button
                  type="button"
                  onClick={() => {
                    setCodigo(suggestedCode);
                    validateCode(suggestedCode, categoria);
                  }}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-brand font-bold rounded-md text-[11px] shrink-0 transition-colors shadow-2xs"
                >
                  Usar Sugerido: {suggestedCode}
                </button>
              )}
            </div>
          )}

          {/* Row 2: Proveedor occupying full modal width */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Proveedor (Agenda)</label>
            <select
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white font-semibold text-gray-800"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.nombre}>
                  {s.nombre} ({s.rubro || 'Gral'})
                </option>
              ))}
              <option value="General">-- Proveedor General / Sin Agendar --</option>
            </select>
          </div>

          {/* Row 3: Nombre de la Materia Prima */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Nombre de la Materia Prima / Insumo</label>
            <input
              type="text"
              required
              placeholder="Ej: Qx Mozzarella Barra / Volante BN"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-2 border border-[#D1E3EB] rounded-lg focus:outline-none focus:border-[#017E9A]"
            />
          </div>

          {/* Row 4: Marca Comercial & Nombre Presentación Comercial en la misma fila */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Marca Comercial</label>
              <input
                type="text"
                placeholder="Ej: Vidalac / Arcor"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Nombre Presentación Comercial</label>
              <input
                type="text"
                placeholder="Ej: Horma / Caja / Bolsa x 25 Kg"
                value={presentacion}
                onChange={(e) => setPresentacion(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg"
              />
            </div>
          </div>

          {/* Row 5: Unidad de Medida (U.M.) & U.M. x Presentación en la misma fila */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Unidad de Medida (U.M.)</label>
              <select
                value={unidadMedida}
                onChange={(e) => setUnidadMedida(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white font-semibold"
              >
                <option value="Kg">Kilogramos (Kg)</option>
                <option value="u.">Unidades (u.)</option>
                <option value="grs">Gramos (grs)</option>
                <option value="lts">Litros (lts)</option>
                <option value="cm">Centímetros (cm)</option>
                <option value="m.">Metros (m.)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">U.M. x Presentación</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={umPorPresentacion}
                onChange={(e) => setUmPorPresentacion(parseFloat(e.target.value) || 1)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg font-bold text-[#0B4F6C]"
              />
            </div>
          </div>

          {/* Tarjeta de color con Costo Presentación ($) y Costo Unitario Calculado ($) */}
          <div className="bg-[#E8F4F8] p-3.5 rounded-xl border border-[#D1E3EB] grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block font-bold text-[#0B4F6C] mb-1 text-xs">Costo Presentación ($)</label>
              <input
                type="number"
                min="1"
                required
                value={costo}
                onChange={(e) => setCosto(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg font-extrabold text-emerald-800 bg-white"
              />
            </div>

            <div className="flex flex-col justify-center sm:items-end bg-white/70 p-2 rounded-lg border border-[#D1E3EB]">
              <span className="font-semibold text-gray-600 text-xs">Costo Unitario Calculado:</span>
              <strong className="text-emerald-700 font-extrabold text-base">
                ${costoUnidadCalc.toFixed(2)} / {unidadMedida}
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Stock Actual</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg font-bold text-[#0B4F6C]"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Stock Mínimo</label>
              <input
                type="number"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg font-semibold text-amber-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Stock Máximo</label>
              <input
                type="number"
                value={stockMaximo}
                onChange={(e) => setStockMaximo(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg font-semibold text-gray-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#D1E3EB] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D1E3EB] text-gray-700 font-brand rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!!codeError}
              className={`px-5 py-2 text-white font-brand font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors ${
                codeError ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0B4F6C] hover:bg-[#083b52]'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{insumoToEdit ? 'Actualizar Ficha de Insumo' : 'Guardar Ficha de Insumo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
