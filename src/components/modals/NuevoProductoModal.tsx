import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Package, X, Check, Trash2, Plus, Receipt, Image as ImageIcon, Flame, AlertTriangle } from 'lucide-react';
import { Product, ProductType, RecipeItem, CookingMethods } from '../../types';
import { ConfirmModal } from './ConfirmModal';

interface NuevoProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const NuevoProductoModal: React.FC<NuevoProductoModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { products, rawMaterials, recipes, systemConfig, addProduct, updateProduct, deleteProduct, addRecipe } = useApp();

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<ProductType>('2XX - Bandeja');
  const [presentacionTexto, setPresentacionTexto] = useState('Bandeja por 400 gr');
  const [grsPorBandeja, setGrsPorBandeja] = useState(400);
  const [stockGranelKg, setStockGranelKg] = useState(0);
  const [stockBandejas, setStockBandejas] = useState(0);
  const [stockMinimo, setStockMinimo] = useState(5);
  const [stockMaximo, setStockMaximo] = useState(100);
  
  const [ingredientes, setIngredientes] = useState('');
  const [alergenos, setAlergenos] = useState('');
  const [conservacion, setConservacion] = useState('-18°C (Freezer)');
  
  // Cooking pictograms
  const [metodosCoccion, setMetodosCoccion] = useState<CookingMethods>({
    sarten: true,
    horno: true,
    frito: true,
    sinDescongelar: true,
  });

  // Images
  const [productoImagenJpg, setProductoImagenJpg] = useState('');
  const [rotuloImagenJpg, setRotuloImagenJpg] = useState('');
  const [stickerImagenJpg, setStickerImagenJpg] = useState('');
  const [paginaCompletaImagenJpg, setPaginaCompletaImagenJpg] = useState('');

  // Code validation state
  const [codeError, setCodeError] = useState('');

  // Recipe composition state
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);

  // Deletion confirm modal state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Available categories list
  const rawCategories = systemConfig?.productCategories || [
    '1XX - Granel (Kg)',
    '2XX - Bandeja',
    'Insumo',
    'Marketing',
    'Otros',
  ];

  const categoriesList: string[] = rawCategories.map((c: any) =>
    typeof c === 'string' ? c : c.nombre
  );

  // Available insumos pool: code 1XX bulk products + rawMaterials
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

  useEffect(() => {
    if (productToEdit) {
      setCodigo(productToEdit.codigo || '');
      setNombre(productToEdit.nombre || '');
      const safeTipo = typeof productToEdit.tipo === 'string'
        ? productToEdit.tipo
        : (productToEdit.tipo as any)?.nombre || '2XX - Bandeja';
      setTipo(safeTipo as ProductType);
      setPresentacionTexto(
        productToEdit.presentacionTexto ||
          (productToEdit.tipo === 'Gramos' || String(productToEdit.tipo).includes('1XX')
            ? 'Granel x Kg'
            : `Bandeja por ${productToEdit.grsPorBandeja || productToEdit.pesoGrs || 400} gr`)
      );
      setGrsPorBandeja(productToEdit.grsPorBandeja || productToEdit.pesoGrs || 400);
      setStockGranelKg(productToEdit.stockGranelKg || 0);
      setStockBandejas(productToEdit.stockBandejas || 0);
      setStockMinimo(productToEdit.stockMinimo !== undefined ? productToEdit.stockMinimo : 5);
      setStockMaximo(productToEdit.stockMaximo !== undefined ? productToEdit.stockMaximo : 100);

      setIngredientes(productToEdit.ingredientes || '');
      setAlergenos(productToEdit.alergenos || '');
      setConservacion(productToEdit.conservacion || '-18°C (Freezer)');

      setMetodosCoccion({
        sarten: productToEdit.metodosCoccion?.sarten ?? true,
        horno: productToEdit.metodosCoccion?.horno ?? true,
        frito: productToEdit.metodosCoccion?.frito ?? true,
        sinDescongelar: productToEdit.metodosCoccion?.sinDescongelar ?? true,
      });

      setProductoImagenJpg(productToEdit.productoImagenJpg || '');
      setRotuloImagenJpg(productToEdit.rotuloImagenJpg || '');
      setStickerImagenJpg(productToEdit.stickerImagenJpg || '');
      setPaginaCompletaImagenJpg(productToEdit.paginaCompletaImagenJpg || '');

      // Load existing recipe for this product
      const existing = recipes.find(
        (r) => r.productoId === productToEdit.id || String(r.productoId) === String(productToEdit.id)
      );
      if (existing && existing.insumos && existing.insumos.length > 0) {
        setRecipeItems(existing.insumos);
      } else if (allInsumoOptions.length > 0) {
        setRecipeItems([
          {
            insumoId: allInsumoOptions[0].id,
            insumoNombre: allInsumoOptions[0].nombre,
            gramosOCantidad: productToEdit.grsPorBandeja || 400,
            unidad: 'grs',
          },
        ]);
      } else {
        setRecipeItems([]);
      }
    } else {
      setCodigo('');
      setNombre('');
      setTipo('2XX - Bandeja');
      setPresentacionTexto('Bandeja por 400 gr');
      setGrsPorBandeja(400);
      setStockGranelKg(0);
      setStockBandejas(0);
      setStockMinimo(5);
      setStockMaximo(100);

      setIngredientes('');
      setAlergenos('');
      setConservacion('-18°C (Freezer)');

      setMetodosCoccion({
        sarten: true,
        horno: true,
        frito: true,
        sinDescongelar: true,
      });

      setProductoImagenJpg('');
      setRotuloImagenJpg('');
      setStickerImagenJpg('');
      setPaginaCompletaImagenJpg('');

      if (allInsumoOptions.length > 0) {
        setRecipeItems([
          {
            insumoId: allInsumoOptions[0].id,
            insumoNombre: allInsumoOptions[0].nombre,
            gramosOCantidad: 400,
            unidad: 'grs',
          },
        ]);
      } else {
        setRecipeItems([]);
      }
    }
  }, [productToEdit, isOpen]);

  // Code validation against rules in ABM
  const validateCode = (codeVal: string, catVal: string) => {
    setCodeError('');
    if (!codeVal.trim()) return true;

    const numericCode = parseInt(codeVal.trim(), 10);
    const rule = systemConfig?.codeRules?.find((r) => r.categoria === catVal);

    if (rule && !isNaN(numericCode)) {
      if (rule.modo === 'rango') {
        if (numericCode < rule.min || numericCode > rule.max) {
          setCodeError(`El código para ${catVal} debe estar entre ${rule.min} y ${rule.max}.`);
          return false;
        }
      } else if (rule.modo === 'mayor' && numericCode <= rule.min) {
        setCodeError(`El código para ${catVal} debe ser mayor a ${rule.min}.`);
        return false;
      } else if (rule.modo === 'menor' && numericCode >= rule.max) {
        setCodeError(`El código para ${catVal} debe ser menor a ${rule.max}.`);
        return false;
      }
    }
    return true;
  };

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

  const handleAddRecipeItem = () => {
    const firstOpt = allInsumoOptions[0];
    if (!firstOpt) return;
    setRecipeItems((prev) => [
      ...prev,
      {
        insumoId: firstOpt.id,
        insumoNombre: firstOpt.nombre,
        gramosOCantidad: 1,
        unidad: firstOpt.unidadDefault,
      },
    ]);
  };

  const handleRemoveRecipeItem = (index: number) => {
    setRecipeItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRecipeItem = (index: number, field: keyof RecipeItem, value: any) => {
    setRecipeItems((prev) =>
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
    if (!nombre.trim() || !codigo.trim()) {
      alert('Por favor ingrese código y nombre del producto.');
      return;
    }

    if (!validateCode(codigo, tipo)) {
      return;
    }

    const numericGrs = parseFloat(presentacionTexto.replace(/[^0-9.]/g, '')) || grsPorBandeja || 400;

    const payload: Partial<Product> = {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      tipo,
      presentacionTexto: presentacionTexto.trim(),
      pesoGrs: numericGrs,
      grsPorBandeja: numericGrs,
      stockGranelKg: Number(stockGranelKg),
      stockBandejas: Number(stockBandejas),
      stockMinimo: Number(stockMinimo),
      stockMaximo: Number(stockMaximo),
      ingredientes: ingredientes.trim(),
      alergenos: alergenos.trim(),
      conservacion: conservacion.trim(),
      metodosCoccion,
      productoImagenJpg,
      rotuloImagenJpg,
      stickerImagenJpg,
      paginaCompletaImagenJpg,
    };

    let targetProductId = productToEdit?.id;

    if (productToEdit) {
      updateProduct(productToEdit.id, payload);
    } else {
      targetProductId = Date.now();
      addProduct({ ...payload, id: targetProductId });
    }

    // Save associated recipe composition
    if (targetProductId && recipeItems.length > 0) {
      addRecipe({
        productoId: targetProductId,
        insumos: recipeItems,
      });
    }

    onClose();
  };

  const handleConfirmDeleteProduct = () => {
    if (!productToEdit) return;
    deleteProduct(productToEdit.id);
    setIsDeleteConfirmOpen(false);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0B4F6C]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-[#D1E3EB] animate-fadeIn"
      >
        {/* Header */}
        <div className="bg-[#E8F4F8] px-5 py-3.5 border-b border-[#D1E3EB] flex justify-between items-center">
          <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#017E9A]" />
            {productToEdit ? `Editar Producto: [${productToEdit.codigo}]` : 'Nuevo Producto en Catálogo'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs md:text-sm max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Categoría / Tipo</label>
              <select
                value={tipo}
                onChange={(e) => {
                  const newCat = e.target.value as ProductType;
                  setTipo(newCat);
                  validateCode(codigo, newCat);
                }}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white font-medium focus:outline-none focus:border-[#017E9A]"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Código Validado</label>
              <input
                type="text"
                required
                readOnly={!!productToEdit}
                value={codigo}
                onChange={(e) => {
                  if (productToEdit) return;
                  const val = e.target.value;
                  setCodigo(val);
                  validateCode(val, tipo);
                }}
                placeholder="Ej: 101, 201..."
                className={`w-full p-2 border rounded-lg font-mono font-bold text-[#0B4F6C] focus:outline-none ${
                  productToEdit
                    ? 'bg-gray-100 text-gray-600 cursor-not-allowed border-gray-300'
                    : codeError
                    ? 'border-red-500 bg-red-50'
                    : 'border-[#D1E3EB] focus:border-[#017E9A]'
                }`}
              />
              {codeError && (
                <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  <span>{codeError}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Nombre / Descripción</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: BASTONCITOS DE MOZZARELLA X KG."
                className="w-full p-2 border border-[#D1E3EB] rounded-lg font-semibold text-gray-800 focus:outline-none focus:border-[#017E9A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Presentación Comercial</label>
              <input
                type="text"
                value={presentacionTexto}
                onChange={(e) => setPresentacionTexto(e.target.value)}
                placeholder="Ej: Bandeja por 400 gr"
                className="w-full p-2 border border-[#D1E3EB] rounded-lg font-bold text-[#0B4F6C] focus:outline-none focus:border-[#017E9A]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Condiciones de Conservación</label>
              <input
                type="text"
                value={conservacion}
                onChange={(e) => setConservacion(e.target.value)}
                placeholder="-18°C (Freezer)"
                className="w-full p-2 border border-[#D1E3EB] rounded-lg focus:outline-none focus:border-[#017E9A]"
              />
            </div>
          </div>

          {/* Stock & Alertas Mín / Máx per product */}
          <div className="bg-[#E8F4F8]/60 p-3.5 rounded-xl border border-[#D1E3EB] space-y-2">
            <h4 className="font-brand font-bold text-xs text-[#0B4F6C] uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#017E9A]" />
              <span>Control de Inventario y Parámetros de Stock (Mín / Máx)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Stock Granel (Kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={stockGranelKg}
                  onChange={(e) => setStockGranelKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 border border-[#D1E3EB] rounded-lg bg-white font-bold text-gray-800 focus:outline-none focus:border-[#017E9A]"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Stock Bandejas (Un.)</label>
                <input
                  type="number"
                  min="0"
                  value={stockBandejas}
                  onChange={(e) => setStockBandejas(parseInt(e.target.value) || 0)}
                  className="w-full p-1.5 border border-[#D1E3EB] rounded-lg bg-white font-bold text-emerald-700 focus:outline-none focus:border-[#017E9A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-amber-800 mb-1">Stock Mínimo (Alerta)</label>
                <input
                  type="number"
                  min="0"
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(parseInt(e.target.value) || 0)}
                  className="w-full p-1.5 border border-amber-300 rounded-lg bg-amber-50/50 font-bold text-amber-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0B4F6C] mb-1">Stock Máximo (Techo)</label>
                <input
                  type="number"
                  min="1"
                  value={stockMaximo}
                  onChange={(e) => setStockMaximo(parseInt(e.target.value) || 0)}
                  className="w-full p-1.5 border border-[#D1E3EB] rounded-lg bg-white font-bold text-[#0B4F6C] focus:outline-none focus:border-[#017E9A]"
                />
              </div>
            </div>
          </div>

          {/* Ingredientes, Alérgenos, y Pictogramas de Cocción */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Ingredientes</label>
                <textarea
                  rows={2}
                  value={ingredientes}
                  onChange={(e) => setIngredientes(e.target.value)}
                  placeholder="Ej: Queso Mozzarella, harina, huevo, pan rallado..."
                  className="w-full p-2 border border-[#D1E3EB] rounded-lg focus:outline-none focus:border-[#017E9A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Alérgenos e Indicaciones</label>
                <textarea
                  rows={2}
                  value={alergenos}
                  onChange={(e) => setAlergenos(e.target.value)}
                  placeholder="Ej: CONTIENE LECHE, HUEVO Y TRIGO (GLUTEN)."
                  className="w-full p-2 border border-[#D1E3EB] rounded-lg focus:outline-none focus:border-[#017E9A]"
                />
              </div>
            </div>

            {/* Pictogramas de Cocción */}
            <div className="bg-[#F4F8FA] p-3 rounded-xl border border-[#D1E3EB]">
              <label className="block font-brand font-bold text-xs text-[#0B4F6C] uppercase mb-2 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>Pictogramas de Cocción Sugeridos</span>
              </label>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-800">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#017E9A]">
                  <input
                    type="checkbox"
                    checked={metodosCoccion.sarten}
                    onChange={(e) => setMetodosCoccion({ ...metodosCoccion, sarten: e.target.checked })}
                    className="w-4 h-4 rounded text-[#017E9A] focus:ring-[#017E9A]"
                  />
                  <span>🍳 Sartén</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#017E9A]">
                  <input
                    type="checkbox"
                    checked={metodosCoccion.horno}
                    onChange={(e) => setMetodosCoccion({ ...metodosCoccion, horno: e.target.checked })}
                    className="w-4 h-4 rounded text-[#017E9A] focus:ring-[#017E9A]"
                  />
                  <span>🔥 Horno (200°C)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#017E9A]">
                  <input
                    type="checkbox"
                    checked={metodosCoccion.frito}
                    onChange={(e) => setMetodosCoccion({ ...metodosCoccion, frito: e.target.checked })}
                    className="w-4 h-4 rounded text-[#017E9A] focus:ring-[#017E9A]"
                  />
                  <span>🍟 Freidora / Abundante Aceite</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#017E9A]">
                  <input
                    type="checkbox"
                    checked={metodosCoccion.sinDescongelar}
                    onChange={(e) => setMetodosCoccion({ ...metodosCoccion, sinDescongelar: e.target.checked })}
                    className="w-4 h-4 rounded text-[#017E9A] focus:ring-[#017E9A]"
                  />
                  <span>❄️ Cocinar Sin Descongelar</span>
                </label>
              </div>
            </div>
          </div>

          {/* Recipe Composition Section */}
          <div className="pt-3 border-t border-[#D1E3EB] space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-brand font-bold text-xs text-[#0B4F6C] uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#017E9A]" />
                <span>Receta / Composición (Insumos Requeridos)</span>
              </h4>
              <button
                type="button"
                onClick={handleAddRecipeItem}
                className="text-xs text-[#017E9A] font-brand font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Insumo</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {recipeItems.length === 0 ? (
                <p className="text-xs text-gray-500 italic bg-[#F4F8FA] p-2.5 rounded-lg border border-dashed border-[#D1E3EB] text-center">
                  Sin insumos en la receta. Presione "+ Agregar Insumo" para asociar ingredientes.
                </p>
              ) : (
                recipeItems.map((it, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F4F8FA] p-2 rounded-xl border border-[#D1E3EB] flex flex-wrap items-center gap-2"
                  >
                    <select
                      value={it.insumoId}
                      onChange={(e) => handleUpdateRecipeItem(idx, 'insumoId', e.target.value)}
                      className="flex-1 min-w-[150px] p-1.5 border border-[#D1E3EB] rounded-lg bg-white text-xs focus:outline-none focus:border-[#017E9A]"
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
                        handleUpdateRecipeItem(idx, 'gramosOCantidad', parseFloat(e.target.value) || 0)
                      }
                      className="w-20 p-1.5 border border-[#D1E3EB] rounded-lg bg-white text-xs font-semibold text-center focus:outline-none focus:border-[#017E9A]"
                    />

                    <select
                      value={it.unidad || 'grs'}
                      onChange={(e) => handleUpdateRecipeItem(idx, 'unidad', e.target.value)}
                      className="w-16 p-1.5 border border-[#D1E3EB] rounded-lg bg-white text-xs font-semibold focus:outline-none focus:border-[#017E9A]"
                    >
                      <option value="grs">grs</option>
                      <option value="u">u.</option>
                      <option value="kg">Kg</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveRecipeItem(idx)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Quitar de la receta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Media JPG Attachments including Imagen JPG del Producto */}
          <div className="pt-2 border-t border-[#D1E3EB] space-y-3">
            <h4 className="font-brand font-bold text-xs text-[#0B4F6C] uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#017E9A]" />
              <span>Imágenes JPG del Producto y Rótulos</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Imagen JPG del Producto */}
              <div className="bg-[#F4F8FA] p-3 rounded-xl border border-[#D1E3EB]">
                <label className="block text-xs font-semibold text-[#0B4F6C] mb-1.5">
                  Imagen JPG del Producto
                </label>
                {productoImagenJpg ? (
                  <div className="space-y-2">
                    <div className="h-24 bg-white rounded border border-gray-200 p-1 flex items-center justify-center overflow-hidden">
                      <img src={productoImagenJpg} alt="Producto JPG" className="max-h-full max-w-full object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setProductoImagenJpg('')}
                      className="text-xs text-red-600 font-semibold underline"
                    >
                      Quitar Imagen Producto
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setProductoImagenJpg(ev.target?.result as string || '');
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-gray-600 w-full"
                    />
                  </div>
                )}
              </div>

              {/* Rótulo JPG */}
              <div className="bg-[#F4F8FA] p-3 rounded-xl border border-[#D1E3EB]">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Imagen JPG del Rótulo
                </label>
                {rotuloImagenJpg ? (
                  <div className="space-y-2">
                    <div className="h-24 bg-white rounded border border-gray-200 p-1 flex items-center justify-center overflow-hidden">
                      <img src={rotuloImagenJpg} alt="Rótulo JPG" className="max-h-full max-w-full object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setRotuloImagenJpg('')}
                      className="text-xs text-red-600 font-semibold underline"
                    >
                      Quitar Imagen Rótulo
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setRotuloImagenJpg(ev.target?.result as string || '');
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-gray-600 w-full"
                    />
                  </div>
                )}
              </div>

              {/* Sticker JPG */}
              <div className="bg-[#F4F8FA] p-3 rounded-xl border border-[#D1E3EB]">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Imagen JPG del Sticker
                </label>
                {stickerImagenJpg ? (
                  <div className="space-y-2">
                    <div className="h-24 bg-white rounded border border-gray-200 p-1 flex items-center justify-center overflow-hidden">
                      <img src={stickerImagenJpg} alt="Sticker JPG" className="max-h-full max-w-full object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setStickerImagenJpg('')}
                      className="text-xs text-red-600 font-semibold underline"
                    >
                      Quitar Imagen Sticker
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setStickerImagenJpg(ev.target?.result as string || '');
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-gray-600 w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-3 border-t border-[#D1E3EB]">
            {productToEdit ? (
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-brand rounded-lg flex items-center gap-1 transition-colors text-xs font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Producto</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#D1E3EB] text-gray-700 font-brand rounded-lg hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand rounded-lg flex items-center gap-1.5 shadow-sm font-semibold"
              >
                <Check className="w-4 h-4" />
                <span>{productToEdit ? 'Guardar Cambios' : 'Crear Producto'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDeleteProduct}
        title={`Eliminar Producto [${productToEdit?.codigo}]`}
        message={
          <div className="space-y-2">
            <p>
              ¿Está seguro de eliminar o dar de baja el producto <strong>[{productToEdit?.codigo}] {productToEdit?.nombre}</strong>?
            </p>
            <p className="text-xs text-gray-500">
              Si el producto tiene stock disponible, movimientos históricos o productos asociados (como su versión en bandeja/granel), se mantendrá en estado <strong>INACTIVO</strong> con la opción de reactivarlo en cualquier momento.
            </p>
          </div>
        }
        confirmText="Confirmar Baja / Eliminación"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};
