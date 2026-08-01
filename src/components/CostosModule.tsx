import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calculator,
  Plus,
  FolderOpen,
  Truck,
  Scale,
  Trash2,
  ShoppingBag,
  Building2,
  DollarSign,
  FileText,
  CreditCard,
  Edit2,
  Check,
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowUpDown,
  Eye,
  EyeOff,
  Pencil,
  Receipt,
  MessageCircle,
  RotateCcw,
  X,
} from 'lucide-react';
import { ConfirmModal } from './modals/ConfirmModal';
import { NuevoInsumoModal } from './modals/NuevoInsumoModal';
import { NuevoProveedorModal } from './modals/NuevoProveedorModal';
import { RegistrarPagoProveedorModal } from './modals/RegistrarPagoProveedorModal';
import { RawMaterial, Supplier } from '../types';

interface CostosModuleProps {
  openNuevoInsumoModal: () => void;
  openNotaCompraModal?: () => void;
  defaultSubTab?: 'INSUMOS' | 'PROVEEDORES';
}

type InsumoSortField = 'nombre' | 'proveedor' | 'categoria' | 'costo' | 'fechaUltimaActualizacionCosto';
type SupplierSortField = 'nombre' | 'rubro' | 'telefono' | 'saldo';

export const CostosModule: React.FC<CostosModuleProps> = ({
  openNuevoInsumoModal,
  openNotaCompraModal,
  defaultSubTab = 'INSUMOS',
}) => {
  const {
    products,
    rawMaterials,
    suppliers,
    recipes,
    movements,
    systemConfig,
    updateRawMaterialCosto,
    updateRawMaterial,
    deleteRawMaterial,
    reactivateRawMaterial,
    updateProduct,
    deleteSupplier,
    editSupplierTransaction,
    cancelSupplierTransaction,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'INSUMOS' | 'PROVEEDORES'>(defaultSubTab);

  React.useEffect(() => {
    if (defaultSubTab) {
      setActiveTab(defaultSubTab);
    }
  }, [defaultSubTab]);

  // Insumos Sorting & Accordion State
  const [insumoSearch, setInsumoSearch] = useState('');
  const [sortField, setSortField] = useState<InsumoSortField>('nombre');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [expandedInsumoId, setExpandedInsumoId] = useState<number | string | null>(null);

  const [insumoToDelete, setInsumoToDelete] = useState<RawMaterial | null>(null);
  const [insumoToEdit, setInsumoToEdit] = useState<RawMaterial | null>(null);

  // Insumo Cost Confirmation State
  const [costToConfirm, setCostToConfirm] = useState<{ insumo: RawMaterial; oldCost: number; newCost: number } | null>(null);
  const [editingCosts, setEditingCosts] = useState<Record<string | number, string>>({});

  // Supplier Tab State
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [supplierSortField, setSupplierSortField] = useState<SupplierSortField>('nombre');
  const [supplierSortAsc, setSupplierSortAsc] = useState<boolean>(true);
  const [showSupplierBalances, setShowSupplierBalances] = useState<boolean>(false);

  const [selectedSupplierId, setSelectedSupplierId] = useState<string | number>(
    suppliers[0]?.id || ''
  );
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [isNuevoProveedorOpen, setIsNuevoProveedorOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null);

  // Transaction View/Edit/Cancel state
  const [txToView, setTxToView] = useState<any | null>(null);
  const [txToEdit, setTxToEdit] = useState<{ id: string; fecha: string; concepto: string; debe: number; haber: number } | null>(null);
  const [txToCancel, setTxToCancel] = useState<{ id: string; concepto: string } | null>(null);

  // Selected Product for Cost Breakdown
  const [selectedProductId, setSelectedProductId] = useState<number | string>(
    products[0]?.id || ''
  );
  // Selected Product
  const selectedProduct =
    products.find(
      (p) => p.id === selectedProductId || String(p.id) === String(selectedProductId)
    ) || products[0];

  // Category Merma (Read-Only from systemConfig)
  const categoryMermaObj = useMemo(() => {
    if (!selectedProduct) return null;
    const catName = selectedProduct.categoria || '';
    return systemConfig?.productCategories?.find((cat: any) => {
      if (typeof cat === 'string') return cat === catName;
      return (
        cat.nombre === catName ||
        (selectedProduct.codigo?.startsWith('2') && cat.nombre?.includes('2XX')) ||
        (selectedProduct.codigo?.startsWith('1') && cat.nombre?.includes('1XX'))
      );
    });
  }, [selectedProduct, systemConfig?.productCategories]);

  const mermaPct = useMemo(() => {
    if (typeof categoryMermaObj === 'object' && categoryMermaObj?.mermaPct !== undefined) {
      return categoryMermaObj.mermaPct;
    }
    if (selectedProduct?.codigo?.startsWith('2') || selectedProduct?.tipo === 'Bandeja') return 3.5;
    if (selectedProduct?.codigo?.startsWith('1') || selectedProduct?.tipo === 'Gramos') return 2.0;
    return systemConfig?.mermaDefaultPct ?? 3.5;
  }, [categoryMermaObj, selectedProduct, systemConfig?.mermaDefaultPct]);

  const [overheads, setOverheads] = useState<Record<string, number>>({
    'Transporte y Flete': 0,
    'Mano de Obra Directa': 0,
  });

  const [customPriceComercio, setCustomPriceComercio] = useState<number>(
    selectedProduct?.precioComercio || 0
  );
  const [customPriceParticular, setCustomPriceParticular] = useState<number>(
    selectedProduct?.precioParticular || 0
  );
  const [isConfirmPriceModalOpen, setIsConfirmPriceModalOpen] = useState(false);
  const [priceSavedMsg, setPriceSavedMsg] = useState(false);

  React.useEffect(() => {
    if (selectedProduct) {
      setCustomPriceComercio(selectedProduct.precioComercio || 0);
      setCustomPriceParticular(selectedProduct.precioParticular || 0);
    }
  }, [selectedProductId, selectedProduct]);

  // Insumos filter and sort
  const filteredInsumos = useMemo(() => {
    return rawMaterials
      .filter((r) => {
        const matchesSearch =
          r.nombre.toLowerCase().includes(insumoSearch.toLowerCase()) ||
          r.proveedor.toLowerCase().includes(insumoSearch.toLowerCase()) ||
          r.marca.toLowerCase().includes(insumoSearch.toLowerCase()) ||
          (r.categoria || '').toLowerCase().includes(insumoSearch.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => {
        let valA: any = a[sortField] || '';
        let valB: any = b[sortField] || '';

        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [rawMaterials, insumoSearch, sortField, sortAsc]);

  const toggleSort = (field: InsumoSortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Supplier filter and sort
  const filteredSuppliers = useMemo(() => {
    return suppliers
      .filter(
        (s) =>
          s.nombre.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
          (s.rubro || '').toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
          (s.cuit || '').includes(supplierSearchTerm)
      )
      .sort((a, b) => {
        let valA: any = a[supplierSortField] || '';
        let valB: any = b[supplierSortField] || '';

        if (typeof valA === 'string') {
          return supplierSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return supplierSortAsc ? valA - valB : valB - valA;
      });
  }, [suppliers, supplierSearchTerm, supplierSortField, supplierSortAsc]);

  const toggleSupplierSort = (field: SupplierSortField) => {
    if (supplierSortField === field) {
      setSupplierSortAsc(!supplierSortAsc);
    } else {
      setSupplierSortField(field);
      setSupplierSortAsc(true);
    }
  };

  const [insumoNoticeMessage, setInsumoNoticeMessage] = useState<string | null>(null);

  const handleDeleteInsumoConfirm = () => {
    if (insumoToDelete) {
      const targetMat = insumoToDelete;
      const hasRecipes = recipes.some((r) =>
        r.insumos?.some(
          (item) =>
            item.insumoId === targetMat.id ||
            String(item.insumoId) === String(targetMat.id) ||
            item.insumoNombre.toLowerCase() === targetMat.nombre.toLowerCase()
        )
      );
      const hasMovements = movements.some((m) =>
        m.item.toLowerCase().includes(targetMat.nombre.toLowerCase())
      );

      deleteRawMaterial(targetMat.id);
      setInsumoToDelete(null);

      if (hasRecipes || hasMovements) {
        setInsumoNoticeMessage(
          `El insumo "${targetMat.nombre}" posee vinculación con recetas de producción o registros históricos de movimientos. Para no afectar la trazabilidad ni los costos de recetas existentes, no se eliminó físicamente sino que se pasó a estado Inactivo (Baja Lógica).`
        );
      }
    }
  };

  const handleDeleteSupplierConfirm = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete.id);
      setSupplierToDelete(null);
    }
  };

  // Recipe items detailed breakdown helper for Point 9
  const recipeItemsDetailed = useMemo(() => {
    if (!selectedProduct) return [];

    const foundRecipe = recipes.find(
      (r) => r.productoId === selectedProduct.id || String(r.productoId) === String(selectedProduct.id)
    );

    if (foundRecipe && foundRecipe.insumos && foundRecipe.insumos.length > 0) {
      return foundRecipe.insumos.map((i) => {
        const rm = rawMaterials.find(
          (r) => r.id === i.insumoId || r.nombre.toLowerCase() === i.insumoNombre.toLowerCase()
        );
        const bulkProd = products.find(
          (p) => p.id === i.insumoId || p.nombre.toLowerCase() === i.insumoNombre.toLowerCase()
        );

        let costPerUnit = 0;
        if (rm) {
          costPerUnit = rm.costoUnidad || rm.costo || 0;
        } else if (bulkProd) {
          costPerUnit = (bulkProd.costo || 0) / 1000;
        } else {
          costPerUnit = 12;
        }

        const qty = i.gramosOCantidad;
        const subtotal = qty * costPerUnit;

        return {
          nombre: i.insumoNombre,
          cantidad: qty,
          unidad: i.unidad || 'grs',
          costoUnitario: costPerUnit,
          subtotal,
        };
      });
    }

    if (selectedProduct.receta && selectedProduct.receta.length > 0) {
      return selectedProduct.receta.map((i) => {
        const rm = rawMaterials.find((r) => r.nombre.toLowerCase() === i.ingrediente.toLowerCase());
        const costPerUnit = rm ? rm.costo : 1500;
        const qtyKg = i.unidad === 'g' || i.unidad === 'gr' ? i.cantidad / 1000 : i.cantidad;
        const subtotal = qtyKg * costPerUnit;
        return {
          nombre: i.ingrediente,
          cantidad: i.cantidad,
          unidad: i.unidad,
          costoUnitario: costPerUnit,
          subtotal,
        };
      });
    }

    // Default composition for Tray products (2XX)
    if (selectedProduct.codigo.startsWith('2') || selectedProduct.tipo === 'Bandeja') {
      const matchingBulkCode = '1' + selectedProduct.codigo.substring(1);
      const bulkProd = products.find((p) => p.codigo === matchingBulkCode) || products.find((p) => p.codigo.startsWith('1'));
      const gramsNeeded = selectedProduct.grsPorBandeja || selectedProduct.pesoGrs || 400;
      const bulkGramCost = bulkProd ? (bulkProd.costo || 11120) / 1000 : 11.12;

      const bolsaInsumo = rawMaterials.find((r) => r.nombre.toLowerCase().includes('bolsa')) || { costo: 120 };
      const rotuloInsumo = rawMaterials.find((r) => r.nombre.toLowerCase().includes('rótulo') || r.nombre.toLowerCase().includes('rotulo')) || { costo: 80 };

      const subtotalBulk = gramsNeeded * bulkGramCost;
      const subtotalBolsa = 1 * (bolsaInsumo.costo || 120);
      const subtotalRotulo = 0.125 * (rotuloInsumo.costo || 80);

      return [
        {
          nombre: bulkProd ? bulkProd.nombre : `MEZCLA ELABORADA KG`,
          cantidad: gramsNeeded,
          unidad: 'grs',
          costoUnitario: bulkGramCost,
          subtotal: subtotalBulk,
        },
        {
          nombre: 'Bolsa Polietileno Termosellable (Pack x 1000 u.)',
          cantidad: 1,
          unidad: 'u',
          costoUnitario: bolsaInsumo.costo || 120,
          subtotal: subtotalBolsa,
        },
        {
          nombre: 'Hoja A4 Rótulo Autoadhesivo',
          cantidad: 0.125,
          unidad: 'u',
          costoUnitario: rotuloInsumo.costo || 80,
          subtotal: subtotalRotulo,
        },
      ];
    }

    return [];
  }, [selectedProduct, recipes, rawMaterials, products]);

  const recipeTotalCost = recipeItemsDetailed.reduce((acc, item) => acc + item.subtotal, 0);

  const totalOverheadCost: number = (Object.values(overheads) as number[]).reduce(
    (a: number, b: number) => a + (Number(b) || 0),
    0
  );
  const costMatPrimaConMerma = recipeTotalCost * (1 + mermaPct / 100);
  const costoTotalUnitario = costMatPrimaConMerma + totalOverheadCost;

  const marginComercioNum = customPriceComercio > 0 && costoTotalUnitario > 0
    ? ((customPriceComercio - costoTotalUnitario) / customPriceComercio) * 100
    : 0;

  const marginParticularNum = customPriceParticular > 0 && costoTotalUnitario > 0
    ? ((customPriceParticular - costoTotalUnitario) / customPriceParticular) * 100
    : 0;

  const suggestedMarginComercio = systemConfig?.margenComercioSugerido || 35;
  const suggestedMarginParticular = systemConfig?.margenParticularSugerido || 50;

  const isComercioLowMargin = marginComercioNum < suggestedMarginComercio;
  const isParticularLowMargin = marginParticularNum < suggestedMarginParticular;

  const handleConfirmSavePrices = () => {
    if (!selectedProduct) return;
    updateProduct({
      ...selectedProduct,
      precioComercio: customPriceComercio,
      precioParticular: customPriceParticular,
      costo: costoTotalUnitario,
    });
    setIsConfirmPriceModalOpen(false);
    setPriceSavedMsg(true);
    setTimeout(() => setPriceSavedMsg(false), 3000);
  };

  const isCostoOutdated = (lastUpdateDate?: string) => {
    if (!lastUpdateDate) return true;
    const diffTime = Math.abs(new Date().getTime() - new Date(lastUpdateDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const limitDays = systemConfig?.diasAlertaDesactualizacionCosto || 30;
    return diffDays > limitDays;
  };

  const selectedSupplier =
    suppliers.find((s) => s.id === selectedSupplierId || String(s.id) === String(selectedSupplierId)) ||
    suppliers[0];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#D1E3EB] pb-4">
        <div>
          <h2 className="font-brand font-bold text-2xl text-[#0B4F6C] flex items-center gap-2">
            <Calculator className="w-7 h-7 text-[#017E9A]" />
            Estructura de Costos, Insumos y Proveedores
          </h2>
          <p className="text-sm text-[#607D8B]">
            ABM de Insumos, Desglose Automático de Recetas y Fichas de Cuentas Corrientes con Proveedores.
          </p>
        </div>
      </div>

      {/* Primary Tab Navigation & Aligned Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#D1E3EB] gap-2 pb-1">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('INSUMOS')}
            className={`px-4 py-2 font-brand font-bold text-xs sm:text-sm rounded-t-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'INSUMOS'
                ? 'bg-[#0B4F6C] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Insumos Y Desglose de Costos</span>
          </button>

          <button
            onClick={() => setActiveTab('PROVEEDORES')}
            className={`px-4 py-2 font-brand font-bold text-xs sm:text-sm rounded-t-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'PROVEEDORES'
                ? 'bg-[#0B4F6C] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Agenda Y Cta. Cte. de Proveedores</span>
          </button>
        </div>

        {/* Action Buttons: Smaller and aligned lower down beside tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
          {openNotaCompraModal && (
            <button
              onClick={openNotaCompraModal}
              className="h-8 px-2.5 bg-amber-500 hover:bg-amber-600 text-white font-brand font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1 shadow-2xs shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Nota de Compra</span>
            </button>
          )}

          <a
            href="https://drive.google.com/drive/folders/104YhtlxWzrCUPjdjn5UKFI43e3rTW1ey?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-2.5 border border-[#0B4F6C] text-[#0B4F6C] hover:bg-[#E8F4F8] font-brand font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1 shrink-0"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Precios Proveedores</span>
          </a>

          {activeTab === 'PROVEEDORES' ? (
            <button
              onClick={() => {
                setSupplierToEdit(null);
                setIsNuevoProveedorOpen(true);
              }}
              className="h-8 px-2.5 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1 shadow-2xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nuevo Proveedor</span>
            </button>
          ) : (
            <button
              onClick={openNuevoInsumoModal}
              className="h-8 px-2.5 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1 shadow-2xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nuevo Insumo</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: INSUMOS & DESGLOSE DE COSTOS */}
      {activeTab === 'INSUMOS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Raw Materials / Insumos ABM Table */}
          <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden space-y-3 p-4 flex flex-col h-full">
            <div className="bg-[#E8F4F8] p-3 rounded-xl border border-[#D1E3EB] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
              <div>
                <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#017E9A]" />
                  Insumos y Materias Primas
                </h3>
                <span className="text-xs text-gray-500 font-medium">
                  {filteredInsumos.length} Insumos • Haz clic en encabezados para ordenar
                </span>
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar insumo..."
                  value={insumoSearch}
                  onChange={(e) => setInsumoSearch(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 border border-[#D1E3EB] rounded-lg text-xs bg-white focus:outline-none focus:border-[#017E9A]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[450px] max-h-[720px] border border-[#D1E3EB] rounded-xl bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#E8F4F8] text-[#0B4F6C] font-brand border-b border-[#D1E3EB] z-10">
                  <tr>
                    <th
                      onClick={() => toggleSort('nombre')}
                      className="p-2.5 cursor-pointer hover:bg-[#D1E3EB]/50 transition-colors"
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <span>Insumo / Marca</span>
                        <ArrowUpDown className="w-3 h-3 text-[#017E9A]" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('proveedor')}
                      className="p-2.5 cursor-pointer hover:bg-[#D1E3EB]/50 transition-colors"
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <span>Proveedor</span>
                        <ArrowUpDown className="w-3 h-3 text-[#017E9A]" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('costo')}
                      className="p-2.5 cursor-pointer hover:bg-[#D1E3EB]/50 transition-colors"
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <span>Costo Unit. ($)</span>
                        <ArrowUpDown className="w-3 h-3 text-[#017E9A]" />
                      </div>
                    </th>
                    <th className="p-2.5 text-center font-bold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E3EB]">
                  {filteredInsumos.map((ins) => {
                    const isExpanded = expandedInsumoId === ins.id;
                    const outdated = isCostoOutdated(ins.fechaUltimaActualizacionCosto);

                    return (
                      <React.Fragment key={ins.id}>
                        <tr
                          className={`transition-colors ${
                            ins.activo === false
                              ? 'bg-red-50/70 hover:bg-red-100/50'
                              : 'hover:bg-[#E8F4F8]/40'
                          }`}
                        >
                          <td className="p-2.5">
                            <strong
                              className={`block text-xs ${
                                ins.activo === false
                                  ? 'line-through text-red-600 font-bold'
                                  : 'text-gray-800'
                              }`}
                            >
                              [{ins.codigo || ins.id}] {ins.nombre}
                            </strong>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <small className="text-gray-500 text-[11px]">{ins.marca || '-'}</small>
                              {ins.activo === false && (
                                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                  Inactivo (Baja Lógica)
                                </span>
                              )}
                              {outdated && ins.activo !== false && (
                                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3 text-red-600" />
                                  Costo Desactualizado
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5">
                            <span className="bg-[#E8F4F8] text-[#0B4F6C] px-2 py-0.5 rounded text-[11px] font-semibold">
                              {ins.proveedor}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400 font-bold">$</span>
                              <input
                                type="number"
                                disabled={ins.activo === false}
                                value={editingCosts[ins.id] !== undefined ? editingCosts[ins.id] : ins.costo}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditingCosts((prev) => ({ ...prev, [ins.id]: val }));
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const valStr = editingCosts[ins.id];
                                    if (valStr !== undefined) {
                                      const numVal = parseFloat(valStr);
                                      if (!isNaN(numVal) && numVal !== ins.costo) {
                                        setCostToConfirm({ insumo: ins, oldCost: ins.costo, newCost: numVal });
                                      }
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  const valStr = editingCosts[ins.id];
                                  if (valStr !== undefined) {
                                    const numVal = parseFloat(valStr);
                                    if (!isNaN(numVal) && numVal !== ins.costo) {
                                      setCostToConfirm({ insumo: ins, oldCost: ins.costo, newCost: numVal });
                                    } else {
                                      setEditingCosts((prev) => {
                                        const copy = { ...prev };
                                        delete copy[ins.id];
                                        return copy;
                                      });
                                    }
                                  }
                                }}
                                className="w-20 p-1 border border-[#D1E3EB] rounded font-bold text-[#0B4F6C] text-xs focus:outline-none focus:border-[#017E9A] disabled:bg-gray-100 disabled:text-gray-400"
                              />
                            </div>
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {ins.activo === false ? (
                                <button
                                  onClick={() => reactivateRawMaterial(ins.id)}
                                  className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
                                  title="Reactivar / Reanudar Insumo"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Reactivar</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setInsumoToEdit(ins)}
                                    className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                                    title="Editar Insumo"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setInsumoToDelete(ins)}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                    title="Eliminar Insumo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => setExpandedInsumoId(isExpanded ? null : ins.id)}
                                className="p-1 text-[#017E9A] hover:bg-[#D1E3EB] rounded"
                                title="Ver Ficha Detallada / Acordeón"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Accordion Detailed Insumo View */}
                        {isExpanded && (
                          <tr className="bg-[#F8FCFD]">
                            <td colSpan={4} className="p-4 border-b border-[#D1E3EB]">
                              <div className="bg-white p-3.5 rounded-xl border border-[#D1E3EB] space-y-3 text-xs">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                  <div>
                                    <strong className="text-[#0B4F6C] font-bold text-sm block">
                                      [{ins.codigo || 'INS'}] {ins.nombre}
                                    </strong>
                                    <span className="text-gray-500 text-[11px]">
                                      Categoría: {ins.categoria || 'Insumo Base'} | Marca: {ins.marca || 'S/D'}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-gray-500 block text-[11px]">Última Actualización de Costo:</span>
                                    <strong className={`font-mono text-xs ${outdated ? 'text-red-700 font-bold' : 'text-emerald-700'}`}>
                                      {ins.fechaUltimaActualizacionCosto || 'Sin fecha'}
                                    </strong>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#F4F8FA] p-2.5 rounded-lg border border-[#D1E3EB]">
                                  <div>
                                    <span className="text-gray-500 block">Proveedor:</span>
                                    <strong className="text-[#0B4F6C]">{ins.proveedor}</strong>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 block">Presentación:</span>
                                    <strong className="text-gray-800">{ins.presentacion}</strong>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 block">U.M. x Presentación:</span>
                                    <strong className="text-gray-800">{ins.umPorPresentacion || 1} {ins.unidadMedida || ins.unidad || 'u.'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 block">Stock Actual / Mín / Máx:</span>
                                    <strong className="text-emerald-800">
                                      {ins.stock || 0} / {ins.stockMinimo || 5} / {ins.stockMaximo || 100}
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Cost Breakdown & Price Editor */}
          <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden space-y-4">
            <div className="bg-[#E8F4F8] px-5 py-3 border-b border-[#D1E3EB]">
              <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#017E9A]" />
                Desglose Detallado de Costos por Producto
              </h3>
            </div>

            <div className="p-5 space-y-4 text-xs md:text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Seleccionar Producto a Costear:
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 border border-[#D1E3EB] rounded-lg bg-white font-bold text-[#0B4F6C]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.codigo}] {p.nombre} ({p.tipo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipe Ingredients Cost Table - Point 9 Resolution */}
              <div className="border border-[#D1E3EB] rounded-xl overflow-hidden bg-[#F4F8FA] p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-brand font-bold text-xs text-[#0B4F6C] uppercase flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#017E9A]" />
                    1. Costo Materia Prima Directa (Receta)
                  </h4>
                  <span className="text-[11px] font-bold text-[#017E9A]">
                    {recipeItemsDetailed.length} Componentes
                  </span>
                </div>

                {recipeItemsDetailed.length === 0 ? (
                  <p className="text-xs text-gray-500 italic p-2">
                    Este producto no posee ingredientes cargados en su receta.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-[#D1E3EB] rounded-lg bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#E8F4F8] text-[#0B4F6C] font-semibold border-b border-[#D1E3EB]">
                          <th className="p-2">Componente / Insumo</th>
                          <th className="p-2">Proporción / Cantidad</th>
                          <th className="p-2 text-right">Costo Unit. ($)</th>
                          <th className="p-2 text-right">Subtotal ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D1E3EB]">
                        {recipeItemsDetailed.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="p-2 font-bold text-gray-800">{item.nombre}</td>
                            <td className="p-2 text-gray-700 font-mono">
                              {item.cantidad} {item.unidad}
                            </td>
                            <td className="p-2 text-right text-gray-600 font-mono">
                              ${item.costoUnitario.toFixed(2)}
                            </td>
                            <td className="p-2 text-right font-bold text-emerald-700 font-mono">
                              ${Math.round(item.subtotal).toLocaleString('es-AR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs pt-2 border-t border-[#D1E3EB]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-700 font-bold">% Merma Fija (Categoría):</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                      Read-Only
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      readOnly
                      disabled
                      value={mermaPct}
                      className="w-16 p-1 border border-amber-300 rounded text-xs font-bold text-amber-900 bg-amber-50 text-center cursor-not-allowed"
                      title="Porcentaje de merma fija determinado obligatoriamente por la categoría (Solo Lectura)"
                    />
                    <span className="font-bold text-gray-700">%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="font-bold text-[#0B4F6C]">Subtotal Mat. Prima con Merma:</span>
                  <strong className="text-emerald-700 font-bold text-sm">
                    ${Math.round(costMatPrimaConMerma).toLocaleString('es-AR')}
                  </strong>
                </div>
              </div>

              {/* Section 2: Conceptos Adicionales de Costo */}
              <div className="border border-[#D1E3EB] rounded-xl overflow-hidden bg-[#F4F8FA] p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-brand font-bold text-xs text-[#0B4F6C] uppercase flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#017E9A]" />
                    2. Conceptos Adicionales de Costo
                  </h4>
                  <span className="text-xs font-bold text-[#017E9A]">
                    Subtotal: ${Math.round(totalOverheadCost).toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-[#D1E3EB]">
                  {(systemConfig?.overheadTypes || ['Transporte y Flete', 'Mano de Obra Directa', 'Gas / Energía', 'Packaging y Etiquetas']).map((ohName) => (
                    <div key={ohName} className="flex items-center justify-between text-xs gap-2">
                      <span className="text-gray-700 font-medium truncate">{ohName}:</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-gray-400">$</span>
                        <input
                          type="number"
                          min="0"
                          value={overheads[ohName] !== undefined ? overheads[ohName] : 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setOverheads((prev) => ({ ...prev, [ohName]: val }));
                          }}
                          className="w-20 p-1 border border-[#D1E3EB] rounded text-xs font-bold font-mono text-[#0B4F6C] text-right"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-[#D1E3EB]">
                  <span className="font-extrabold text-[#0B4F6C]">Costo Total Unitario Calculado (Receta + Adicionales):</span>
                  <strong className="text-[#0B4F6C] font-extrabold text-base">
                    ${Math.round(costoTotalUnitario).toLocaleString('es-AR')}
                  </strong>
                </div>
              </div>

              {/* Price Editing with Red Warning Margins */}
              <div className="bg-[#E8F4F8] p-4 rounded-xl border border-[#D1E3EB] space-y-3">
                <h4 className="font-brand font-bold text-xs text-[#0B4F6C] uppercase flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#017E9A]" />
                  3. Edición de Precios de Venta y Márgenes
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-2.5 rounded-lg border border-[#D1E3EB] space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Precio Comercio ($)
                    </label>
                    <input
                      type="number"
                      value={customPriceComercio}
                      onChange={(e) => setCustomPriceComercio(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 border border-[#D1E3EB] rounded font-bold text-[#0B4F6C]"
                    />
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-gray-500">Margen Obtenido:</span>
                      <span className={`font-bold flex items-center gap-1 ${isComercioLowMargin ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200' : 'text-emerald-700'}`}>
                        {isComercioLowMargin && <AlertTriangle className="w-3 h-3 text-red-600" />}
                        {marginComercioNum.toFixed(1)}% (Sugerido: {suggestedMarginComercio}%)
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-[#D1E3EB] space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Precio Particular ($)
                    </label>
                    <input
                      type="number"
                      value={customPriceParticular}
                      onChange={(e) => setCustomPriceParticular(parseFloat(e.target.value) || 0)}
                      className="w-full p-1.5 border border-[#D1E3EB] rounded font-bold text-[#017E9A]"
                    />
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-gray-500">Margen Obtenido:</span>
                      <span className={`font-bold flex items-center gap-1 ${isParticularLowMargin ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200' : 'text-emerald-700'}`}>
                        {isParticularLowMargin && <AlertTriangle className="w-3 h-3 text-red-600" />}
                        {marginParticularNum.toFixed(1)}% (Sugerido: {suggestedMarginParticular}%)
                      </span>
                    </div>
                  </div>
                </div>

                {priceSavedMsg && (
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>¡Precios actualizados exitosamente en el catálogo!</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setIsConfirmPriceModalOpen(true)}
                    className="px-4 py-2 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Precios de Venta</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROVEEDORES & CTA CTE (Identical layout to Clientes Registrados - Point 10 Resolution) */}
      {activeTab === 'PROVEEDORES' && (
        <div className="space-y-6">
          {/* Supplier Directory Table */}
          <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden p-4 space-y-3">
            <div className="bg-[#E8F4F8] p-3 rounded-xl border border-[#D1E3EB] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-3">
                <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#017E9A]" />
                  Proveedores Registrados
                </h3>

                <button
                  onClick={() => setShowSupplierBalances(!showSupplierBalances)}
                  className="px-3 py-1 bg-white border border-[#D1E3EB] rounded-lg text-xs font-bold text-[#0B4F6C] hover:bg-gray-50 flex items-center gap-1.5 shadow-xs"
                >
                  {showSupplierBalances ? <EyeOff className="w-3.5 h-3.5 text-gray-600" /> : <Eye className="w-3.5 h-3.5 text-gray-600" />}
                  <span>{showSupplierBalances ? 'Ocultar Saldos' : 'Ver Saldos'}</span>
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar proveedor..."
                  value={supplierSearchTerm}
                  onChange={(e) => setSupplierSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-[#D1E3EB] rounded-lg text-xs bg-white focus:outline-none focus:border-[#017E9A]"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-[#D1E3EB] rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#E8F4F8] text-[#0B4F6C] font-brand border-b border-[#D1E3EB]">
                    <th
                      onClick={() => toggleSupplierSort('nombre')}
                      className="p-3 cursor-pointer hover:bg-[#D1E3EB]/50 transition-colors"
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <span>Proveedor</span>
                        <ArrowUpDown className="w-3 h-3 text-[#017E9A]" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSupplierSort('rubro')}
                      className="p-3 cursor-pointer hover:bg-[#D1E3EB]/50 transition-colors"
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <span>Rubro / Canal</span>
                        <ArrowUpDown className="w-3 h-3 text-[#017E9A]" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSupplierSort('telefono')}
                      className="p-3 cursor-pointer hover:bg-[#D1E3EB]/50 transition-colors"
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <span>Teléfono</span>
                        <ArrowUpDown className="w-3 h-3 text-[#017E9A]" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSupplierSort('saldo')}
                      className="p-3 cursor-pointer hover:bg-[#D1E3EB]/50 transition-colors"
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <span>Saldo Cta Cte</span>
                        <ArrowUpDown className="w-3 h-3 text-[#017E9A]" />
                      </div>
                    </th>
                    <th className="p-3 text-center font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1E3EB]">
                  {filteredSuppliers.map((s) => {
                    const isSelected = selectedSupplier?.id === s.id;
                    const cleanPhone = (s.telefono || '').replace(/\D/g, '');

                    return (
                      <tr
                        key={s.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-[#E8F4F8]/60' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="p-3">
                          <strong className="font-brand font-bold text-sm text-[#0B4F6C] block">
                            {s.nombre}
                          </strong>
                          <span className="text-gray-500 text-[11px]">{s.direccion || 'Sin dirección cargada'}</span>
                        </td>
                        <td className="p-3">
                          <span className="bg-[#E8F4F8] text-[#0B4F6C] px-2.5 py-1 rounded-full font-bold text-[11px]">
                            {s.rubro || 'General'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 font-mono">
                            <span>{s.telefono || 'Sin teléfono'}</span>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/549${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-full"
                                title="Enviar mensaje de WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-mono font-bold text-xs ${
                              s.saldo > 0 ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {showSupplierBalances
                              ? `$${s.saldo.toLocaleString('es-AR')}`
                              : '••••••••'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSupplierToEdit(s);
                                setIsNuevoProveedorOpen(true);
                              }}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Editar datos del proveedor"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setSupplierToDelete(s)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar proveedor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setSelectedSupplierId(s.id)}
                              className="px-2.5 py-1 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors"
                              title="Ver Ficha y Cuenta Corriente"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Cta Cte</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supplier Detail & Cuenta Corriente Ledger */}
          <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden flex flex-col">
            {selectedSupplier ? (
              <div className="flex flex-col">
                <div className="bg-[#E8F4F8] p-5 border-b border-[#D1E3EB] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#017E9A] uppercase tracking-wide">
                      Ficha de Proveedor Y Cuenta Corriente
                    </span>
                    <h3 className="font-brand font-bold text-2xl text-[#0B4F6C]">
                      {selectedSupplier.nombre}
                    </h3>
                    <p className="text-xs text-gray-600">
                      CUIT: {selectedSupplier.cuit || 'Sin CUIT'} | Contacto: {selectedSupplier.contacto || 'N/A'} | Tel: {selectedSupplier.telefono || 'N/A'} | Dir: {selectedSupplier.direccion || 'S/D'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowSupplierBalances(!showSupplierBalances)}
                      className="px-3 py-2 bg-white border border-[#D1E3EB] hover:bg-gray-50 text-[#0B4F6C] font-brand font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                      title="Ver u Ocultar Saldos de Cuenta Corriente"
                    >
                      {showSupplierBalances ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}
                      <span>{showSupplierBalances ? 'Ocultar Saldos' : 'Ver Saldos'}</span>
                    </button>

                    <button
                      onClick={() => setPaymentSupplier(selectedSupplier)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-brand font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>+ Cargar Pago Efectuado</span>
                    </button>

                    {openNotaCompraModal && (
                      <button
                        onClick={openNotaCompraModal}
                        className="px-4 py-2 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Cargar Nota de Compra</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center bg-[#F4F8FA] p-3 rounded-xl border border-[#D1E3EB]">
                    <span className="font-brand font-bold text-xs text-[#0B4F6C]">
                      Saldo Cta. Cte. Pendiente de Pago a Proveedor:
                    </span>
                    <h3
                      className={`font-brand font-bold text-xl ${
                        selectedSupplier.saldo > 0 ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {showSupplierBalances
                        ? `$${selectedSupplier.saldo.toLocaleString('es-AR')}`
                        : '••••••••'}
                    </h3>
                  </div>

                  <div className="overflow-x-auto border border-[#D1E3EB] rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#E8F4F8] text-[#0B4F6C] font-brand border-b border-[#D1E3EB]">
                          <th className="p-2.5">Fecha</th>
                          <th className="p-2.5">Concepto / Operación</th>
                          <th className="p-2.5 text-right">Debe ($)</th>
                          <th className="p-2.5 text-right">Haber ($)</th>
                          <th className="p-2.5 text-right">Saldo ($)</th>
                          <th className="p-2.5 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D1E3EB]">
                        {selectedSupplier.historial && selectedSupplier.historial.length > 0 ? (
                          selectedSupplier.historial.map((h) => (
                            <tr key={h.id} className="hover:bg-gray-50">
                              <td className="p-2.5 text-gray-600 font-mono">{h.fecha}</td>
                              <td className="p-2.5 font-bold text-gray-800">{h.concepto}</td>
                              <td className="p-2.5 text-right font-bold text-amber-800 font-mono">
                                {showSupplierBalances
                                  ? (h.debe > 0 ? `$${h.debe.toLocaleString('es-AR')}` : '-')
                                  : '••••••••'}
                              </td>
                              <td className="p-2.5 text-right font-bold text-emerald-800 font-mono">
                                {showSupplierBalances
                                  ? (h.haber > 0 ? `$${h.haber.toLocaleString('es-AR')}` : '-')
                                  : '••••••••'}
                              </td>
                              <td className="p-2.5 text-right font-bold text-[#0B4F6C] font-mono">
                                {showSupplierBalances
                                  ? `$${h.saldo.toLocaleString('es-AR')}`
                                  : '••••••••'}
                              </td>
                              <td className="p-2.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setTxToView(h)}
                                    title="Ver Detalle"
                                    className="p-1 text-[#017E9A] hover:bg-[#E8F4F8] rounded transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setTxToEdit({
                                        id: h.id,
                                        fecha: h.fecha,
                                        concepto: h.concepto,
                                        debe: h.debe,
                                        haber: h.haber,
                                      })
                                    }
                                    title="Editar Movimiento"
                                    className="p-1 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setTxToCancel({
                                        id: h.id,
                                        concepto: h.concepto,
                                      })
                                    }
                                    title="Cancelar / Anular Movimiento"
                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-gray-500 italic">
                              Sin movimientos en la cuenta corriente de este proveedor.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
                <Building2 className="w-12 h-12 text-gray-300 mb-2" />
                <p>Seleccione un proveedor del directorio para visualizar sus datos y movimientos de cuenta.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <NuevoInsumoModal
        isOpen={!!insumoToEdit}
        onClose={() => setInsumoToEdit(null)}
        insumoToEdit={insumoToEdit}
      />

      <NuevoProveedorModal
        isOpen={isNuevoProveedorOpen}
        onClose={() => {
          setIsNuevoProveedorOpen(false);
          setSupplierToEdit(null);
        }}
        supplierToEdit={supplierToEdit}
      />

      <RegistrarPagoProveedorModal
        isOpen={!!paymentSupplier}
        onClose={() => setPaymentSupplier(null)}
        supplier={paymentSupplier}
      />

      {/* Confirmation Modal for Price Changes */}
      <ConfirmModal
        isOpen={isConfirmPriceModalOpen}
        onClose={() => setIsConfirmPriceModalOpen(false)}
        onConfirm={handleConfirmSavePrices}
        title="Confirmar Modificación de Precios de Venta"
        message={`¿Está seguro de guardar los nuevos precios de venta para [${selectedProduct?.codigo}] ${selectedProduct?.nombre}? Se actualizará el catálogo y las listas de precios en todo el sistema.`}
        confirmText="Aprobar y Guardar Precios"
      />

      {/* Confirmation Modal for Insumo Cost Changes */}
      <ConfirmModal
        isOpen={!!costToConfirm}
        onClose={() => {
          if (costToConfirm) {
            setEditingCosts((prev) => {
              const copy = { ...prev };
              delete copy[costToConfirm.insumo.id];
              return copy;
            });
          }
          setCostToConfirm(null);
        }}
        onConfirm={() => {
          if (costToConfirm) {
            updateRawMaterialCosto(costToConfirm.insumo.id, costToConfirm.newCost);
            updateRawMaterial(costToConfirm.insumo.id, {
              fechaUltimaActualizacionCosto: new Date().toISOString().split('T')[0],
            });
            setEditingCosts((prev) => {
              const copy = { ...prev };
              delete copy[costToConfirm.insumo.id];
              return copy;
            });
            setInsumoNoticeMessage(
              `¡Costo del insumo [${costToConfirm.insumo.codigo || costToConfirm.insumo.id}] "${costToConfirm.insumo.nombre}" actualizado correctamente a $${costToConfirm.newCost.toLocaleString('es-AR')}!`
            );
            setCostToConfirm(null);
          }
        }}
        title="Confirmar Cambio de Costo de Insumo"
        message={
          <span>
            ¿Desea actualizar el costo del insumo <strong>[{costToConfirm?.insumo.codigo || costToConfirm?.insumo.id}] {costToConfirm?.insumo.nombre}</strong> de <strong>${costToConfirm?.oldCost.toLocaleString('es-AR')}</strong> a <strong>${costToConfirm?.newCost.toLocaleString('es-AR')}</strong>?
          </span>
        }
        confirmText="Guardar Nuevo Costo"
        cancelText="Cancelar"
      />

      {/* Confirmation Modal for Insumo Deletion */}
      <ConfirmModal
        isOpen={!!insumoToDelete}
        onClose={() => setInsumoToDelete(null)}
        onConfirm={handleDeleteInsumoConfirm}
        title="Confirmar Eliminación de Insumo"
        message={`¿Está seguro de eliminar el insumo "${insumoToDelete?.nombre}"?`}
        confirmText="Eliminar Insumo"
      />

      {/* Confirmation Modal for Supplier Deletion */}
      <ConfirmModal
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={handleDeleteSupplierConfirm}
        title="Confirmar Eliminación de Proveedor"
        message={`¿Está seguro de eliminar al proveedor "${supplierToDelete?.nombre}"?`}
        confirmText="Eliminar Proveedor"
      />

      {/* Logical Deletion Reason Notice Modal */}
      {insumoNoticeMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#D1E3EB]">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-brand font-bold text-lg text-[#0B4F6C]">
                Resultado de Baja de Insumo
              </h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {insumoNoticeMessage}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setInsumoNoticeMessage(null)}
                className="px-5 py-2.5 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-bold rounded-xl text-sm transition-colors shadow-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Supplier Transaction Modal */}
      {txToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#D1E3EB]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#D1E3EB]">
              <h3 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#017E9A]" />
                Detalle del Comprobante / Movimiento
              </h3>
              <button onClick={() => setTxToView(null)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-gray-500">Fecha:</span>
                <p className="font-mono font-bold text-gray-800">{txToView.fecha}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Concepto / Operación:</span>
                <p className="font-bold text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">{txToView.concepto}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="block text-[10px] uppercase font-bold text-amber-800">Debe (Factura)</span>
                  <span className="font-mono font-bold text-sm text-amber-900">${txToView.debe.toLocaleString('es-AR')}</span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="block text-[10px] uppercase font-bold text-emerald-800">Haber (Pago)</span>
                  <span className="font-mono font-bold text-sm text-emerald-900">${txToView.haber.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-5">
              <button
                onClick={() => setTxToView(null)}
                className="px-4 py-2 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-bold rounded-xl text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Supplier Transaction Modal */}
      {txToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#D1E3EB]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#D1E3EB]">
              <h3 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-600" />
                Editar Movimiento de Proveedor
              </h3>
              <button onClick={() => setTxToEdit(null)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedSupplierId && txToEdit) {
                  editSupplierTransaction(selectedSupplierId, txToEdit.id, {
                    fecha: txToEdit.fecha,
                    concepto: txToEdit.concepto,
                    debe: Number(txToEdit.debe) || 0,
                    haber: Number(txToEdit.haber) || 0,
                  });
                  setTxToEdit(null);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={txToEdit.fecha}
                  onChange={(e) => setTxToEdit({ ...txToEdit, fecha: e.target.value })}
                  className="w-full p-2 border border-[#D1E3EB] rounded-lg font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Concepto</label>
                <input
                  type="text"
                  value={txToEdit.concepto}
                  onChange={(e) => setTxToEdit({ ...txToEdit, concepto: e.target.value })}
                  className="w-full p-2 border border-[#D1E3EB] rounded-lg font-medium"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Debe ($)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={txToEdit.debe}
                    onChange={(e) => setTxToEdit({ ...txToEdit, debe: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-[#D1E3EB] rounded-lg font-bold text-amber-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Haber ($)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={txToEdit.haber}
                    onChange={(e) => setTxToEdit({ ...txToEdit, haber: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-[#D1E3EB] rounded-lg font-bold text-emerald-800"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setTxToEdit(null)}
                  className="px-4 py-2 border border-[#D1E3EB] bg-white hover:bg-gray-50 text-gray-700 font-brand font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-bold rounded-xl text-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Cancellation Modal */}
      <ConfirmModal
        isOpen={!!txToCancel}
        onClose={() => setTxToCancel(null)}
        onConfirm={() => {
          if (selectedSupplierId && txToCancel) {
            cancelSupplierTransaction(selectedSupplierId, txToCancel.id);
            setTxToCancel(null);
          }
        }}
        title="Cancelar / Anular Comprobante de Proveedor"
        message={`¿Está seguro de anular el movimiento "${txToCancel?.concepto}"? Esta acción recalculará automáticamente el saldo del proveedor.`}
        confirmText="Anular Movimiento"
      />
    </div>
  );
};
