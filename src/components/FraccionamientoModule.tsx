import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  RotateCw,
  Plus,
  Receipt,
  Settings2,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowUpDown,
  CheckCircle2,
  Package,
  Boxes,
  Scale,
  Sparkles,
  ShoppingBag,
  Pencil,
  Trash2,
  AlertTriangle,
  Layers,
  ArrowRightLeft,
  Lock,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from 'lucide-react';
import { Product } from '../types';
import { ConfirmModal } from './modals/ConfirmModal';
import { getReservedQtyForProduct } from '../utils/stockUtils';

interface FraccionamientoModuleProps {
  openNuevaRecetaModal: (productId?: number | string) => void;
  openNotaCompraModal?: () => void;
  openNuevoProductoModal?: () => void;
  onEditProduct?: (product: Product) => void;
}

type SortField = 'codigo' | 'nombre' | 'tipo' | 'stock' | 'precioComercio' | 'precioParticular';

export const FraccionamientoModule: React.FC<FraccionamientoModuleProps> = ({
  openNuevaRecetaModal,
  openNotaCompraModal,
  openNuevoProductoModal,
  onEditProduct,
}) => {
  const {
    products,
    rawMaterials,
    recipes,
    movements,
    ordersOP,
    deleteProduct,
    reactivateProduct,
    deleteRecipe,
    performFraccionamiento,
    systemConfig,
  } = useApp();

  // Search, filter, and sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | '1xx' | '2xx' | 'insumos' | 'alerta'>('all');
  const [sortField, setSortField] = useState<SortField>('codigo');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [expandedProductId, setExpandedProductId] = useState<number | string | null>(null);

  // Hidden price toggles (hidden by default on page load / refresh)
  const [showPrecioComercio, setShowPrecioComercio] = useState<boolean>(false);
  const [showPrecioParticular, setShowPrecioParticular] = useState<boolean>(false);

  // Modals for Deactivation/Deletion & Reactivation
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToReactivate, setProductToReactivate] = useState<Product | null>(null);
  const [recipeToDeleteId, setRecipeToDeleteId] = useState<number | string | null>(null);

  // Fraccionamiento state: Filter active 1XX products ONLY if they have a corresponding 2XX product
  const productos1XX = useMemo(() => {
    return products.filter((p) => {
      if (p.activo === false) return false;
      if (!p.codigo.startsWith('1') && p.tipo !== 'Gramos') return false;
      const last2Digits = p.codigo.slice(-2);
      const has2XXCounterpart = products.some(
        (p2) => p2.codigo.startsWith('2') && p2.codigo.slice(-2) === last2Digits
      );
      return has2XXCounterpart;
    });
  }, [products]);

  const [selectedOriginId, setSelectedOriginId] = useState<number | string>(
    productos1XX[0]?.id || ''
  );
  const [kgInput, setKgInput] = useState<number>(5);
  const [mermaPct, setMermaPct] = useState<number>(5);

  // Confirmation modal state for fraccionamiento execution
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Selected Origin Product 1XX
  const selectedOrigin = useMemo(
    () =>
      productos1XX.find((p) => p.id === selectedOriginId || String(p.id) === String(selectedOriginId)) ||
      productos1XX[0] ||
      products[0],
    [productos1XX, selectedOriginId, products]
  );

  // Corresponding Destination Product 2XX (e.g. Code 101 -> 201, 108 -> 208)
  const selectedDestination = useMemo(() => {
    if (!selectedOrigin) return null;

    const targetCode = selectedOrigin.codigo.startsWith('1')
      ? '2' + selectedOrigin.codigo.slice(1)
      : '';

    let match = products.find((p) => p.codigo === targetCode);

    if (!match) {
      const cleanOriginName = selectedOrigin.nombre.replace('X KG.', '').replace('X KG', '').trim();
      match = products.find(
        (p) =>
          p.codigo.startsWith('2') &&
          p.nombre.toLowerCase().includes(cleanOriginName.toLowerCase())
      );
    }

    return match || products.find((p) => p.codigo.startsWith('2')) || null;
  }, [selectedOrigin, products]);

  const destinationRecipe = useMemo(() => {
    if (!selectedDestination) return null;
    return recipes.find(
      (r) => r.productoId === selectedDestination.id || String(r.productoId) === String(selectedDestination.id)
    );
  }, [recipes, selectedDestination]);

  // Load default category mermaPct when destination product changes (editable by operator)
  React.useEffect(() => {
    if (selectedDestination) {
      const destCatName = selectedDestination.categoria || '2XX - Bandeja';
      const catObj = systemConfig?.productCategories?.find((cat: any) => {
        if (typeof cat === 'string') return cat === destCatName;
        return (
          cat.nombre === destCatName ||
          (selectedDestination.codigo?.startsWith('2') && cat.nombre?.includes('2XX'))
        );
      });
      const defaultVal =
        typeof catObj === 'object' && catObj?.mermaPct !== undefined
          ? catObj.mermaPct
          : 3.5;
      setMermaPct(defaultVal);
    }
  }, [selectedDestination?.id, systemConfig?.productCategories]);

  const gramsPerTray = selectedDestination?.grsPorBandeja || 400;
  const netGrams = Math.max(0, kgInput * 1000 * (1 - mermaPct / 100));
  const resultingTrays = gramsPerTray > 0 ? Math.floor(netGrams / gramsPerTray) : 0;

  const systemCategories = useMemo(() => {
    const raw = systemConfig?.productCategories || [
      '1XX - Granel (Kg)',
      '2XX - Bandeja',
      'Insumo',
      'Marketing',
      'Otros',
    ];
    return raw.map((c: any) => (typeof c === 'string' ? c : c.nombre));
  }, [systemConfig?.productCategories]);

  // Sort and filter product list
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (categoryFilter === 'all') return true;
        if (categoryFilter === 'alerta') {
          return (
            (p.tipo === 'Gramos' && (p.stockGranelKg || 0) <= (p.stockMinimo ?? 5)) ||
            (p.tipo === 'Bandeja' && (p.stockBandejas || 0) <= (p.stockMinimo ?? 5))
          );
        }
        if (categoryFilter === '1xx' || categoryFilter.includes('1XX') || categoryFilter.includes('Granel')) {
          const num = parseInt(p.codigo.replace(/\D/g, ''), 10);
          const rules = systemConfig?.codeValidationRules?.granel;
          if (rules && !isNaN(num)) {
            return num >= rules.min && num <= rules.max;
          }
          return p.codigo.startsWith('1') || p.tipo.includes('1XX') || p.categoria?.includes('1XX');
        }
        if (categoryFilter === '2xx' || categoryFilter.includes('2XX') || categoryFilter.includes('Bandeja')) {
          const num = parseInt(p.codigo.replace(/\D/g, ''), 10);
          const rules = systemConfig?.codeValidationRules?.bandeja;
          if (rules && !isNaN(num)) {
            return num >= rules.min && num <= rules.max;
          }
          return p.codigo.startsWith('2') || p.tipo.includes('2XX') || p.categoria?.includes('2XX');
        }
        if (categoryFilter === 'insumos' || categoryFilter.toLowerCase().includes('insumo') || categoryFilter === '4xx') {
          const num = parseInt(p.codigo.replace(/\D/g, ''), 10);
          const rules = systemConfig?.codeValidationRules?.insumos;
          if (rules && !isNaN(num)) {
            return num >= rules.min && num <= rules.max;
          }
          return p.tipo === 'Insumo' || p.categoria === 'Insumo' || p.codigo.startsWith('4');
        }
        return p.categoria === categoryFilter || p.tipo === categoryFilter;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'stock') {
          valA = a.tipo === 'Bandeja' ? a.stockBandejas || 0 : a.stockGranelKg || 0;
          valB = b.tipo === 'Bandeja' ? b.stockBandejas || 0 : b.stockGranelKg || 0;
        }

        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [products, searchTerm, categoryFilter, sortField, sortAsc]);

  // Filter raw materials for Insumos view
  const filteredInsumos = useMemo(() => {
    return rawMaterials.filter(
      (r) =>
        r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.marca.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rawMaterials, searchTerm]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrigin || kgInput <= 0) return;
    setIsConfirmOpen(true);
  };

  const handleExecuteFraccionamiento = () => {
    if (!selectedOrigin) return;
    const res = performFraccionamiento(selectedOrigin.id, kgInput, mermaPct);
    alert(res.message);
  };

  const handleDeleteProductClick = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToDelete(product);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  const handleReactivateClick = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToReactivate(product);
  };

  const handleConfirmReactivate = () => {
    if (productToReactivate) {
      reactivateProduct(productToReactivate.id);
      setProductToReactivate(null);
    }
  };

  const handleDeleteRecipeClick = (recipeId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecipeToDeleteId(recipeId);
  };

  const handleConfirmDeleteRecipe = () => {
    if (recipeToDeleteId) {
      deleteRecipe(recipeToDeleteId);
      setRecipeToDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#D1E3EB] pb-4">
        <div>
          <h2 className="font-brand font-bold text-2xl text-[#0B4F6C] flex items-center gap-2">
            <Scale className="w-7 h-7 text-[#017E9A]" />
            Productos y Fraccionamiento Operativo
          </h2>
          <p className="text-sm text-[#607D8B]">
            Gestión del catálogo de productos, composición de recetas y conversión rápida de Productos Origen (1XX) a Productos Destino (2XX).
          </p>
        </div>
      </div>

      {/* Grid Section 1: Detailed Products Summary Table */}
      <div id="sec-catalogo-productos" className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#D1E3EB] pb-3">
          <div>
            <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#017E9A]" />
              Catálogo de Productos &amp; Insumos
            </h3>
            <span className="text-xs text-gray-500">
              Tabla con ABM, ordenamiento por encabezados e historial de movimientos.
            </span>
          </div>

          {/* Search Bar & Category Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, nombre o insumo..."
                className="w-full pl-9 pr-3 py-1.5 border border-[#D1E3EB] rounded-lg text-xs md:text-sm focus:outline-none focus:border-[#017E9A]"
              />
            </div>

            <div className="flex items-center bg-[#E8F4F8] p-1 rounded-lg text-xs font-medium flex-wrap gap-1">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-[#017E9A] text-white font-semibold'
                    : 'text-[#0B4F6C] hover:bg-white/50'
                }`}
              >
                Todos ({products.length + rawMaterials.length})
              </button>

              {systemCategories.map((catName) => {
                const isActive =
                  categoryFilter === catName ||
                  (catName.includes('1XX') && categoryFilter === '1xx') ||
                  (catName.includes('2XX') && categoryFilter === '2xx') ||
                  (catName.includes('Insumo') && categoryFilter === 'insumos');

                return (
                  <button
                    key={catName}
                    onClick={() => setCategoryFilter(catName)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      isActive
                        ? 'bg-[#017E9A] text-white font-semibold'
                        : 'text-[#0B4F6C] hover:bg-white/50'
                    }`}
                  >
                    {catName}
                  </button>
                );
              })}

              <button
                onClick={() => setCategoryFilter('alerta')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  categoryFilter === 'alerta'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-amber-800 hover:bg-white/50'
                }`}
              >
                Alertas
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons Aligned Below Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F4F8FA] p-2.5 rounded-xl border border-[#D1E3EB]">
          <div className="flex flex-wrap items-center gap-2">
            {openNuevoProductoModal && (
              <button
                onClick={openNuevoProductoModal}
                className="px-3.5 py-1.5 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand font-bold rounded-lg text-xs md:text-sm transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Package className="w-4 h-4" />
                <span>Nuevo Producto</span>
              </button>
            )}

            <button
              onClick={() => {
                const element = document.getElementById('accion-fraccionamiento');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-bold rounded-lg text-xs md:text-sm transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <RotateCw className="w-4 h-4" />
              <span>Fraccionar</span>
            </button>
          </div>

          <span className="text-xs text-[#607D8B] font-medium hidden sm:inline">
            Filtro activo: <strong className="text-[#0B4F6C] uppercase">{categoryFilter}</strong> ({filteredProducts.length} productos)
          </span>
        </div>

        {/* View Switcher: Normal Products vs Raw Materials (Insumos) vs Combined "Todos" */}
        {categoryFilter === 'insumos' ? (
          /* Simplified Raw Materials Table */
          <div className="max-h-[480px] overflow-y-auto border border-[#D1E3EB] rounded-xl shadow-inner bg-white">
            <table className="w-full text-left text-xs md:text-sm border-collapse relative">
              <thead className="sticky top-0 bg-[#E8F4F8] text-[#0B4F6C] font-brand z-10 border-b border-[#D1E3EB]">
                <tr>
                  <th className="p-3 font-bold">Insumo / Materia Prima</th>
                  <th className="p-3 font-bold">Proveedor</th>
                  <th className="p-3 font-bold">Marca</th>
                  <th className="p-3 font-bold">Presentación</th>
                  <th className="p-3 font-bold">Costo Unitario ($)</th>
                  <th className="p-3 text-center font-bold">Estado / Reposición</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E3EB]">
                {filteredInsumos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">
                      No se encontraron insumos coincidentes.
                    </td>
                  </tr>
                ) : (
                  filteredInsumos.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F4F8FA] transition-colors">
                      <td className="p-3 font-semibold text-gray-800 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#017E9A]" />
                        <span>{r.nombre}</span>
                      </td>
                      <td className="p-3">
                        <span className="bg-[#E8F4F8] text-[#0B4F6C] px-2 py-0.5 rounded text-xs font-semibold">
                          {r.proveedor}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{r.marca || 'Genérica'}</td>
                      <td className="p-3 text-gray-600">{r.presentacion}</td>
                      <td className="p-3 font-bold text-emerald-700">
                        ${r.costo.toLocaleString('es-AR')}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={openNotaCompraModal}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-md font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                          title="Generar Nota de Compra"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                          <span>Pedir a Proveedor</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Products Table */
          <div className="space-y-6">
            <div className="max-h-[520px] overflow-y-auto border border-[#D1E3EB] rounded-xl shadow-inner bg-white">
              <table className="w-full text-left text-xs md:text-sm border-collapse relative">
                <thead className="sticky top-0 bg-[#E8F4F8] text-[#0B4F6C] font-brand z-10 border-b border-[#D1E3EB]">
                  <tr>
                    <th
                      onClick={() => toggleSort('codigo')}
                      className="p-3 cursor-pointer hover:bg-[#d8ecf3] transition-colors select-none"
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <span>Código</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('nombre')}
                      className="p-3 cursor-pointer hover:bg-[#d8ecf3] transition-colors select-none"
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <span>Producto / Descripción</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('tipo')}
                      className="p-3 cursor-pointer hover:bg-[#d8ecf3] transition-colors select-none"
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <span>Presentación</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('stock')}
                      className="p-3 cursor-pointer hover:bg-[#d8ecf3] transition-colors select-none"
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <span>Stock Actual</span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                      </div>
                    </th>
                    <th className="p-3 font-bold select-none">
                      <div className="flex items-center justify-between gap-1">
                        <div
                          onClick={() => toggleSort('precioComercio')}
                          className="flex items-center gap-1 cursor-pointer hover:text-[#017E9A]"
                        >
                          <span>P. Comercio</span>
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPrecioComercio(!showPrecioComercio);
                          }}
                          className="p-1 text-[#017E9A] hover:bg-white/60 rounded transition-colors"
                          title={showPrecioComercio ? "Ocultar Precio Comercio" : "Mostrar Precio Comercio"}
                        >
                          {showPrecioComercio ? <Eye className="w-4 h-4 text-[#017E9A]" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                        </button>
                      </div>
                    </th>
                    <th className="p-3 font-bold select-none">
                      <div className="flex items-center justify-between gap-1">
                        <div
                          onClick={() => toggleSort('precioParticular')}
                          className="flex items-center gap-1 cursor-pointer hover:text-[#017E9A]"
                        >
                          <span>P. Particular</span>
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPrecioParticular(!showPrecioParticular);
                          }}
                          className="p-1 text-[#017E9A] hover:bg-white/60 rounded transition-colors"
                          title={showPrecioParticular ? "Ocultar Precio Particular" : "Mostrar Precio Particular"}
                        >
                          {showPrecioParticular ? <Eye className="w-4 h-4 text-[#017E9A]" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                        </button>
                      </div>
                    </th>
                    <th className="p-3 text-center font-bold">Acciones / Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E3EB]">
                  {filteredProducts.length === 0 && (categoryFilter !== 'all' || filteredInsumos.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-500">
                        No se encontraron productos coincidentes.
                      </td>
                    </tr>
                  ) : (
                    <>
                    {filteredProducts.map((p) => {
                      const isExpanded = expandedProductId === p.id;
                      const is1XX = p.codigo.startsWith('1');
                      const isInactive = p.activo === false;
                      const currentStock = p.tipo === 'Bandeja' ? p.stockBandejas || 0 : p.stockGranelKg || 0;
                      const stockUnit = p.tipo === 'Bandeja' ? 'bandejas' : 'Kg';
                      const reservedQty = getReservedQtyForProduct(p, ordersOP);
                      const isLowStock = currentStock <= 5;

                      const recipeMatch = recipes.find(
                        (r) => r.productoId === p.id || String(r.productoId) === String(p.id)
                      );

                      // Filter movements associated with this product for drawer detail
                      const productMovements = movements.filter(
                        (m) =>
                          m.item.toLowerCase().includes(p.nombre.toLowerCase()) ||
                          m.item.includes(p.codigo)
                      );

                      return (
                        <React.Fragment key={p.id}>
                          <tr
                            onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                            className={`cursor-pointer transition-colors ${
                              isInactive
                                ? 'bg-red-50/70 hover:bg-red-100/60 text-red-900 border-l-4 border-l-red-500'
                                : isExpanded
                                ? 'bg-[#E8F4F8]'
                                : 'hover:bg-[#F4F8FA]'
                            }`}
                          >
                            <td className="p-3 font-mono font-bold">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    isInactive
                                      ? 'bg-red-200 text-red-800'
                                      : is1XX
                                      ? 'bg-sky-100 text-[#0B4F6C]'
                                      : 'bg-teal-100 text-[#017E9A]'
                                  }`}
                                >
                                  [{p.codigo}]
                                </span>
                                {isInactive && (
                                  <span className="px-1.5 py-0.5 bg-red-600 text-white font-bold rounded text-[10px] uppercase inline-flex items-center gap-0.5">
                                    <AlertCircle className="w-3 h-3" /> Inactivo
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={`p-3 font-semibold ${isInactive ? 'text-red-800 line-through' : 'text-gray-800'}`}>
                              {p.nombre}
                            </td>
                            <td className="p-3 text-xs text-gray-600">
                              {p.presentacionTexto
                                ? p.presentacionTexto
                                : p.tipo === 'Bandeja'
                                ? `Bandeja (${p.grsPorBandeja || p.pesoGrs} grs)`
                                : `Granel (x Kg)`}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1 ${
                                    isInactive
                                      ? 'bg-red-100 text-red-800 border border-red-300'
                                      : isLowStock
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-emerald-50 text-emerald-800'
                                  }`}
                                >
                                  {!isInactive && isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                                  {currentStock}
                                  {reservedQty > 0 && (
                                    <span
                                      className="ml-1 text-amber-900 bg-amber-200 border border-amber-400 font-extrabold px-1.5 py-0.5 rounded text-[11px]"
                                      title={`${reservedQty} ${stockUnit} reservados en Preventa (RESERVA)`}
                                    >
                                      (-{reservedQty}*)
                                    </span>
                                  )}{' '}
                                  {stockUnit}
                                </span>

                                {!isInactive && isLowStock && openNotaCompraModal && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openNotaCompraModal();
                                    }}
                                    className="p-1 text-amber-700 bg-amber-50 hover:bg-amber-200 border border-amber-300 rounded transition-colors"
                                    title="Reponer: Generar Nota de Compra"
                                  >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-3 font-bold text-[#0B4F6C]">
                              {showPrecioComercio ? `$${(p.precioComercio || 0).toLocaleString('es-AR')}` : '••••••'}
                            </td>
                            <td className="p-3 font-bold text-[#017E9A]">
                              {showPrecioParticular ? `$${(p.precioParticular || 0).toLocaleString('es-AR')}` : '••••••'}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {onEditProduct && !isInactive && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditProduct(p);
                                    }}
                                    className="p-1 text-gray-600 hover:text-[#017E9A] hover:bg-white rounded transition-colors"
                                    title="Editar Producto"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}

                                {isInactive ? (
                                  <button
                                    onClick={(e) => handleReactivateClick(p, e)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs inline-flex items-center gap-1 transition-colors shadow-xs"
                                    title="Reactivar Producto Bloqueado"
                                  >
                                    <RotateCw className="w-3.5 h-3.5" />
                                    <span>Reactivar</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => handleDeleteProductClick(p, e)}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                    title="Inactivar / Eliminar Producto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedProductId(isExpanded ? null : p.id);
                                  }}
                                  className="p-1 rounded-lg text-[#017E9A] hover:bg-[#D1E3EB] transition-colors"
                                  title="Ver Detalle de Receta / Historial"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Detailed Recipe / Composition & Movement History Drawer */}
                          {isExpanded && (
                            <tr className="bg-[#F8FCFD]">
                              <td colSpan={7} className="p-4 border-b border-[#D1E3EB]">
                                <div className="bg-white p-4 rounded-xl border border-[#D1E3EB] shadow-xs space-y-4">
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-200 pb-2">
                                    <div>
                                      <h4 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2">
                                        <span>[{p.codigo}] {p.nombre}</span>
                                        {isInactive && (
                                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                                            INACTIVO
                                          </span>
                                        )}
                                      </h4>
                                      <span className="text-xs text-gray-500">
                                        Categoría: {p.tipo} • Conservación: {p.conservacion || '-18°C (Freezer)'}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {!isInactive && (
                                        <button
                                          onClick={() => openNuevaRecetaModal(p.id)}
                                          className="px-3 py-1.5 bg-[#017E9A] hover:bg-[#016278] text-white font-brand text-xs rounded-lg transition-colors flex items-center gap-1 font-semibold"
                                        >
                                          <Receipt className="w-3.5 h-3.5" />
                                          <span>{recipeMatch ? 'Editar Receta' : '+ Crear Receta'}</span>
                                        </button>
                                      )}

                                      {is1XX && !isInactive && (
                                        <button
                                          onClick={() => {
                                            setSelectedOriginId(p.id);
                                            const element = document.getElementById('accion-fraccionamiento');
                                            element?.scrollIntoView({ behavior: 'smooth' });
                                          }}
                                          className="px-3 py-1.5 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand text-xs rounded-lg transition-colors flex items-center gap-1 font-semibold"
                                        >
                                          <RotateCw className="w-3.5 h-3.5" />
                                          <span>Fraccionar este Producto Origen</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    {/* Left Box: Ingredients & Allergens */}
                                    <div className="space-y-2">
                                      <div>
                                        <strong className="text-gray-700 block mb-1">Ingredientes de la Etiqueta:</strong>
                                        <p className="text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                                          {p.ingredientes || 'Sin especificar.'}
                                        </p>
                                      </div>
                                      <div>
                                        <strong className="text-gray-700 block mb-1">Declaración de Alérgenos:</strong>
                                        <p className="text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-semibold">
                                          {p.alergenos || 'Sin especificar.'}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Right Box: Detailed Recipe Table (without cost) */}
                                    <div className="bg-[#E8F4F8]/50 p-3 rounded-xl border border-[#D1E3EB] space-y-2">
                                      <div className="flex justify-between items-center">
                                        <h5 className="font-brand font-bold text-[#0B4F6C] flex items-center gap-1.5">
                                          <Receipt className="w-4 h-4 text-[#017E9A]" />
                                          Composición / Fórmula Desglosada de Insumos
                                        </h5>
                                        {recipeMatch && !isInactive && (
                                          <button
                                            onClick={(e) => handleDeleteRecipeClick(recipeMatch.id, e)}
                                            className="text-red-500 hover:text-red-700 text-xs font-semibold underline flex items-center gap-0.5"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" /> Quitar Receta
                                          </button>
                                        )}
                                      </div>

                                      {recipeMatch && recipeMatch.insumos && recipeMatch.insumos.length > 0 ? (
                                        <table className="w-full text-left text-xs bg-white rounded-lg border border-[#D1E3EB] overflow-hidden">
                                          <thead className="bg-[#E8F4F8] text-[#0B4F6C] font-semibold">
                                            <tr>
                                              <th className="p-2">Componente / Insumo</th>
                                              <th className="p-2 text-right">Proporción</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-[#D1E3EB]">
                                            {recipeMatch.insumos.map((i, idx) => (
                                              <tr key={idx}>
                                                <td className="p-2 font-medium text-gray-800">{i.insumoNombre}</td>
                                                <td className="p-2 text-right font-bold text-[#0B4F6C]">
                                                  {i.gramosOCantidad} {i.unidad || 'grs'}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <div className="p-3 bg-white rounded-lg border border-[#D1E3EB] text-gray-500 italic space-y-1">
                                          <p>
                                            {is1XX
                                              ? 'Producto a Granel base para conversión 1XX ➔ 2XX.'
                                              : 'Sin receta asignada aún.'}
                                          </p>
                                          {!isInactive && (
                                            <button
                                              onClick={() => openNuevaRecetaModal(p.id)}
                                              className="mt-2 px-3 py-1 bg-[#017E9A] text-white rounded text-xs font-semibold not-italic"
                                            >
                                              + Crear Receta para {p.nombre}
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Materiales Imprimibles Cargados (Rótulo / Sticker) */}
                                  {(p.rotuloImagenJpg || p.stickerImagenJpg) && (
                                    <div className="pt-3 border-t border-gray-200 space-y-2">
                                      <h5 className="font-brand font-bold text-[#0B4F6C] text-xs flex items-center gap-1.5">
                                        <ImageIcon className="w-4 h-4 text-[#017E9A]" />
                                        Materiales Imprimibles Cargados (Rótulo / Sticker)
                                      </h5>
                                      <div className="flex flex-wrap gap-4 items-center bg-[#F4F8FA] p-3 rounded-xl border border-[#D1E3EB]">
                                        {p.rotuloImagenJpg && (
                                          <div className="space-y-1">
                                            <span className="text-[11px] font-bold text-gray-600 block">Imagen Rótulo (A4):</span>
                                            <img
                                              src={p.rotuloImagenJpg}
                                              alt={`Rótulo ${p.nombre}`}
                                              className="h-28 max-w-[180px] object-contain rounded-lg border border-[#D1E3EB] bg-white shadow-2xs"
                                            />
                                          </div>
                                        )}
                                        {p.stickerImagenJpg && (
                                          <div className="space-y-1">
                                            <span className="text-[11px] font-bold text-gray-600 block">Imagen Sticker:</span>
                                            <img
                                              src={p.stickerImagenJpg}
                                              alt={`Sticker ${p.nombre}`}
                                              className="h-28 max-w-[180px] object-contain rounded-lg border border-[#D1E3EB] bg-white shadow-2xs"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Historial de Movimientos del Producto */}
                                  <div className="pt-3 border-t border-gray-200 space-y-2">
                                    <h5 className="font-brand font-bold text-[#0B4F6C] text-xs flex items-center gap-1.5">
                                      <ArrowRightLeft className="w-4 h-4 text-[#017E9A]" />
                                      Historial de Movimientos (Entradas, Salidas y Fraccionamientos)
                                    </h5>
                                    {productMovements.length === 0 ? (
                                      <p className="text-xs text-gray-500 italic bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                                        No existen movimientos registrados aún para este producto.
                                      </p>
                                    ) : (
                                      <div className="max-h-40 overflow-y-auto border border-[#D1E3EB] rounded-lg bg-white shadow-inner">
                                        <table className="w-full text-left text-xs border-collapse">
                                          <thead className="bg-[#E8F4F8] text-[#0B4F6C] font-semibold sticky top-0 border-b border-[#D1E3EB]">
                                            <tr>
                                              <th className="p-2">Fecha</th>
                                              <th className="p-2">Tipo de Operación</th>
                                              <th className="p-2">Cantidad</th>
                                              <th className="p-2">Detalle / Cliente / Orig.</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-[#D1E3EB]">
                                            {productMovements.map((m) => (
                                              <tr key={m.id} className="hover:bg-gray-50">
                                                <td className="p-2 text-gray-600 font-mono">{m.fecha}</td>
                                                <td className="p-2">
                                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                                    m.tipo.includes('Entrada')
                                                      ? 'bg-emerald-100 text-emerald-800'
                                                      : m.tipo.includes('Salida')
                                                      ? 'bg-sky-100 text-[#0B4F6C]'
                                                      : 'bg-amber-100 text-amber-800'
                                                  }`}>
                                                    {m.tipo}
                                                  </span>
                                                </td>
                                                <td className="p-2 font-bold text-gray-800">{m.cantidad}</td>
                                                <td className="p-2 text-gray-600">{m.clienteProveedor || '-'}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                    }
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footnote Legend for Reserved Stock */}
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-bold flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong>* Cantidad Reservada:</strong> Indica la cantidad de producto retenida por Órdenes de Pedido en estado <strong>RESERVA</strong>.</span>
              </span>
            </div>

            {/* Insumos section when "Todos" or "Insumos" filter is active */}
            {(categoryFilter === 'all' || categoryFilter.toLowerCase().includes('insumo') || categoryFilter === '4xx') && (
              <div className="pt-4 border-t border-[#D1E3EB] space-y-3">
                <h4 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#017E9A]" />
                  Insumos y Materias Primas ({filteredInsumos.length})
                </h4>
                <div className="max-h-56 overflow-y-auto border border-[#D1E3EB] rounded-xl bg-white shadow-inner">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#E8F4F8] text-[#0B4F6C] font-semibold sticky top-0 border-b border-[#D1E3EB]">
                      <tr>
                        <th className="p-2.5 font-bold">Insumo / Materia Prima</th>
                        <th className="p-2.5 font-bold">Proveedor</th>
                        <th className="p-2.5 font-bold">Presentación</th>
                        <th className="p-2.5 font-bold text-right">Cantidad en Stock</th>
                        <th className="p-2.5 text-center font-bold">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D1E3EB]">
                      {filteredInsumos.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-gray-500">
                            No hay insumos para mostrar.
                          </td>
                        </tr>
                      ) : (
                        filteredInsumos.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="p-2.5 font-semibold text-gray-800">{r.nombre}</td>
                            <td className="p-2.5 text-gray-600">{r.proveedor}</td>
                            <td className="p-2.5 text-gray-600">{r.presentacion}</td>
                            <td className="p-2.5 text-right font-bold text-[#0B4F6C]">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200">
                                {r.stockActual !== undefined ? r.stockActual : 100} u.
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              {openNotaCompraModal && (
                                <button
                                  onClick={openNotaCompraModal}
                                  className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded font-semibold text-[11px] inline-flex items-center gap-1"
                                >
                                  <ShoppingBag className="w-3 h-3" /> Pedir
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid Section 2: Fraccionamiento Operativo Form (Acción Rápida) */}
      <div id="sec-fraccionamiento" className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden scroll-mt-6">
        <div className="bg-[#E8F4F8] px-5 py-3.5 border-b border-[#D1E3EB] flex justify-between items-center">
          <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-[#017E9A]" />
            Registrar Fraccionamiento Operativo (1XX ➔ 2XX)
          </h3>
          <span className="bg-[#017E9A] text-white font-brand text-xs px-2.5 py-0.5 rounded-full font-semibold">
            Conversión de Granel a Bandeja
          </span>
        </div>

        <form onSubmit={handleOpenConfirm} className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0B4F6C] mb-1.5">
                Producto Origen (Granel 1XX)
              </label>
              <select
                value={selectedOriginId}
                onChange={(e) => setSelectedOriginId(e.target.value)}
                className="w-full p-2.5 border border-[#D1E3EB] rounded-lg text-xs md:text-sm bg-white font-semibold text-gray-800 focus:outline-none focus:border-[#017E9A]"
              >
                {productos1XX.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.codigo}] {p.nombre} (Stock: {p.stockGranelKg || 0} Kg)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B4F6C] mb-1.5">
                Kilos a Fraccionar (Kg)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={kgInput}
                onChange={(e) => setKgInput(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg text-xs md:text-sm font-bold text-[#0B4F6C] focus:outline-none focus:border-[#017E9A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B4F6C] mb-1.5 flex items-center justify-between">
                <span>% Merma Operativa</span>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-normal">
                  Editable por Operador
                </span>
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={mermaPct}
                onChange={(e) => setMermaPct(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg text-xs md:text-sm font-bold text-amber-800 focus:outline-none focus:border-[#017E9A] bg-amber-50/40"
              />
            </div>
          </div>

          {/* Resulting Output Box & Stock Deductions Breakdown */}
          <div className="bg-[#E8F4F8]/80 p-4.5 rounded-xl border border-[#D1E3EB] space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#D1E3EB] pb-3">
              <div>
                <span className="text-xs text-gray-600 block">Producto Destino Estimado:</span>
                <strong className="text-[#0B4F6C] text-sm md:text-base font-bold block">
                  {selectedDestination ? `[${selectedDestination.codigo}] ${selectedDestination.nombre}` : 'Sin destino equivalente'}
                </strong>
                <small className="text-gray-500 text-xs">
                  {gramsPerTray} grs/bandeja • Rendimiento Neto: {netGrams / 1000} Kg ({mermaPct}% merma)
                </small>
              </div>

              <div className="text-right">
                <span className="text-xs text-gray-600 block">Bandejas Resultantes:</span>
                <h4 className="font-brand font-bold text-2xl text-emerald-700">
                  +{resultingTrays} Bandejas
                </h4>
              </div>
            </div>

            {/* Detailed Breakdown of Stock Deductions */}
            <div className="bg-white p-3 rounded-lg border border-[#D1E3EB] space-y-2 text-xs">
              <strong className="text-[#0B4F6C] font-bold block flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-[#017E9A]" />
                Desglose Detallado de Bajas de Stock a Procesar:
              </strong>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-red-700 font-semibold block text-[11px]">Granel 1XX (Materia Prima):</span>
                  <strong className="text-red-900 text-sm font-bold">-{kgInput} Kg</strong>
                  <span className="text-[10px] text-gray-500 block truncate">
                    {selectedOrigin ? selectedOrigin.nombre : 'Origen'}
                  </span>
                </div>

                {destinationRecipe?.insumos && destinationRecipe.insumos.length > 0 ? (
                  destinationRecipe.insumos.map((item, idx) => {
                    const rm = rawMaterials.find(
                      (m) =>
                        m.id === item.insumoId ||
                        String(m.id) === String(item.insumoId) ||
                        m.nombre.toLowerCase().includes(item.insumoNombre.toLowerCase())
                    );
                    const reqQty = Number((item.gramosOCantidad * resultingTrays).toFixed(2));
                    const currentStock = rm?.stockActual !== undefined ? rm.stockActual : 'N/D';

                    return (
                      <div key={idx} className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                        <span className="text-amber-800 font-semibold block text-[11px] truncate">
                          {item.insumoNombre}:
                        </span>
                        <strong className="text-amber-950 text-sm font-bold">
                          -{reqQty} {item.unidad || 'u.'}
                        </strong>
                        <span className="text-[10px] text-gray-500 block truncate">
                          Stock inv: {currentStock} {rm?.unidadMedida || item.unidad || ''}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                      <span className="text-amber-800 font-semibold block text-[11px]">Bandeja Plástica Vacía:</span>
                      <strong className="text-amber-950 text-sm font-bold">-{resultingTrays} u.</strong>
                      <span className="text-[10px] text-gray-500 block">Envase Estándar</span>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                      <span className="text-amber-800 font-semibold block text-[11px]">Film Termosellable:</span>
                      <strong className="text-amber-950 text-sm font-bold">-{resultingTrays} u.</strong>
                      <span className="text-[10px] text-gray-500 block">Sellado de Bandejas</span>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                      <span className="text-amber-800 font-semibold block text-[11px]">Rótulo Autoadhesivo:</span>
                      <strong className="text-amber-950 text-sm font-bold">-{resultingTrays} u.</strong>
                      <span className="text-[10px] text-gray-500 block">Etiquetado</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!selectedOrigin || kgInput <= 0}
              className="px-6 py-2.5 bg-[#017E9A] hover:bg-[#016278] disabled:bg-gray-300 text-white font-brand font-bold rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
              <RotateCw className="w-4 h-4" />
              <span>Ejecutar Fraccionamiento</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal for Fraccionamiento Execution */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteFraccionamiento}
        title="Confirmar Fraccionamiento Operativo"
        message={`¿Está seguro de descontar ${kgInput} Kg de [${selectedOrigin?.codigo}] ${selectedOrigin?.nombre} e ingresar +${resultingTrays} bandejas a [${selectedDestination?.codigo}] ${selectedDestination?.nombre}?`}
        confirmText="Confirmar Operación"
      />

      {/* Confirmation Modal for Delete / Soft Delete (Inactivación) */}
      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación / Inactivación de Producto"
        message={`¿Está seguro de procesar el producto [${productToDelete?.codigo}] ${productToDelete?.nombre}? Si el producto posee historial de movimientos asociados, no se eliminará físicamente sino que pasará a estado INACTIVO (bloqueado para operaciones).`}
        confirmText="Confirmar"
      />

      {/* Confirmation Modal for Reactivation */}
      <ConfirmModal
        isOpen={!!productToReactivate}
        onClose={() => setProductToReactivate(null)}
        onConfirm={handleConfirmReactivate}
        title="Confirmar Reactivación de Producto"
        message={`¿Desea reactivar el producto [${productToReactivate?.codigo}] ${productToReactivate?.nombre}? Volverá a estar habilitado para todas las operaciones en el sistema.`}
        confirmText="Reactivar Producto"
      />

      {/* Confirmation Modal for Recipe Deletion */}
      <ConfirmModal
        isOpen={!!recipeToDeleteId}
        onClose={() => setRecipeToDeleteId(null)}
        onConfirm={handleConfirmDeleteRecipe}
        title="Eliminar Receta de Producto"
        message="¿Está seguro de eliminar la composición / fórmula de receta de este producto? Esta acción borrará la lista de insumos de la receta."
        confirmText="Sí, Eliminar Receta"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};
