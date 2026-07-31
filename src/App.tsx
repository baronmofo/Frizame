import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { StockModule } from './components/StockModule';
import { ClientsModule } from './components/ClientsModule';
import { RotulosModule } from './components/RotulosModule';
import { FraccionamientoModule } from './components/FraccionamientoModule';
import { CostosModule } from './components/CostosModule';
import { ConfiguracionModule } from './components/ConfiguracionModule';
import { PrintA4Sheet } from './components/PrintA4Sheet';
import { BookOpen } from 'lucide-react';

// Modals
import { VentaModal } from './components/modals/VentaModal';
import { ReceiptOPModal } from './components/modals/ReceiptOPModal';
import { NotaCompraModal } from './components/modals/NotaCompraModal';
import { NuevoClienteModal } from './components/modals/NuevoClienteModal';
import { RegistrarPagoModal } from './components/modals/RegistrarPagoModal';
import { NuevoInsumoModal } from './components/modals/NuevoInsumoModal';
import { NuevaRecetaModal } from './components/modals/NuevaRecetaModal';
import { NuevoProductoModal } from './components/modals/NuevoProductoModal';
import { UserManualModal } from './components/modals/UserManualModal';
import { LoginScreen } from './components/LoginScreen';
import { OrderOP, Client, Product } from './types';

function AppContent() {
  const { systemConfig, isLoggedIn } = useApp();
  const [activeTab, setActiveTab] = useState<string>('mod-dashboard');
  const [costosSubTab, setCostosSubTab] = useState<'INSUMOS' | 'PROVEEDORES'>('INSUMOS');
  const [selectedClientId, setSelectedClientId] = useState<number | string | null>(null);

  // Always navigate to Dashboard upon login
  useEffect(() => {
    if (isLoggedIn) {
      setActiveTab('mod-dashboard');
    }
  }, [isLoggedIn]);

  // Dynamic Theme palette effect across all pages
  useEffect(() => {
    const theme = systemConfig?.themePalette || 'classic';
    let p = '#0B4F6C', s = '#017E9A', soft = '#E8F4F8', bg = '#F4F8FA', text = '#1C2D37', border = '#D1E3EB';

    if (theme === 'sapphire') {
      p = '#1E3A8A'; s = '#2563EB'; soft = '#EFF6FF'; bg = '#F8FAFC'; text = '#0F172A'; border = '#BFDBFE';
    } else if (theme === 'emerald') {
      p = '#064E3B'; s = '#059669'; soft = '#ECFDF5'; bg = '#F0FDF4'; text = '#022C22'; border = '#A7F3D0';
    } else if (theme === 'sunset') {
      p = '#7C2D12'; s = '#EA580C'; soft = '#FFF7ED'; bg = '#FAFAF9'; text = '#1C1917'; border = '#FED7AA';
    } else if (theme === 'dark') {
      p = '#0F172A'; s = '#0284C7'; soft = '#1E293B'; bg = '#0B0F17'; text = '#F8FAFC'; border = '#334155';
    }

    let styleTag = document.getElementById('frizame-theme-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'frizame-theme-styles';
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      :root {
        --primary-blue: ${p};
        --secondary-teal: ${s};
        --soft-blue: ${soft};
        --dark-text: ${text};
      }
      body {
        background-color: ${bg} !important;
        color: ${text} !important;
      }
      .bg-\\[\\#0B4F6C\\] { background-color: ${p} !important; }
      .text-\\[\\#0B4F6C\\] { color: ${p} !important; }
      .border-\\[\\#0B4F6C\\] { border-color: ${p} !important; }

      .bg-\\[\\#017E9A\\] { background-color: ${s} !important; }
      .text-\\[\\#017E9A\\] { color: ${s} !important; }
      .border-\\[\\#017E9A\\] { border-color: ${s} !important; }

      .bg-\\[\\#E8F4F8\\] { background-color: ${soft} !important; }
      .text-\\[\\#E8F4F8\\] { color: ${soft} !important; }
      .border-\\[\\#D1E3EB\\] { border-color: ${border} !important; }

      .bg-\\[\\#F4F8FA\\] { background-color: ${bg} !important; }
      .bg-\\[\\#1C2D37\\] { background-color: ${text} !important; }
      .text-\\[\\#1C2D37\\] { color: ${text} !important; }
    `;
  }, [systemConfig?.themePalette]);

  // Modals state
  const [isVentaModalOpen, setIsVentaModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<OrderOP | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<OrderOP | null>(null);

  const [isNotaCompraModalOpen, setIsNotaCompraModalOpen] = useState(false);
  const [isNuevoClienteModalOpen, setIsNuevoClienteModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [isRegistrarPagoModalOpen, setIsRegistrarPagoModalOpen] = useState(false);
  const [isNuevoInsumoModalOpen, setIsNuevoInsumoModalOpen] = useState(false);
  const [isNuevaRecetaModalOpen, setIsNuevaRecetaModalOpen] = useState(false);
  const [selectedRecipeProductId, setSelectedRecipeProductId] = useState<number | string | null>(null);

  const [isNuevoProductoModalOpen, setIsNuevoProductoModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // User Manual Modal State
  const [isUserManualOpen, setIsUserManualOpen] = useState(false);

  // Printable A4 Label config
  const [printLabelConfig, setPrintLabelConfig] = useState<any>(null);

  const handleOpenNuevoProducto = () => {
    setProductToEdit(null);
    setIsNuevoProductoModalOpen(true);
  };

  const handleEditProduct = (p: Product) => {
    setProductToEdit(p);
    setIsNuevoProductoModalOpen(true);
  };

  const handleOpenNuevaReceta = (productId?: number | string) => {
    setSelectedRecipeProductId(productId || null);
    setIsNuevaRecetaModalOpen(true);
  };

  const handleTriggerPrint = (config: any) => {
    setPrintLabelConfig(config);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleOpenRegistrarPago = (clientId: number | string) => {
    setSelectedClientId(clientId);
    setIsRegistrarPagoModalOpen(true);
  };

  const handleOpenNuevoCliente = () => {
    setClientToEdit(null);
    setIsNuevoClienteModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setIsNuevoClienteModalOpen(true);
  };

  const [prefilledNotaCompraItem, setPrefilledNotaCompraItem] = useState<any>(null);

  const handleOpenNotaCompra = (prefilled?: any) => {
    if (
      prefilled &&
      typeof prefilled === 'object' &&
      !('nativeEvent' in prefilled) &&
      !('target' in prefilled) &&
      ('itemId' in prefilled || 'supplierId' in prefilled || 'type' in prefilled)
    ) {
      setPrefilledNotaCompraItem(prefilled);
    } else {
      setPrefilledNotaCompraItem(null);
    }
    setIsNotaCompraModalOpen(true);
  };

  const handleOpenNewVenta = () => {
    setOrderToEdit(null);
    setIsVentaModalOpen(true);
  };

  const handleEditOrderOP = (order: OrderOP) => {
    setOrderToEdit(order);
    setIsVentaModalOpen(true);
  };

  const handleSaleConfirmed = (order: OrderOP) => {
    setActiveReceiptOrder(order);
    setIsReceiptModalOpen(true);
  };

  const handleSelectOrderOP = (order: OrderOP) => {
    setActiveReceiptOrder(order);
    setIsReceiptModalOpen(true);
  };

  // If login is required and user is not authenticated, render LoginScreen
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F8FA] text-[#1C2D37] w-full max-w-full overflow-x-hidden">
      {/* Top App Header & Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content View Container */}
      <main className="no-print max-w-7xl w-full mx-auto px-4 py-6 flex-1">
        {activeTab === 'mod-dashboard' && (
          <Dashboard
            setActiveTab={setActiveTab}
            openVentaModal={handleOpenNewVenta}
            openNotaCompraModal={handleOpenNotaCompra}
            onSelectCliente={(id) => setSelectedClientId(id)}
            onNavigateToProveedores={() => {
              setCostosSubTab('PROVEEDORES');
              setActiveTab('mod-costos');
            }}
          />
        )}

        {activeTab === 'mod-stock' && (
          <StockModule
            openVentaModal={handleOpenNewVenta}
            setActiveTab={setActiveTab}
            onSelectOrderOP={handleSelectOrderOP}
            onEditOrderOP={handleEditOrderOP}
          />
        )}

        {activeTab === 'mod-clientes' && (
          <ClientsModule
            selectedClientId={selectedClientId}
            setSelectedClientId={setSelectedClientId}
            openNuevoClienteModal={handleOpenNuevoCliente}
            onEditClient={handleEditClient}
            openRegistrarPagoModal={handleOpenRegistrarPago}
          />
        )}

        {activeTab === 'mod-rotulos' && (
          <RotulosModule onTriggerPrint={handleTriggerPrint} />
        )}

        {activeTab === 'mod-fraccionamiento' && (
          <FraccionamientoModule
            openNuevaRecetaModal={handleOpenNuevaReceta}
            openNotaCompraModal={handleOpenNotaCompra}
            openNuevoProductoModal={handleOpenNuevoProducto}
            onEditProduct={handleEditProduct}
          />
        )}

        {activeTab === 'mod-costos' && (
          <CostosModule
            openNuevoInsumoModal={() => setIsNuevoInsumoModalOpen(true)}
            openNotaCompraModal={handleOpenNotaCompra}
            defaultSubTab={costosSubTab}
          />
        )}

        {activeTab === 'mod-configuracion' && (
          <ConfiguracionModule />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-[#0B4F6C] text-white/80 py-3.5 px-4 border-t border-[#017E9A]/30 mt-auto text-xs text-center font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            <strong>Frizame - Congelados Premium</strong> &copy; {new Date().getFullYear()} • Sistema de Gestión Integral
          </span>
          <button
            type="button"
            onClick={() => setIsUserManualOpen(true)}
            className="text-sky-200 hover:text-white underline decoration-sky-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer bg-sky-900/50 hover:bg-sky-800 px-3 py-1 rounded-lg border border-sky-400/30 transition-all shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-300" />
            <span>Manual de usuario</span>
          </button>
        </div>
      </footer>

      {/* Modals */}
      <UserManualModal
        isOpen={isUserManualOpen}
        onClose={() => setIsUserManualOpen(false)}
      />
      <VentaModal
        isOpen={isVentaModalOpen}
        onClose={() => setIsVentaModalOpen(false)}
        onSaleConfirmed={handleSaleConfirmed}
        orderToEdit={orderToEdit}
      />

      <ReceiptOPModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={activeReceiptOrder}
      />

      <NotaCompraModal
        isOpen={isNotaCompraModalOpen}
        onClose={() => {
          setIsNotaCompraModalOpen(false);
          setPrefilledNotaCompraItem(null);
        }}
        prefilledItem={prefilledNotaCompraItem}
      />

      <NuevoClienteModal
        isOpen={isNuevoClienteModalOpen}
        onClose={() => setIsNuevoClienteModalOpen(false)}
        clientToEdit={clientToEdit}
      />

      <RegistrarPagoModal
        isOpen={isRegistrarPagoModalOpen}
        onClose={() => setIsRegistrarPagoModalOpen(false)}
        clientId={selectedClientId}
      />

      <NuevoInsumoModal
        isOpen={isNuevoInsumoModalOpen}
        onClose={() => setIsNuevoInsumoModalOpen(false)}
      />

      <NuevaRecetaModal
        isOpen={isNuevaRecetaModalOpen}
        onClose={() => setIsNuevaRecetaModalOpen(false)}
        initialProductId={selectedRecipeProductId}
      />

      <NuevoProductoModal
        isOpen={isNuevoProductoModalOpen}
        onClose={() => setIsNuevoProductoModalOpen(false)}
        productToEdit={productToEdit}
      />

      {/* Printable Hidden A4 Label Grid */}
      <PrintA4Sheet labelConfig={printLabelConfig} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
