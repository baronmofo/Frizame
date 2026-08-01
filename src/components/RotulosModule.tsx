import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Printer,
  Upload,
  Eye,
  Sliders,
  Sparkles,
  PackageCheck,
  Share2,
} from 'lucide-react';
import { FrizameLogo } from './FrizameLogo';

interface RotulosModuleProps {
  onTriggerPrint?: (labelConfig: any) => void;
}

export const RotulosModule: React.FC<RotulosModuleProps> = ({ onTriggerPrint }) => {
  const { systemConfig, products, rawMaterials, updateProductRotuloImagen, updateProductStickerImagen } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCategoryTipoDefault = (nombre: string): 'Productos' | 'Materia Prima' | 'Otro' => {
    const lower = nombre.toLowerCase();
    if (lower.includes('insumo') || lower.includes('materia') || lower.startsWith('4')) {
      return 'Materia Prima';
    }
    if (
      lower.includes('marketing') ||
      lower.includes('difus') ||
      lower.includes('otro') ||
      lower.startsWith('3') ||
      lower.startsWith('5')
    ) {
      return 'Otro';
    }
    return 'Productos';
  };

  const parsedCategories = useMemo(() => {
    const rawConfig = systemConfig?.productCategories || [
      '1XX - Granel (Kg)',
      '2XX - Bandeja',
      'Insumo',
      'Marketing',
      'Otros',
    ];
    return rawConfig.map((c: any) => {
      if (typeof c === 'string') {
        return { nombre: c, tipo: getCategoryTipoDefault(c) };
      }
      return {
        nombre: c.nombre,
        tipo: (c.tipo as 'Productos' | 'Materia Prima' | 'Otro') || getCategoryTipoDefault(c.nombre),
      };
    });
  }, [systemConfig?.productCategories]);

  const categories = parsedCategories.map((c) => c.nombre);

  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || '1XX - Granel (Kg)');

  const currentCategoryObj = parsedCategories.find((c) => c.nombre === selectedCategory) || {
    nombre: selectedCategory,
    tipo: getCategoryTipoDefault(selectedCategory),
  };

  const currentTipo = currentCategoryObj.tipo; // 'Productos' | 'Materia Prima' | 'Otro'

  const [printType, setPrintType] = useState<
    'rotulo' | 'sticker' | 'individual' | 'a4_apaisada' | 'a4_vertical' | 'legal_apaisada' | 'legal_vertical'
  >('rotulo');

  // Automatically update active printType if not valid for currentTipo
  useEffect(() => {
    if (currentTipo === 'Productos') {
      if (!['rotulo', 'individual', 'sticker'].includes(printType)) {
        setPrintType('rotulo');
      }
    } else if (currentTipo === 'Materia Prima') {
      if (!['rotulo', 'individual'].includes(printType)) {
        setPrintType('rotulo');
      }
    } else if (currentTipo === 'Otro') {
      if (!['a4_apaisada', 'a4_vertical', 'legal_apaisada', 'legal_vertical'].includes(printType)) {
        setPrintType('a4_apaisada');
      }
    }
  }, [currentTipo, selectedCategory]);

  // Helper to test if a code string matches a rule or category pattern
  const isCodeInCategory = (codeStr?: string, catName?: string) => {
    if (!codeStr || !catName) return false;
    const cleanCat = catName.trim().toLowerCase();
    const cleanCode = codeStr.trim();
    const num = parseInt(cleanCode.replace(/\D/g, ''), 10);

    // Dynamic code validation rules from config
    const valRules = systemConfig?.codeValidationRules;
    if (valRules && !isNaN(num)) {
      if (cleanCat.includes('1xx') || cleanCat.includes('granel')) {
        const r = valRules.granel;
        if (r) return num >= r.min && num <= r.max;
      }
      if (cleanCat.includes('2xx') || cleanCat.includes('bandeja')) {
        const r = valRules.bandeja;
        if (r) return num >= r.min && num <= r.max;
      }
      if (cleanCat.includes('insumo') || cleanCat.includes('4xx')) {
        const r = valRules.insumos;
        if (r) return num >= r.min && num <= r.max;
      }
    }

    const rule = systemConfig?.codeRules?.find(
      (r: any) =>
        r.categoria === catName ||
        cleanCat.includes((r.categoria || '').toLowerCase()) ||
        (r.categoria || '').toLowerCase().includes(cleanCat)
    );

    if (rule && !isNaN(num)) {
      if (rule.modo === 'rango' && rule.min !== undefined && rule.max !== undefined) {
        if (num >= rule.min && num <= rule.max) return true;
      } else if (rule.modo === 'mayor' && rule.min !== undefined) {
        if (num > rule.min) return true;
      } else if (rule.modo === 'menor' && rule.max !== undefined) {
        if (num < rule.max) return true;
      }
    }

    if (cleanCat.startsWith('1')) return cleanCode.startsWith('1');
    if (cleanCat.startsWith('2')) return cleanCode.startsWith('2');
    if (cleanCat.includes('insumo')) return cleanCode.startsWith('4');
    if (cleanCat.includes('marketing')) return cleanCode.startsWith('3') || cleanCode.startsWith('5');
    if (cleanCat.includes('otros')) return cleanCode.startsWith('6');
    return false;
  };

  // Filter products and raw materials by selectedCategory
  const filteredProducts = products.filter((p) => {
    if (p.categoria === selectedCategory || p.tipo === selectedCategory) return true;
    if (isCodeInCategory(p.codigo, selectedCategory)) return true;
    if (selectedCategory.startsWith('1') && (p.codigo.startsWith('1') || p.tipo === 'Gramos')) return true;
    if (selectedCategory.startsWith('2') && (p.codigo.startsWith('2') || p.tipo === 'Bandeja')) return true;
    return false;
  });

  const filteredInsumos = rawMaterials.filter((r) => {
    if (r.categoria === selectedCategory) return true;
    if (isCodeInCategory(r.codigo, selectedCategory)) return true;
    if (selectedCategory.toLowerCase().includes('insumo') && (!r.categoria || r.categoria === 'Insumo'))
      return true;
    return false;
  });

  // Combined list for dropdown
  const categoryItems: Array<{ id: string | number; nombre: string; type: 'product' | 'insumo'; code?: string }> = [
    ...filteredProducts.map((p) => ({ id: p.id, nombre: p.nombre, type: 'product' as const, code: p.codigo })),
    ...filteredInsumos.map((r) => ({ id: r.id, nombre: r.nombre, type: 'insumo' as const, code: r.codigo })),
  ];

  // Fallback if empty
  const defaultItems =
    categoryItems.length > 0
      ? categoryItems
      : products.map((p) => ({ id: p.id, nombre: p.nombre, type: 'product' as const, code: p.codigo }));

  const [selectedItemId, setSelectedItemId] = useState<number | string>(defaultItems[0]?.id || '');

  // Sync selected item when category changes
  useEffect(() => {
    if (categoryItems.length > 0) {
      setSelectedItemId(categoryItems[0].id);
    } else if (products.length > 0) {
      setSelectedItemId(products[0].id);
    }
  }, [selectedCategory, categoryItems.length]);

  const selectedProduct = products.find((p) => String(p.id) === String(selectedItemId));
  const selectedInsumo = rawMaterials.find((r) => String(r.id) === String(selectedItemId));

  const activeItemName = selectedProduct?.nombre || selectedInsumo?.nombre || 'Categoría / Difusión Frizame';

  // Label form state
  const [lote, setLote] = useState('240501');
  const [fechaElab, setFechaElab] = useState(new Date().toISOString().split('T')[0]);
  const [peso, setPeso] = useState('500g');

  // Calculated expiration (6 months from elab date)
  const formattedFecha = useMemo(() => {
    try {
      const d = new Date(fechaElab);
      d.setMonth(d.getMonth() + 6);
      return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch {
      return '30/11/26';
    }
  }, [fechaElab]);

  // QR Code URL for product traceability
  const qrCodeUrl = useMemo(() => {
    const prodCode = selectedProduct?.codigo || selectedInsumo?.codigo || '201';
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://frizame.com.ar/p/${prodCode}?lote=${lote}`;
  }, [selectedProduct, selectedInsumo, lote]);

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProduct) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (printType === 'sticker') {
        updateProductStickerImagen(selectedProduct.id, base64);
      } else {
        updateProductRotuloImagen(selectedProduct.id, base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePrintClick = () => {
    if (onTriggerPrint) {
      onTriggerPrint({
        productoNombre: activeItemName,
        lote: currentTipo === 'Otro' ? '' : lote,
        vencimiento: currentTipo === 'Otro' ? '' : formattedFecha,
        pesoNeto: currentTipo === 'Otro' ? '' : peso,
        conservacion: selectedProduct?.temperatura || '-18°C',
        ingredientes:
          selectedProduct?.ingredientes ||
          (selectedInsumo ? `Insumo / Materia Prima: ${selectedInsumo.nombre}` : ''),
        alergenos: selectedProduct?.alergenos || '',
        picSarten: selectedProduct?.picSarten ?? true,
        picHorno: selectedProduct?.picHorno ?? true,
        picSinDescongelar: selectedProduct?.picSinDescongelar ?? true,
        qrCodeUrl: qrCodeUrl || undefined,
        rotuloImagenJpg: selectedProduct?.rotuloImagenJpg || undefined,
        stickerImagenJpg: selectedProduct?.stickerImagenJpg || undefined,
        printType,
      });
    }

    setTimeout(() => {
      window.print();
    }, 200);
  };

  const gridCopies = Array.from({ length: printType === 'sticker' ? 30 : 9 });
  const currentImageJpg =
    printType === 'sticker' ? selectedProduct?.stickerImagenJpg : selectedProduct?.rotuloImagenJpg;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#D1E3EB] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-brand font-bold text-[#0B4F6C] flex items-center gap-2">
            <Printer className="w-6 h-6 text-[#017E9A]" />
            Materiales e Impresión de Etiquetas
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Diseñe, configure y exporte rótulos, etiquetas, stickers y hojas A4/Legal para sus categorías.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Settings Panel (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#E8F4F8] px-5 py-3 border-b border-[#D1E3EB] flex justify-between items-center">
            <h3 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#017E9A]" />
              Configuración de Impresión
            </h3>
          </div>

          <div className="p-5 space-y-4 text-sm">
            {/* 1. Category Filter: Dynamic Categories */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Categoría de Impresión</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2.5 text-xs md:text-sm border border-[#D1E3EB] rounded-lg bg-white focus:outline-none focus:border-[#017E9A] font-bold text-[#0B4F6C]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Item Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-[#017E9A]" />
                <span>Producto / Elemento del Catálogo</span>
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full p-2.5 text-xs md:text-sm border border-[#D1E3EB] rounded-lg bg-white focus:outline-none focus:border-[#017E9A] font-medium"
              >
                {defaultItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code ? `[${item.code}] ` : ''}
                    {item.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Formato de Impresión segun Tipo de Categoria */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#017E9A]" />
                <span>
                  Formato de Impresión <strong className="text-[#0B4F6C]">({currentTipo})</strong>
                </span>
              </label>

              {currentTipo === 'Productos' && (
                <div className="grid grid-cols-3 gap-1 bg-[#E8F4F8] p-1.5 rounded-lg border border-[#D1E3EB]">
                  <button
                    type="button"
                    onClick={() => setPrintType('rotulo')}
                    className={`py-1.5 px-2 text-[11px] font-brand font-bold rounded-md transition-all ${
                      printType === 'rotulo'
                        ? 'bg-[#0B4F6C] text-white shadow-xs'
                        : 'text-[#0B4F6C] hover:bg-white/60'
                    }`}
                  >
                    Rótulo (3x3 — 9 u)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintType('individual')}
                    className={`py-1.5 px-2 text-[11px] font-brand font-bold rounded-md transition-all ${
                      printType === 'individual'
                        ? 'bg-[#0B4F6C] text-white shadow-xs'
                        : 'text-[#0B4F6C] hover:bg-white/60'
                    }`}
                  >
                    Etiqueta Indiv. (1 u)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintType('sticker')}
                    className={`py-1.5 px-2 text-[11px] font-brand font-bold rounded-md transition-all ${
                      printType === 'sticker'
                        ? 'bg-[#0B4F6C] text-white shadow-xs'
                        : 'text-[#0B4F6C] hover:bg-white/60'
                    }`}
                  >
                    Stickers (5x6 — 30 u)
                  </button>
                </div>
              )}

              {currentTipo === 'Materia Prima' && (
                <div className="grid grid-cols-2 gap-1.5 bg-[#E8F4F8] p-1.5 rounded-lg border border-[#D1E3EB]">
                  <button
                    type="button"
                    onClick={() => setPrintType('rotulo')}
                    className={`py-1.5 px-2 text-xs font-brand font-bold rounded-md transition-all ${
                      printType === 'rotulo'
                        ? 'bg-[#0B4F6C] text-white shadow-xs'
                        : 'text-[#0B4F6C] hover:bg-white/60'
                    }`}
                  >
                    Rótulo A4 (3x3 — 9 u)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintType('individual')}
                    className={`py-1.5 px-2 text-xs font-brand font-bold rounded-md transition-all ${
                      printType === 'individual'
                        ? 'bg-[#0B4F6C] text-white shadow-xs'
                        : 'text-[#0B4F6C] hover:bg-white/60'
                    }`}
                  >
                    Etiqueta Indiv. (1 u)
                  </button>
                </div>
              )}

              {currentTipo === 'Otro' && (
                <div className="grid grid-cols-2 gap-1.5 bg-[#E8F4F8] p-1.5 rounded-lg border border-[#D1E3EB]">
                  <button
                    type="button"
                    onClick={() => setPrintType('a4_apaisada')}
                    className={`py-1.5 px-2 text-xs font-brand font-bold rounded-md transition-all ${
                      printType === 'a4_apaisada'
                        ? 'bg-[#0B4F6C] text-white shadow-xs'
                        : 'text-[#0B4F6C] hover:bg-white/60'
                    }`}
                  >
                    A4 Apaisada
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintType('a4_vertical')}
                    className={`py-1.5 px-2 text-xs font-brand font-bold rounded-md transition-all ${
                      printType === 'a4_vertical'
                        ? 'bg-[#0B4F6C] text-white shadow-xs'
                        : 'text-[#0B4F6C] hover:bg-white/60'
                    }`}
                  >
                    A4 Vertical
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintType('legal_apaisada')}
                    className={`py-1.5 px-2 text-xs font-brand font-bold rounded-md transition-all ${
                      printType === 'legal_apaisada'
                        ? 'bg-[#0B4F6C] text-white shadow-xs'
                        : 'text-[#0B4F6C] hover:bg-white/60'
                    }`}
                  >
                    Legal Apaisada
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintType('legal_vertical')}
                    className={`py-1.5 px-2 text-xs font-brand font-bold rounded-md transition-all ${
                      printType === 'legal_vertical'
                        ? 'bg-[#0B4F6C] text-white shadow-xs'
                        : 'text-[#0B4F6C] hover:bg-white/60'
                    }`}
                  >
                    Legal Vertical
                  </button>
                </div>
              )}
            </div>

            {/* Dynamic Label Variables (Only for Productos and Materia Prima) */}
            {currentTipo !== 'Otro' && (
              <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#D1E3EB] space-y-3">
                <h4 className="font-brand font-bold text-xs text-[#0B4F6C] border-b border-[#D1E3EB] pb-1">
                  Campos de Trazabilidad (Rótulos y Etiquetas)
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Peso Neto / Presentación</label>
                  <input
                    type="text"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    placeholder="Ej: 500g, 1.2kg"
                    className="w-full p-2 text-xs border border-[#D1E3EB] rounded-lg bg-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">N° Lote</label>
                    <input
                      type="text"
                      value={lote}
                      onChange={(e) => setLote(e.target.value)}
                      className="w-full p-2 text-xs border border-[#D1E3EB] rounded-lg bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Vencimiento</label>
                    <input
                      type="date"
                      value={fechaElab}
                      onChange={(e) => setFechaElab(e.target.value)}
                      className="w-full p-2 text-xs border border-[#D1E3EB] rounded-lg bg-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Custom Image Upload for Labels */}
            {selectedProduct && (
              <div className="pt-2 border-t border-[#D1E3EB]">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Imagen Personalizada JPG/PNG
                </label>
                {currentImageJpg ? (
                  <div className="flex items-center gap-2 p-2 border border-[#D1E3EB] rounded-lg bg-gray-50">
                    <img src={currentImageJpg} alt="Preview" className="w-10 h-10 object-contain rounded border" />
                    <span className="text-xs text-emerald-700 font-bold flex-1">Imagen cargada</span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-[#017E9A] hover:underline font-semibold"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 bg-[#E8F4F8] hover:bg-[#d5e8f0] text-[#0B4F6C] font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 border border-[#D1E3EB]"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Cargar Imagen JPG/PNG</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 bg-[#E8F4F8] border-t border-[#D1E3EB] flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                const textToShare = `Frizame ${printType}:\nElemento: ${activeItemName}\nCategoría: ${selectedCategory}`;
                if (navigator.share) {
                  navigator
                    .share({
                      title: `Frizame - ${activeItemName}`,
                      text: textToShare,
                    })
                    .catch(() => {});
                } else {
                  window.open(
                    `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`,
                    '_blank'
                  );
                }
              }}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-brand font-medium rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 shadow-md"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir</span>
            </button>

            <button
              onClick={handlePrintClick}
              className="flex-[2] py-3 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand font-medium rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>
                Imprimir {
                  printType === 'rotulo'
                    ? '9 Rótulos (3x3)'
                    : printType === 'sticker'
                    ? '30 Stickers (5x6)'
                    : printType === 'individual'
                    ? 'Etiqueta Individual'
                    : printType === 'a4_apaisada'
                    ? 'Página A4 Apaisada'
                    : printType === 'a4_vertical'
                    ? 'Página A4 Vertical'
                    : printType === 'legal_apaisada'
                    ? 'Página Legal Apaisada'
                    : 'Página Legal Vertical'
                }
              </span>
            </button>
          </div>
        </div>

        {/* Live Preview Container (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#E8F4F8] px-5 py-3 border-b border-[#D1E3EB] flex justify-between items-center">
            <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#017E9A]" />
              {
                printType === 'rotulo'
                  ? 'Vista Previa Hoja A4 Apaisada (Grilla 3x3 — 9 Rótulos)'
                  : printType === 'sticker'
                  ? 'Vista Previa Hoja A4 Vertical (Grilla 5x6 — 30 Stickers)'
                  : printType === 'individual'
                  ? 'Vista Previa Etiqueta Individual (1 u)'
                  : printType === 'a4_apaisada'
                  ? 'Vista Previa Hoja A4 Apaisada (Categoría Otros)'
                  : printType === 'a4_vertical'
                  ? 'Vista Previa Hoja A4 Vertical (Categoría Otros)'
                  : printType === 'legal_apaisada'
                  ? 'Vista Previa Hoja Legal Apaisada (Categoría Otros)'
                  : 'Vista Previa Hoja Legal Vertical (Categoría Otros)'
              }
            </h3>
            <span className="bg-[#017E9A] text-white font-brand text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {currentTipo}
            </span>
          </div>

          <div className="p-4 md:p-6 bg-[#607D8B]/10 flex-1 overflow-x-auto flex justify-center items-center">
            {printType === 'a4_apaisada' || printType === 'legal_apaisada' ? (
              /* Landscape Full Page Preview */
              <div className="w-[720px] h-[510px] bg-white border border-gray-300 rounded-sm shadow-2xl p-6 flex flex-col justify-between text-black font-['Inter',sans-serif]">
                <div className="border-b border-black pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="text-xl font-brand font-black uppercase text-[#0B4F6C]">{activeItemName}</h4>
                    <p className="text-xs font-semibold text-gray-600">
                      FRIZAME — CONGELADOS PREMIUM • FORMATO {printType.toUpperCase().replace('_', ' ')}
                    </p>
                  </div>
                  {qrCodeUrl && <img src={qrCodeUrl} alt="QR" className="w-12 h-12 object-contain" />}
                </div>

                <div className="flex-1 my-4 flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-xl p-4 bg-[#FAF9F5]">
                  {currentImageJpg ? (
                    <img src={currentImageJpg} alt={activeItemName} className="max-h-64 w-full object-contain" />
                  ) : (
                    <div className="text-center space-y-3">
                      <FrizameLogo variant="full" className="w-20 h-20 mx-auto" />
                      <h5 className="font-brand font-bold text-lg text-gray-800 uppercase">{activeItemName}</h5>
                    </div>
                  )}
                </div>

                <div className="border-t border-black pt-2 text-center text-xs font-bold uppercase tracking-wider text-gray-700">
                  FRIZAME — MATERIAL DE DIFUSIÓN E IMPRESIÓN OFICIAL
                </div>
              </div>
            ) : printType === 'a4_vertical' || printType === 'legal_vertical' ? (
              /* Portrait Full Page Preview */
              <div className="w-[520px] h-[730px] bg-white border border-gray-300 rounded-sm shadow-2xl p-6 flex flex-col justify-between text-black font-['Inter',sans-serif]">
                <div className="border-b border-black pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="text-xl font-brand font-black uppercase text-[#0B4F6C]">{activeItemName}</h4>
                    <p className="text-xs font-semibold text-gray-600">
                      FRIZAME — CONGELADOS PREMIUM • FORMATO {printType.toUpperCase().replace('_', ' ')}
                    </p>
                  </div>
                  {qrCodeUrl && <img src={qrCodeUrl} alt="QR" className="w-12 h-12 object-contain" />}
                </div>

                <div className="flex-1 my-4 flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-xl p-4 bg-[#FAF9F5]">
                  {currentImageJpg ? (
                    <img src={currentImageJpg} alt={activeItemName} className="max-h-80 w-full object-contain" />
                  ) : (
                    <div className="text-center space-y-3">
                      <FrizameLogo variant="full" className="w-20 h-20 mx-auto" />
                      <h5 className="font-brand font-bold text-lg text-gray-800 uppercase">{activeItemName}</h5>
                    </div>
                  )}
                </div>

                <div className="border-t border-black pt-2 text-center text-xs font-bold uppercase tracking-wider text-gray-700">
                  FRIZAME — MATERIAL DE DIFUSIÓN E IMPRESIÓN OFICIAL
                </div>
              </div>
            ) : printType === 'individual' ? (
              /* Individual Card Preview */
              <div className="w-[450px] h-[600px] bg-white border-2 border-black rounded-2xl shadow-2xl p-6 flex flex-col justify-between text-black">
                <div className="border-b border-black pb-2 flex justify-between items-center">
                  <span className="font-brand font-bold text-base text-[#0B4F6C]">FRIZAME</span>
                  <span className="text-xs font-semibold text-gray-600">ETIQUETA INDIVIDUAL</span>
                </div>

                <div className="flex-1 my-4 flex items-center justify-center overflow-hidden">
                  {currentImageJpg ? (
                    <img src={currentImageJpg} alt={activeItemName} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="text-center space-y-2">
                      <FrizameLogo variant="full" className="w-16 h-16 mx-auto" />
                      <h5 className="font-brand font-bold text-base uppercase">{activeItemName}</h5>
                    </div>
                  )}
                </div>

                <div className="bg-black text-white p-2.5 flex justify-between items-center text-xs font-bold rounded-lg">
                  <span>{peso}</span>
                  <span>Lote: {lote}</span>
                  <span>Venc: {formattedFecha}</span>
                </div>
              </div>
            ) : printType === 'rotulo' ? (
              /* Rótulo Live Preview Grid (3x3 - 9 Rótulos on A4 Landscape) */
              <div className="w-[780px] h-[520px] bg-white border border-gray-300 rounded-sm shadow-2xl p-3 grid grid-cols-3 grid-rows-3 gap-2 overflow-hidden text-black font-['Inter',sans-serif]">
                {gridCopies.map((_, idx) => (
                  <div
                    key={idx}
                    className="border border-black rounded-xs overflow-hidden flex flex-col justify-between bg-white h-full relative"
                  >
                    {selectedProduct?.rotuloImagenJpg ? (
                      /* Render Uploaded JPG image */
                      <div className="w-full h-full flex flex-col justify-between p-1">
                        <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                          <img
                            src={selectedProduct.rotuloImagenJpg}
                            alt={selectedProduct.nombre}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="bg-black text-white px-1.5 py-0.5 flex justify-between items-center text-[8px] font-bold">
                          <span>{peso}</span>
                          <span className="text-center font-bold text-white">L: {lote}</span>
                          <span>{formattedFecha}</span>
                        </div>
                      </div>
                    ) : (
                      /* Render Frizame Official Logo Label Badge */
                      <div className="w-full h-full flex flex-col justify-between">
                        {/* Header */}
                        <div className="bg-black text-white px-1.5 py-0.5 flex justify-between items-center text-[9px] font-bold">
                          <span className="font-brand">FRIZAME</span>
                          <span className="text-[6px] text-gray-200">CONGELADOS</span>
                        </div>

                        {/* Body */}
                        <div className="p-1 flex-1 flex flex-col justify-between text-[8px]">
                          <h5 className="font-brand font-bold text-[9px] uppercase line-clamp-1 border-b border-black pb-0.5">
                            {activeItemName}
                          </h5>

                          <div className="flex justify-between items-end gap-1 mt-0.5">
                            <div className="space-y-0.5 text-[8px]">
                              <div>
                                <strong>Peso:</strong> {peso}
                              </div>
                              <div>
                                <strong>Venc:</strong> {formattedFecha}
                              </div>
                              <div>
                                <strong>Lote:</strong> {lote}
                              </div>
                            </div>

                            {qrCodeUrl && <img src={qrCodeUrl} alt="QR" className="w-9 h-9 object-contain" />}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-black text-white px-1.5 py-0.5 flex justify-between items-center text-[7.5px] font-bold">
                          <span>{peso}</span>
                          <span className="text-center font-bold text-white">L: {lote}</span>
                          <span>{formattedFecha}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Sticker Live Preview Grid (5x6 - 30 Stickers on A4 Portrait) */
              <div className="w-[520px] h-[730px] bg-white border border-gray-300 rounded-sm shadow-2xl p-2.5 grid grid-cols-5 grid-rows-6 gap-1.5 overflow-hidden text-black font-['Inter',sans-serif]">
                {gridCopies.map((_, idx) => (
                  <div
                    key={idx}
                    className="border border-dashed border-gray-300 rounded-lg bg-[#FAF9F5] p-1 flex flex-col items-center justify-between text-center overflow-hidden hover:border-[#017E9A] transition-colors"
                  >
                    {selectedProduct?.stickerImagenJpg ? (
                      /* Render Uploaded Sticker JPG */
                      <img
                        src={selectedProduct.stickerImagenJpg}
                        alt={selectedProduct.nombre}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      /* Render Standard Frizame Mascot Sticker Badge */
                      <div className="w-full h-full flex flex-col items-center justify-between py-1 px-0.5">
                        <div className="w-12 h-12 flex items-center justify-center">
                          <FrizameLogo variant="full" className="w-full h-full" />
                        </div>
                        <span className="font-brand font-black text-[7.5px] uppercase leading-tight text-gray-900 tracking-tight line-clamp-2 mt-0.5">
                          {activeItemName}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
