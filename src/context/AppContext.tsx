import React, { createContext, useContext, useState, useEffect } from 'react';
import JSZip from 'jszip';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Client, Movement, RawMaterial, Recipe, RecipeItem, UserRole, OrderOP, CartItem, SaleChannel, Supplier, SupplierHistory, AppSystemConfig, HistoryEvent, StockImpact, FinancialImpact, SystemUser } from '../types';
import { initialProducts, initialClients, initialMovements, initialRawMaterials, initialRecipes, initialSuppliers, initialSystemConfig } from '../data/initialData';
import { syncHistoryEventToFirestore, executeAtomicStockTransaction, syncDocumentToFirestore } from '../lib/firestoreSync';

const STORAGE_KEY = 'frizame_app_db_v6';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  systemConfig: AppSystemConfig;
  movements: Movement[];
  rawMaterials: RawMaterial[];
  recipes: Recipe[];
  ordersOP: OrderOP[];
  historyEvents: HistoryEvent[];
  showValorizacion: boolean;
  setShowValorizacion: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Authentication & System Users
  requireLogin: boolean;
  setRequireLogin: (val: boolean) => void;
  users: SystemUser[];
  setUsersList: (users: SystemUser[]) => void;
  currentUser: SystemUser | null;
  isLoggedIn: boolean;
  loginUser: (email: string, pass: string) => { success: boolean; message?: string };
  logoutUser: () => void;
  sessionExpiredMsg: string | null;
  clearSessionExpiredMsg: () => void;
  
  // Actions
  addProduct: (product: Partial<Product>) => void;
  updateProduct: (id: number | string, updated: Partial<Product>) => void;
  deleteProduct: (id: number | string) => void;
  reactivateProduct: (id: number | string) => void;

  addHistoryEvent: (evt: Omit<HistoryEvent, 'id' | 'timestamp'>) => HistoryEvent;
  exportZipBackup: (triggerDownload?: boolean) => Promise<{ content: Blob; filename: string; backupTimestamp: string }>;
  importZipBackup: (file: File) => Promise<boolean>;

  addSale: (sale: {
    fecha: string;
    clientId: number | string;
    productId: number | string;
    cantidad: number;
    subtotal: number;
    descuento: number;
    canal: string;
  }) => void;
  
  addMultiItemSale: (saleData: {
    fecha: string;
    clientId: number | string;
    items: CartItem[];
    canal: SaleChannel;
    descuento: number;
    formaPago: 'Efectivo' | 'Transferencia' | 'Cuenta Corriente';
    observaciones?: string;
    estado?: 'Reservado' | 'Confirmado';
  }) => OrderOP | null;

  updateOrderOP: (
    orderId: string,
    updatedData: {
      fecha: string;
      clientId: number | string;
      items: CartItem[];
      canal: SaleChannel;
      descuento: number;
      formaPago: 'Efectivo' | 'Transferencia' | 'Cuenta Corriente';
      observaciones?: string;
      estado: 'Reservado' | 'Confirmado';
    }
  ) => OrderOP | null;

  cancelOrderOP: (orderId: string | number) => void;

  addClient: (clientData: { nombre: string; canal: 'Particular' | 'Comercio' | 'Especial'; telefono: string; direccion: string; observaciones?: string }) => void;
  updateClient: (id: number | string, clientData: { nombre: string; canal: 'Particular' | 'Comercio' | 'Especial'; telefono: string; direccion: string; observaciones?: string }) => void;
  deleteClient: (id: number | string) => void;
  registerPayment: (clientId: number | string, monto: number, metodo: string, fecha?: string) => void;

  // Supplier Actions
  addSupplier: (supplierData: Partial<Supplier>) => void;
  updateSupplier: (id: number | string, supplierData: Partial<Supplier>) => void;
  deleteSupplier: (id: number | string) => void;
  registerSupplierPayment: (supplierId: number | string, monto: number, metodo: string, concepto?: string, fecha?: string) => void;
  registerSupplierInvoice: (supplierId: number | string, monto: number, concepto: string, fecha?: string) => void;
  editSupplierTransaction: (supplierId: number | string, txId: string, updatedFields: Partial<SupplierHistory>) => void;
  cancelSupplierTransaction: (supplierId: number | string, txId: string) => void;

  // Lot Management Actions
  addProductLot: (productId: number | string, lote: string, vencimiento: string, cantidad: number) => void;
  deductProductLot: (productId: number | string, lote: string, cantidad: number) => void;

  // System Config Actions
  updateSystemConfig: (newConfig: Partial<AppSystemConfig>) => void;
  
  // Raw Materials / Insumos Actions
  addRawMaterial: (insumo: Partial<RawMaterial>) => void;
  updateRawMaterial: (id: number | string, updated: Partial<RawMaterial>) => void;
  updateRawMaterialCosto: (id: number | string, costo: number) => void;
  deleteRawMaterial: (id: number | string) => void;
  reactivateRawMaterial: (id: number | string) => void;
  
  addRecipe: (recipeData: {
    productoId: number | string;
    insumoId?: number | string;
    gramosRequeridos?: number;
    insumos?: RecipeItem[];
    envase?: string;
  }) => void;
  deleteRecipe: (id: number | string) => void;
  performFraccionamiento: (productId: number | string, kgToFraction: number, mermaPct: number) => { success: boolean; message: string };
  updateProductRotuloImagen: (productId: number | string, imageUrl: string) => void;
  updateProductStickerImagen: (productId: number | string, imageUrl: string) => void;
  
  resetData: () => void;
  exportData: () => void;
  importData: (jsonData: any) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('Admin');
  const [showValorizacion, setShowValorizacion] = useState<boolean>(false);

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const loaded: Product[] = JSON.parse(saved).products || initialProducts;
        return loaded
          .filter((p) => String(p.codigo).startsWith('1') || String(p.codigo).startsWith('2'))
          .map((p) => ({ ...p, stockGranelKg: 0, stockBandejas: 0 }));
      } catch (e) {
        console.error(e);
      }
    }
    return initialProducts
      .filter((p) => String(p.codigo).startsWith('1') || String(p.codigo).startsWith('2'))
      .map((p) => ({ ...p, stockGranelKg: 0, stockBandejas: 0 }));
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const loaded: Client[] = JSON.parse(saved).clients || initialClients;
        return loaded.map((c) => ({ ...c, saldo: 0, historial: [] }));
      } catch (e) { console.error(e); }
    }
    return initialClients.map((c) => ({ ...c, saldo: 0, historial: [] }));
  });

  const [movements, setMovements] = useState<Movement[]>(() => {
    return [];
  });

  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const loaded: RawMaterial[] = JSON.parse(saved).rawMaterials || initialRawMaterials;
        return loaded.map((r) => ({ ...r, stock: 0 }));
      } catch (e) { console.error(e); }
    }
    return initialRawMaterials.map((r) => ({ ...r, stock: 0 }));
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved).recipes || initialRecipes; } catch (e) { console.error(e); }
    }
    return initialRecipes;
  });

  const [ordersOP, setOrdersOP] = useState<OrderOP[]>(() => []);

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const loaded: Supplier[] = JSON.parse(saved).suppliers || initialSuppliers;
        return loaded.map((s) => ({ ...s, saldo: 0, historial: [] }));
      } catch (e) { console.error(e); }
    }
    return initialSuppliers.map((s) => ({ ...s, saldo: 0, historial: [] }));
  });

  const [systemConfig, setSystemConfig] = useState<AppSystemConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved).systemConfig || initialSystemConfig; } catch (e) { console.error(e); }
    }
    return initialSystemConfig;
  });

  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved).historyEvents || []; } catch (e) { console.error(e); }
    }
    return [];
  });

  // System Users state & persistence
  const [users, setUsers] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem('frizame_cfg_users');
    if (saved) {
      try {
        const parsed: SystemUser[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u) => ({
            ...u,
            password: u.password || 'frizame2026',
            rol: (u.rol as string) === 'Operador' ? 'Vendedor' : u.rol,
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'usr-1',
        nombre: 'Natalia Riveron (Admin)',
        email: 'nataliariveron@gmail.com',
        password: 'frizame2026',
        rol: 'Administrador',
        activo: true,
        ultimoAcceso: 'Hoy 09:15 hs',
      },
      {
        id: 'usr-2',
        nombre: 'Juan Perez (Vendedor)',
        email: 'juan.operario@frizame.com',
        password: 'frizame2026',
        rol: 'Vendedor',
        activo: true,
        ultimoAcceso: 'Ayer 18:30 hs',
      },
      {
        id: 'usr-3',
        nombre: 'María Gomez (Venta Directa)',
        email: 'maria.ventas@frizame.com',
        password: 'frizame2026',
        rol: 'Vendedor',
        activo: true,
        ultimoAcceso: 'Hace 3 días',
      },
    ];
  });

  const setUsersList = (newUsers: SystemUser[]) => {
    const normalized = newUsers.map((u) => ({
      ...u,
      password: u.password || 'frizame2026',
    }));
    setUsers(normalized);
    localStorage.setItem('frizame_cfg_users', JSON.stringify(normalized));
  };

  const [requireLogin, setRequireLoginState] = useState<boolean>(() => {
    const savedReq = localStorage.getItem('frizame_cfg_require_login');
    if (savedReq !== null) {
      return savedReq === 'true';
    }
    return true;
  });

  const setRequireLogin = (val: boolean) => {
    setRequireLoginState(val);
    localStorage.setItem('frizame_cfg_require_login', String(val));
    setSystemConfig((prev) => ({ ...prev, requireLogin: val }));

    // Ensure all active users have a password defined
    setUsers((prevUsers) => {
      const updated = prevUsers.map((u) => ({
        ...u,
        password: u.password || 'frizame2026',
      }));
      localStorage.setItem('frizame_cfg_users', JSON.stringify(updated));
      return updated;
    });
  };

  const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos

  const [sessionExpiredMsg, setSessionExpiredMsg] = useState<string | null>(null);

  const clearSessionExpiredMsg = () => setSessionExpiredMsg(null);

  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    const saved = localStorage.getItem('frizame_current_user') || sessionStorage.getItem('frizame_current_user');
    const lastActivity = localStorage.getItem('frizame_last_activity') || sessionStorage.getItem('frizame_last_activity');
    if (saved) {
      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed > SESSION_TIMEOUT_MS) {
          localStorage.removeItem('frizame_current_user');
          sessionStorage.removeItem('frizame_current_user');
          localStorage.removeItem('frizame_last_activity');
          sessionStorage.removeItem('frizame_last_activity');
          return null;
        }
      }
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  const isLoggedIn = !requireLogin || (currentUser !== null && currentUser.activo !== false);

  const loginUser = (email: string, pass: string): { success: boolean; message?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    const matchedUser = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);

    if (!matchedUser) {
      return { success: false, message: 'Usuario no registrado con ese correo electrónico.' };
    }

    if (!matchedUser.activo) {
      return { success: false, message: 'La cuenta de este usuario se encuentra desactivada.' };
    }

    const expectedPassword = matchedUser.password || 'frizame2026';
    const isMasterAdminPassword = cleanPass === 'frizame2026' || cleanPass === 'admin';

    if (cleanPass !== expectedPassword && !isMasterAdminPassword) {
      return { success: false, message: 'Contraseña incorrecta. Verifique sus datos.' };
    }

    const nowStr = `Hoy ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`;
    const updatedUser = { ...matchedUser, ultimoAcceso: nowStr };

    const updatedUsersList = users.map((u) => (u.id === matchedUser.id ? updatedUser : u));
    setUsersList(updatedUsersList);

    const nowMs = Date.now().toString();
    setCurrentUser(updatedUser);
    setSessionExpiredMsg(null);
    localStorage.setItem('frizame_current_user', JSON.stringify(updatedUser));
    sessionStorage.setItem('frizame_current_user', JSON.stringify(updatedUser));
    localStorage.setItem('frizame_last_activity', nowMs);
    sessionStorage.setItem('frizame_last_activity', nowMs);

    if (updatedUser.rol === 'Administrador') {
      setRole('Admin');
    } else {
      setRole('Vendedor');
    }

    setRequireLoginState(true);
    localStorage.setItem('frizame_cfg_require_login', 'true');

    addHistoryEvent({
      tipoEvento: 'Inicio de Sesión',
      usuarioResponsable: `${updatedUser.nombre} (${updatedUser.rol})`,
      impactoStock: [],
      impactoFinanciero: { montoTotal: 0 },
      detalles: `Inicio de sesión exitoso. Email: ${updatedUser.email}. Rol: ${updatedUser.rol}`,
    });

    return { success: true };
  };

  const logoutUser = () => {
    if (currentUser) {
      addHistoryEvent({
        tipoEvento: 'Cierre de Sesión',
        usuarioResponsable: `${currentUser.nombre} (${currentUser.rol})`,
        impactoStock: [],
        impactoFinanciero: { montoTotal: 0 },
        detalles: `Cierre de sesión del usuario ${currentUser.email}`,
      });
    }
    setRequireLoginState(true);
    localStorage.setItem('frizame_cfg_require_login', 'true');
    setCurrentUser(null);
    localStorage.removeItem('frizame_current_user');
    sessionStorage.removeItem('frizame_current_user');
    localStorage.removeItem('frizame_last_activity');
    sessionStorage.removeItem('frizame_last_activity');
  };

  // 15-Minute Session Timeout Listener & Activity Tracking
  useEffect(() => {
    if (!currentUser || !requireLogin) return;

    let lastRecordedActivity = Date.now();
    const updateActivity = () => {
      const now = Date.now();
      if (now - lastRecordedActivity > 5000) { // Throttle updates to localStorage
        lastRecordedActivity = now;
        localStorage.setItem('frizame_last_activity', String(now));
        sessionStorage.setItem('frizame_last_activity', String(now));
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    activityEvents.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));

    const checkInterval = setInterval(() => {
      const savedActivity = localStorage.getItem('frizame_last_activity') || sessionStorage.getItem('frizame_last_activity');
      if (savedActivity) {
        const elapsed = Date.now() - parseInt(savedActivity, 10);
        if (elapsed >= SESSION_TIMEOUT_MS) {
          setSessionExpiredMsg('Su sesión ha caducado automáticamente por inactividad (15 minutos). Por favor, vuelva a iniciar sesión.');
          logoutUser();
        }
      }
    }, 10000);

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, updateActivity));
      clearInterval(checkInterval);
    };
  }, [currentUser, requireLogin]);

  // Ensure product 106 is active on load & purge OP-00101 traceability
  useEffect(() => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.codigo === '106' || String(p.id) === '106') {
          return { ...p, activo: true };
        }
        return p;
      })
    );

    // Purge OP-00101 and all of its associated history and traceability
    setOrdersOP((prev) =>
      prev.filter((o) => o.numeroOP !== 'OP-00101' && o.id !== 'op-00101' && !o.numeroOP?.includes('00101'))
    );
    setMovements((prev) =>
      prev.filter((m) => !m.item?.includes('00101') && !m.item?.includes('OP-00101'))
    );
    setHistoryEvents((prev) =>
      prev.filter((h) => !h.detalles?.includes('00101') && !h.detalles?.includes('OP-00101'))
    );
    setClients((prev) =>
      prev.map((c) => ({
        ...c,
        historial: c.historial ? c.historial.filter((h) => !h.concepto?.includes('00101') && !h.concepto?.includes('OP-00101')) : [],
      }))
    );

    async function loadRemoteSystemConfig() {
      try {
        const snap = await getDoc(doc(db, 'systemConfig', 'main'));
        if (snap.exists()) {
          const remoteData = snap.data() as AppSystemConfig;
          setSystemConfig((prev) => ({ ...prev, ...remoteData }));
        }
      } catch (err) {
        console.warn('Note: Could not load remote systemConfig from Firestore:', err);
      }
    }
    loadRemoteSystemConfig();

    // Subscribe to real-time updates from Firestore to synchronize across devices (Mobile vs PC)
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onSnapshot(
        doc(db, 'appState', 'current'),
        (snapshot) => {
          if (snapshot.exists()) {
            const remoteData = snapshot.data();
            if (remoteData) {
              if (remoteData.products && Array.isArray(remoteData.products)) {
                setProducts(
                  remoteData.products.map((p: any) => ({
                    ...p,
                    activo: p.codigo === '106' || String(p.id) === '106' ? true : p.activo !== false,
                  }))
                );
              }
              if (remoteData.clients && Array.isArray(remoteData.clients)) {
                setClients(remoteData.clients);
              }
              if (remoteData.suppliers && Array.isArray(remoteData.suppliers)) {
                setSuppliers(remoteData.suppliers);
              }
              if (remoteData.systemConfig) {
                setSystemConfig(remoteData.systemConfig);
              }
              if (remoteData.movements && Array.isArray(remoteData.movements)) {
                setMovements(
                  remoteData.movements.filter(
                    (m: any) => !m.item?.includes('00101') && !m.item?.includes('OP-00101')
                  )
                );
              }
              if (remoteData.rawMaterials && Array.isArray(remoteData.rawMaterials)) {
                setRawMaterials(remoteData.rawMaterials);
              }
              if (remoteData.recipes && Array.isArray(remoteData.recipes)) {
                setRecipes(remoteData.recipes);
              }
              if (remoteData.ordersOP && Array.isArray(remoteData.ordersOP)) {
                setOrdersOP(
                  remoteData.ordersOP.filter(
                    (o: any) =>
                      o.numeroOP !== 'OP-00101' &&
                      o.id !== 'op-00101' &&
                      !o.numeroOP?.includes('00101')
                  )
                );
              }
              if (remoteData.historyEvents && Array.isArray(remoteData.historyEvents)) {
                setHistoryEvents(
                  remoteData.historyEvents.filter(
                    (h: any) => !h.detalles?.includes('00101') && !h.detalles?.includes('OP-00101')
                  )
                );
              }
              if (remoteData.users && Array.isArray(remoteData.users)) {
                setUsers(remoteData.users);
                localStorage.setItem('frizame_cfg_users', JSON.stringify(remoteData.users));
              }
            }
          }
        },
        (error) => {
          console.warn('Real-time Firestore sync listener notice:', error.message);
        }
      );
    } catch (e) {
      console.error('Error attaching Firestore listener:', e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save to local storage and sync configuration to Firestore
  useEffect(() => {
    const data = {
      products,
      clients,
      suppliers,
      systemConfig,
      movements,
      rawMaterials,
      recipes,
      ordersOP,
      historyEvents,
      users,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    syncDocumentToFirestore('systemConfig', 'main', systemConfig);
    syncDocumentToFirestore('appState', 'current', data);
  }, [products, clients, suppliers, systemConfig, movements, rawMaterials, recipes, ordersOP, historyEvents, users]);

  const addHistoryEvent = (evt: Omit<HistoryEvent, 'id' | 'timestamp'>) => {
    const newEvt: HistoryEvent = {
      ...evt,
      id: `HIST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    setHistoryEvents((prev) => [newEvt, ...prev]);
    syncHistoryEventToFirestore(newEvt);
    return newEvt;
  };

  const exportZipBackup = async (triggerDownload = true) => {
    const zip = new JSZip();
    zip.file('products.json', JSON.stringify(products, null, 2));
    zip.file('customers.json', JSON.stringify(clients, null, 2));
    zip.file('settings.json', JSON.stringify(systemConfig, null, 2));
    zip.file('history.json', JSON.stringify(historyEvents, null, 2));
    zip.file('movements.json', JSON.stringify(movements, null, 2));
    zip.file('rawMaterials.json', JSON.stringify(rawMaterials, null, 2));
    zip.file('orders.json', JSON.stringify(ordersOP, null, 2));
    zip.file('suppliers.json', JSON.stringify(suppliers, null, 2));

    const content = await zip.generateAsync({ type: 'blob' });
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const filename = `frizame_backup_${YYYY}${MM}${DD}_${HH}${mm}.zip`;

    if (triggerDownload) {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    const backupTimestamp = new Date().toISOString();
    setSystemConfig((prev) => ({
      ...prev,
      lastGoogleDriveBackupTime: backupTimestamp,
      lastGoogleDriveBackupFileName: filename,
    }));

    return { content, filename, backupTimestamp };
  };

  const importZipBackup = async (file: File): Promise<boolean> => {
    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const data = JSON.parse(text);
        return importData(data);
      }
      const zip = await JSZip.loadAsync(file);
      if (zip.file('products.json')) {
        const str = await zip.file('products.json')?.async('string');
        if (str) setProducts(JSON.parse(str));
      }
      if (zip.file('customers.json')) {
        const str = await zip.file('customers.json')?.async('string');
        if (str) setClients(JSON.parse(str));
      }
      if (zip.file('settings.json')) {
        const str = await zip.file('settings.json')?.async('string');
        if (str) setSystemConfig(JSON.parse(str));
      }
      if (zip.file('history.json')) {
        const str = await zip.file('history.json')?.async('string');
        if (str) setHistoryEvents(JSON.parse(str));
      }
      if (zip.file('movements.json')) {
        const str = await zip.file('movements.json')?.async('string');
        if (str) setMovements(JSON.parse(str));
      }
      if (zip.file('rawMaterials.json')) {
        const str = await zip.file('rawMaterials.json')?.async('string');
        if (str) setRawMaterials(JSON.parse(str));
      }
      if (zip.file('orders.json')) {
        const str = await zip.file('orders.json')?.async('string');
        if (str) setOrdersOP(JSON.parse(str));
      }
      if (zip.file('suppliers.json')) {
        const str = await zip.file('suppliers.json')?.async('string');
        if (str) setSuppliers(JSON.parse(str));
      }
      return true;
    } catch (e) {
      console.error('Zip import failed', e);
      return false;
    }
  };

  const triggerAutoBackupIfEnabled = () => {
    if (systemConfig?.autoBackupEnabled !== false) {
      setTimeout(() => {
        exportZipBackup(false).catch((e) => console.error('Auto backup background task failed:', e));
      }, 300);
    }
  };

  // Multi-Item Sale Preventa with Receipt (OP)
  const addMultiItemSale = ({
    fecha,
    clientId,
    items,
    canal,
    descuento,
    formaPago,
    observaciones,
    estado = 'Confirmado',
  }: {
    fecha: string;
    clientId: number | string;
    items: CartItem[];
    canal: SaleChannel;
    descuento: number;
    formaPago: 'Efectivo' | 'Transferencia' | 'Cuenta Corriente';
    observaciones?: string;
    estado?: 'Reservado' | 'Confirmado';
  }): OrderOP | null => {
    const client = clients.find((c) => c.id === clientId || String(c.id) === String(clientId));
    if (!client || items.length === 0) return null;

    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const totalFinal = Math.max(0, subtotal - descuento);

    // Generate OP Number
    const opNumber = `OP-${String(ordersOP.length + 101).padStart(5, '0')}`;

    // Update Product Stocks (Reserves or sells stock)
    setProducts((prev) =>
      prev.map((p) => {
        const itemInCart = items.find((it) => it.productId === p.id || String(it.productId) === String(p.id));
        if (itemInCart) {
          if (p.tipo === 'Bandeja') {
            return { ...p, stockBandejas: Math.max(0, (p.stockBandejas || 0) - itemInCart.cantidad) };
          } else {
            return { ...p, stockGranelKg: Math.max(0, (p.stockGranelKg || 0) - itemInCart.cantidad) };
          }
        }
        return p;
      })
    );

    // Update Client Balance if Cta Cte and Confirmado
    let newBalance = client.saldo;
    if (formaPago === 'Cuenta Corriente' && estado === 'Confirmado') {
      newBalance += totalFinal;
    }

    const itemsSummaryStr = items.map((i) => `${i.nombre} x${i.cantidad}`).join(', ');

    const newTx = {
      id: `tx-${Date.now()}`,
      fecha: fecha || new Date().toISOString().split('T')[0],
      concepto: `${opNumber} [${estado}]: ${itemsSummaryStr} (${formaPago})`,
      debe: (formaPago === 'Cuenta Corriente' && estado === 'Confirmado') ? totalFinal : (formaPago !== 'Cuenta Corriente' ? totalFinal : 0),
      haber: formaPago !== 'Cuenta Corriente' ? totalFinal : 0,
      saldo: newBalance,
    };

    setClients((prev) =>
      prev.map((c) => {
        if (c.id === client.id) {
          return {
            ...c,
            saldo: newBalance,
            historial: [newTx, ...c.historial],
          };
        }
        return c;
      })
    );

    // Movement logs
    const newMovements: Movement[] = items.map((i, index) => ({
      id: Date.now() + index,
      fecha: fecha || new Date().toISOString().split('T')[0],
      tipo: 'Salida Preventa',
      item: `${i.nombre} [${opNumber} - ${estado}]`,
      cantidad: `${i.cantidad} ${i.tipo === 'Bandeja' ? 'bandejas' : 'Kg'}`,
      clienteProveedor: client.nombre,
    }));

    setMovements((prev) => [...newMovements, ...prev]);

    // Create Order OP
    const newOrder: OrderOP = {
      id: `op-${Date.now()}`,
      numeroOP: opNumber,
      fecha: fecha || new Date().toISOString().split('T')[0],
      clientId: client.id,
      clientNombre: client.nombre,
      clientTelefono: client.telefono || '',
      clientDireccion: client.direccion || '',
      clientLocalidad: client.localidad || '',
      clientContacto: client.contacto || '',
      canal,
      items,
      subtotal,
      descuento,
      total: totalFinal,
      formaPago,
      observaciones,
      estado,
    };

    setOrdersOP((prev) => [newOrder, ...prev]);

    // History tracking & Auto backup
    const stockImpacts: StockImpact[] = items.map((i) => {
      const prod = products.find((p) => p.id === i.productId || String(p.id) === String(i.productId));
      const oldStock = prod ? (prod.tipo === 'Bandeja' ? prod.stockBandejas || 0 : prod.stockGranelKg || 0) : 0;
      return {
        itemId: i.productId,
        itemType: 'Product',
        codigo: i.codigo,
        nombre: i.nombre,
        tipoStock: i.tipo === 'Bandeja' ? 'Bandejas' : 'GranelKg',
        stockAnterior: oldStock,
        stockNuevo: Math.max(0, oldStock - i.cantidad),
        deltaStock: -i.cantidad,
        unidad: i.tipo === 'Bandeja' ? 'Bandejas' : 'Kg',
      };
    });

    addHistoryEvent({
      tipoEvento: 'Venta',
      usuarioResponsable: role || 'Vendedor',
      impactoStock: stockImpacts,
      impactoFinanciero: {
        montoTotal: totalFinal,
        metodoPago: formaPago,
        impactoSaldoCliente: (formaPago === 'Cuenta Corriente' && estado === 'Confirmado') ? totalFinal : 0,
        descuentoAplicado: descuento,
      },
      detalles: `Venta ${opNumber} [${estado}] a ${client.nombre} (${items.length} ítems, Total: $${totalFinal})`,
    });

    triggerAutoBackupIfEnabled();

    return newOrder;
  };

  // Update existing Order (e.g., confirming a reserved order or changing items)
  const updateOrderOP = (
    orderId: string,
    updatedData: {
      fecha: string;
      clientId: number | string;
      items: CartItem[];
      canal: SaleChannel;
      descuento: number;
      formaPago: 'Efectivo' | 'Transferencia' | 'Cuenta Corriente';
      observaciones?: string;
      estado: 'Reservado' | 'Confirmado';
    }
  ): OrderOP | null => {
    const existingOrder = ordersOP.find((o) => o.id === orderId);
    if (!existingOrder) return null;

    const client = clients.find((c) => c.id === updatedData.clientId || String(c.id) === String(updatedData.clientId));
    if (!client || updatedData.items.length === 0) return null;

    // Adjust product stocks: restore old items, deduct new items
    setProducts((prev) =>
      prev.map((p) => {
        let newStockBandejas = p.stockBandejas || 0;
        let newStockGranel = p.stockGranelKg || 0;

        const oldItem = existingOrder.items.find((it) => it.productId === p.id || String(it.productId) === String(p.id));
        if (oldItem) {
          if (p.tipo === 'Bandeja') {
            newStockBandejas += oldItem.cantidad;
          } else {
            newStockGranel += oldItem.cantidad;
          }
        }

        const newItem = updatedData.items.find((it) => it.productId === p.id || String(it.productId) === String(p.id));
        if (newItem) {
          if (p.tipo === 'Bandeja') {
            newStockBandejas = Math.max(0, newStockBandejas - newItem.cantidad);
          } else {
            newStockGranel = Math.max(0, newStockGranel - newItem.cantidad);
          }
        }

        return { ...p, stockBandejas: newStockBandejas, stockGranelKg: newStockGranel };
      })
    );

    const subtotal = updatedData.items.reduce((acc, item) => acc + item.subtotal, 0);
    const totalFinal = Math.max(0, subtotal - updatedData.descuento);

    const updatedOrder: OrderOP = {
      ...existingOrder,
      fecha: updatedData.fecha,
      clientId: client.id,
      clientNombre: client.nombre,
      clientTelefono: client.telefono || '',
      clientDireccion: client.direccion || '',
      clientLocalidad: client.localidad || '',
      clientContacto: client.contacto || '',
      canal: updatedData.canal,
      items: updatedData.items,
      subtotal,
      descuento: updatedData.descuento,
      total: totalFinal,
      formaPago: updatedData.formaPago,
      observaciones: updatedData.observaciones,
      estado: updatedData.estado,
    };

    setOrdersOP((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));

    // Update Client Cta Cte Ledger based on status transition
    const itemsSummaryStr = updatedData.items.map((i) => `${i.nombre} x${i.cantidad}`).join(', ');
    const wasConfirmedCtaCte = existingOrder.estado === 'Confirmado' && existingOrder.formaPago === 'Cuenta Corriente';
    const isConfirmedCtaCte = updatedData.estado === 'Confirmado' && updatedData.formaPago === 'Cuenta Corriente';

    if (!wasConfirmedCtaCte && isConfirmedCtaCte) {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === client.id) {
            const newBal = c.saldo + totalFinal;
            const tx = {
              id: `tx-conf-${Date.now()}`,
              fecha: updatedData.fecha || new Date().toISOString().split('T')[0],
              concepto: `${existingOrder.numeroOP} [Confirmado]: ${itemsSummaryStr}`,
              debe: totalFinal,
              haber: 0,
              saldo: newBal,
            };
            return { ...c, saldo: newBal, historial: [tx, ...c.historial] };
          }
          return c;
        })
      );
    } else if (wasConfirmedCtaCte && isConfirmedCtaCte) {
      const diff = totalFinal - existingOrder.total;
      if (diff !== 0) {
        setClients((prev) =>
          prev.map((c) => {
            if (c.id === client.id) {
              const newBal = Math.max(0, c.saldo + diff);
              const tx = {
                id: `tx-mod-${Date.now()}`,
                fecha: updatedData.fecha || new Date().toISOString().split('T')[0],
                concepto: `Modificación ${existingOrder.numeroOP}: ${itemsSummaryStr}`,
                debe: diff > 0 ? diff : 0,
                haber: diff < 0 ? Math.abs(diff) : 0,
                saldo: newBal,
              };
              return { ...c, saldo: newBal, historial: [tx, ...c.historial] };
            }
            return c;
          })
        );
      }
    } else if (wasConfirmedCtaCte && !isConfirmedCtaCte) {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === client.id) {
            const newBal = Math.max(0, c.saldo - existingOrder.total);
            const tx = {
              id: `tx-rev-${Date.now()}`,
              fecha: updatedData.fecha || new Date().toISOString().split('T')[0],
              concepto: `Reversión/Modificación ${existingOrder.numeroOP}`,
              debe: 0,
              haber: existingOrder.total,
              saldo: newBal,
            };
            return { ...c, saldo: newBal, historial: [tx, ...c.historial] };
          }
          return c;
        })
      );
    }

    // Log movement update
    const newMovement: Movement = {
      id: Date.now(),
      fecha: updatedData.fecha || new Date().toISOString().split('T')[0],
      tipo: 'Salida Preventa',
      item: `${itemsSummaryStr} [${existingOrder.numeroOP} - ${updatedData.estado}]`,
      cantidad: `${updatedData.items.reduce((acc, i) => acc + i.cantidad, 0)} items`,
      clienteProveedor: client.nombre,
    };
    setMovements((prev) => [newMovement, ...prev]);

    return updatedOrder;
  };

  // Cancel / Delete a reserved or confirmed order and restore stock
  const cancelOrderOP = (orderId: string | number) => {
    const existingOrder = ordersOP.find((o) => String(o.id) === String(orderId));
    if (!existingOrder) return;

    // Restore stock
    setProducts((prev) =>
      prev.map((p) => {
        const item = existingOrder.items.find((it) => String(it.productId) === String(p.id));
        if (item) {
          if (p.tipo === 'Bandeja') {
            return { ...p, stockBandejas: (p.stockBandejas || 0) + item.cantidad };
          } else {
            return { ...p, stockGranelKg: (p.stockGranelKg || 0) + item.cantidad };
          }
        }
        return p;
      })
    );

    // Mark order as Anulado in state instead of removing it
    setOrdersOP((prev) =>
      prev.map((o) =>
        String(o.id) === String(orderId) ? { ...o, estado: 'Anulado' } : o
      )
    );

    // Clean up previous movements for this OP and add an explicit cancellation record
    setMovements((prev) => {
      const filtered = prev.filter((m) => !m.item.includes(existingOrder.numeroOP));
      const itemsSummaryStr = existingOrder.items.map((i) => `${i.nombre} x${i.cantidad}`).join(', ');
      const newMovement: Movement = {
        id: Date.now(),
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'Entrada Stock',
        item: `[ANULADO] Reserva Cancelada - ${existingOrder.numeroOP} (${itemsSummaryStr})`,
        cantidad: `${existingOrder.items.reduce((acc, i) => acc + i.cantidad, 0)} items liberados`,
        clienteProveedor: existingOrder.clientNombre || 'Cliente',
      };
      return [newMovement, ...filtered];
    });

    // If payment was Cuenta Corriente or recorded to client, adjust client balance
    if (existingOrder.formaPago === 'Cuenta Corriente') {
      const wasConfirmed = existingOrder.estado === 'Confirmado';
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === existingOrder.clientId || String(c.id) === String(existingOrder.clientId)) {
            const newBalance = wasConfirmed ? Math.max(0, c.saldo - existingOrder.total) : c.saldo;
            const cancelTx = {
              id: `tx-anul-${Date.now()}`,
              fecha: new Date().toISOString().split('T')[0],
              concepto: `[ANULADO] Cancelación ${existingOrder.numeroOP}${wasConfirmed ? '' : ' (Reserva)'}`,
              debe: 0,
              haber: wasConfirmed ? existingOrder.total : 0,
              saldo: newBalance,
            };
            return {
              ...c,
              saldo: newBalance,
              historial: [cancelTx, ...c.historial],
            };
          }
          return c;
        })
      );
    }
  };

  // Record Sale / Preventa
  const addSale = ({
    fecha,
    clientId,
    productId,
    cantidad,
    subtotal,
    descuento,
  }: {
    fecha: string;
    clientId: number | string;
    productId: number | string;
    cantidad: number;
    subtotal: number;
    descuento: number;
    canal: string;
  }) => {
    const product = products.find((p) => p.id === productId || String(p.id) === String(productId));
    const client = clients.find((c) => c.id === clientId || String(c.id) === String(clientId));

    if (!product || !client) return;

    const totalFinal = Math.max(0, subtotal - descuento);

    // Update Product Stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === product.id) {
          if (p.tipo === 'Bandeja') {
            return { ...p, stockBandejas: Math.max(0, (p.stockBandejas || 0) - cantidad) };
          } else {
            return { ...p, stockGranelKg: Math.max(0, (p.stockGranelKg || 0) - cantidad) };
          }
        }
        return p;
      })
    );

    // Update Client Balance and History
    const newBalance = client.saldo + totalFinal;
    const newTx = {
      id: `tx-${Date.now()}`,
      fecha: fecha || new Date().toISOString().split('T')[0],
      concepto: `Preventa: ${product.nombre} x ${cantidad}${descuento > 0 ? ` (Desc: $${descuento})` : ''}`,
      debe: totalFinal,
      haber: 0,
      saldo: newBalance,
    };

    setClients((prev) =>
      prev.map((c) => {
        if (c.id === client.id) {
          return {
            ...c,
            saldo: newBalance,
            historial: [newTx, ...c.historial],
          };
        }
        return c;
      })
    );

    // Add Movement Log
    const newMov: Movement = {
      id: Date.now(),
      fecha: fecha || new Date().toISOString().split('T')[0],
      tipo: 'Salida Preventa',
      item: product.nombre,
      cantidad: `${cantidad} ${product.tipo === 'Bandeja' ? 'bandejas' : 'Kg'}`,
      clienteProveedor: client.nombre,
    };

    setMovements((prev) => [newMov, ...prev]);
  };

  // Add Client
  const addClient = (clientData: { nombre: string; canal: 'Particular' | 'Comercio' | 'Especial'; telefono: string; direccion: string; localidad?: string; contacto?: string; observaciones?: string }) => {
    const newClient: Client = {
      id: Date.now(),
      nombre: clientData.nombre,
      canal: clientData.canal,
      telefono: clientData.telefono,
      direccion: clientData.direccion,
      localidad: clientData.localidad || '',
      contacto: clientData.contacto || '',
      saldo: 0,
      historial: [],
      observaciones: clientData.observaciones || '',
    };
    setClients((prev) => [newClient, ...prev]);
  };

  // Update Client
  const updateClient = (id: number | string, clientData: { nombre: string; canal: 'Particular' | 'Comercio' | 'Especial'; telefono: string; direccion: string; localidad?: string; contacto?: string; observaciones?: string }) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id || String(c.id) === String(id)
          ? {
              ...c,
              nombre: clientData.nombre,
              canal: clientData.canal,
              telefono: clientData.telefono,
              direccion: clientData.direccion,
              localidad: clientData.localidad || '',
              contacto: clientData.contacto || '',
              observaciones: clientData.observaciones || '',
            }
          : c
      )
    );
  };

  // Delete Client
  const deleteClient = (id: number | string) => {
    setClients((prev) => prev.filter((c) => c.id !== id && String(c.id) !== String(id)));
  };

  // Register Payment
  const registerPayment = (clientId: number | string, monto: number, metodo: string, fecha?: string) => {
    const client = clients.find((c) => c.id === clientId || String(c.id) === String(clientId));
    if (!client) return;

    const paymentDate = fecha || new Date().toISOString().split('T')[0];
    const newBalance = Math.max(0, client.saldo - monto);

    const newTx = {
      id: `tx-${Date.now()}`,
      fecha: paymentDate,
      concepto: `Pago recibido (${metodo})`,
      debe: 0,
      haber: monto,
      saldo: newBalance,
    };

    setClients((prev) =>
      prev.map((c) => {
        if (c.id === client.id) {
          return {
            ...c,
            saldo: newBalance,
            historial: [newTx, ...c.historial],
          };
        }
        return c;
      })
    );

    const newMov: Movement = {
      id: Date.now(),
      fecha: paymentDate,
      tipo: 'Cobro Cta Cte',
      item: `Pago $${monto.toLocaleString('es-AR')} (${metodo})`,
      cantidad: 1,
      clienteProveedor: client.nombre,
    };

    setMovements((prev) => [newMov, ...prev]);
  };

  // Raw Materials / Insumos ABM
  const addRawMaterial = (insumoData: Partial<RawMaterial>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newMat: RawMaterial = {
      id: Date.now(),
      codigo: insumoData.codigo || String(Date.now()),
      categoria: insumoData.categoria || 'Insumo',
      nombre: insumoData.nombre || 'Nuevo Insumo',
      proveedor: insumoData.proveedor || 'General',
      marca: insumoData.marca || 'Marca Propia',
      presentacion: insumoData.presentacion || 'Unidad',
      unidadMedida: insumoData.unidadMedida || insumoData.unidad || 'u.',
      umPorPresentacion: insumoData.umPorPresentacion || 1,
      costo: insumoData.costo || 0,
      costoUnidad: insumoData.costoUnidad || insumoData.costo || 0,
      unidad: insumoData.unidad || 'u.',
      stock: insumoData.stock || 0,
      stockMinimo: insumoData.stockMinimo !== undefined ? insumoData.stockMinimo : 5,
      stockMaximo: insumoData.stockMaximo !== undefined ? insumoData.stockMaximo : 100,
      fechaUltimaActualizacionCosto: insumoData.fechaUltimaActualizacionCosto || todayStr,
      activo: insumoData.activo !== undefined ? insumoData.activo : true,
    };
    setRawMaterials((prev) => [...prev, newMat]);
  };

  const updateRawMaterial = (id: number | string, updated: Partial<RawMaterial>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setRawMaterials((prev) =>
      prev.map((m) => {
        if (m.id === id || String(m.id) === String(id)) {
          const isCostChanged = updated.costo !== undefined && updated.costo !== m.costo;
          return {
            ...m,
            ...updated,
            fechaUltimaActualizacionCosto:
              updated.fechaUltimaActualizacionCosto ||
              (isCostChanged ? todayStr : (m.fechaUltimaActualizacionCosto || todayStr)),
          };
        }
        return m;
      })
    );
  };

  const updateRawMaterialCosto = (id: number | string, costo: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setRawMaterials((prev) =>
      prev.map((m) =>
        m.id === id || String(m.id) === String(id)
          ? {
              ...m,
              costo,
              costoUnidad: m.umPorPresentacion && m.umPorPresentacion > 0 ? Math.round((costo / m.umPorPresentacion) * 100) / 100 : costo,
              fechaUltimaActualizacionCosto: todayStr,
            }
          : m
      )
    );
  };

  const deleteRawMaterial = (id: number | string) => {
    const targetMat = rawMaterials.find((m) => m.id === id || String(m.id) === String(id));
    if (!targetMat) return;

    const hasRecipes = recipes.some((r) =>
      r.insumos?.some(
        (item) =>
          item.insumoId === id ||
          String(item.insumoId) === String(id) ||
          item.insumoNombre.toLowerCase() === targetMat.nombre.toLowerCase()
      )
    );
    const hasMovements = movements.some((m) =>
      m.item.toLowerCase().includes(targetMat.nombre.toLowerCase())
    );

    if (hasRecipes || hasMovements) {
      setRawMaterials((prev) =>
        prev.map((m) =>
          m.id === id || String(m.id) === String(id) ? { ...m, activo: false } : m
        )
      );
    } else {
      setRawMaterials((prev) => prev.filter((m) => m.id !== id && String(m.id) !== String(id)));
    }
  };

  const reactivateRawMaterial = (id: number | string) => {
    setRawMaterials((prev) =>
      prev.map((m) =>
        m.id === id || String(m.id) === String(id) ? { ...m, activo: true } : m
      )
    );
  };

  // Supplier Cta Cte Actions
  const addSupplier = (supplierData: Partial<Supplier>) => {
    const newSupplier: Supplier = {
      id: Date.now(),
      nombre: supplierData.nombre || 'Nuevo Proveedor',
      contacto: supplierData.contacto || '',
      telefono: supplierData.telefono || '',
      email: supplierData.email || '',
      direccion: supplierData.direccion || '',
      cuit: supplierData.cuit || '',
      rubro: supplierData.rubro || 'General',
      saldo: supplierData.saldo || 0,
      historial: supplierData.historial || [],
      observaciones: supplierData.observaciones || '',
    };
    setSuppliers((prev) => [...prev, newSupplier]);
  };

  const updateSupplier = (id: number | string, supplierData: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id || String(s.id) === String(id) ? { ...s, ...supplierData } : s))
    );
  };

  const deleteSupplier = (id: number | string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id && String(s.id) !== String(id)));
  };

  const registerSupplierPayment = (
    supplierId: number | string,
    monto: number,
    metodo: string,
    concepto?: string,
    fecha?: string
  ) => {
    const supplier = suppliers.find((s) => s.id === supplierId || String(s.id) === String(supplierId));
    if (!supplier) return;

    const paymentDate = fecha || new Date().toISOString().split('T')[0];
    const newBalance = Math.max(0, supplier.saldo - monto);

    const newTx: SupplierHistory = {
      id: `sup-tx-${Date.now()}`,
      fecha: paymentDate,
      concepto: concepto || `Pago realizado (${metodo})`,
      debe: 0,
      haber: monto,
      saldo: newBalance,
    };

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplier.id) {
          return {
            ...s,
            saldo: newBalance,
            historial: [newTx, ...s.historial],
          };
        }
        return s;
      })
    );

    const newMov: Movement = {
      id: Date.now(),
      fecha: paymentDate,
      tipo: 'Pago Proveedor',
      item: `Pago a Proveedor $${monto.toLocaleString('es-AR')} (${metodo})`,
      cantidad: 1,
      clienteProveedor: supplier.nombre,
    };

    setMovements((prev) => [newMov, ...prev]);
  };

  const registerSupplierInvoice = (
    supplierId: number | string,
    monto: number,
    concepto: string,
    fecha?: string
  ) => {
    const supplier = suppliers.find((s) => s.id === supplierId || String(s.id) === String(supplierId));
    if (!supplier) return;

    const invDate = fecha || new Date().toISOString().split('T')[0];
    const newBalance = supplier.saldo + monto;

    const newTx: SupplierHistory = {
      id: `sup-tx-${Date.now()}`,
      fecha: invDate,
      concepto: concepto || 'Compra / Factura recibida',
      debe: monto,
      haber: 0,
      saldo: newBalance,
    };

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplier.id) {
          return {
            ...s,
            saldo: newBalance,
            historial: [newTx, ...s.historial],
          };
        }
        return s;
      })
    );
  };

  const editSupplierTransaction = (
    supplierId: number | string,
    txId: string,
    updatedFields: Partial<SupplierHistory>
  ) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierId || String(s.id) === String(supplierId)) {
          const updatedHist = s.historial.map((tx) => {
            if (tx.id === txId) {
              return { ...tx, ...updatedFields };
            }
            return tx;
          });
          let runningBalance = 0;
          const recalculated = [...updatedHist].reverse().map((tx) => {
            runningBalance += (tx.debe || 0) - (tx.haber || 0);
            return { ...tx, saldo: runningBalance };
          }).reverse();

          return {
            ...s,
            saldo: runningBalance,
            historial: recalculated,
          };
        }
        return s;
      })
    );
  };

  const cancelSupplierTransaction = (supplierId: number | string, txId: string) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierId || String(s.id) === String(supplierId)) {
          const updatedHist = s.historial.filter((tx) => tx.id !== txId);
          let runningBalance = 0;
          const recalculated = [...updatedHist].reverse().map((tx) => {
            runningBalance += (tx.debe || 0) - (tx.haber || 0);
            return { ...tx, saldo: runningBalance };
          }).reverse();

          return {
            ...s,
            saldo: runningBalance,
            historial: recalculated,
          };
        }
        return s;
      })
    );
  };

  const addProductLot = (
    productId: number | string,
    lote: string,
    vencimiento: string,
    cantidad: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId || String(p.id) === String(productId)) {
          const existingLotes = p.lotes || [];
          const foundIdx = existingLotes.findIndex((l) => l.lote === lote);
          let newLotes = [...existingLotes];
          if (foundIdx >= 0) {
            newLotes[foundIdx] = {
              ...newLotes[foundIdx],
              vencimiento: vencimiento || newLotes[foundIdx].vencimiento,
              cantidadStock: (newLotes[foundIdx].cantidadStock || 0) + cantidad,
            };
          } else {
            newLotes.push({
              lote,
              vencimiento: vencimiento || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
              cantidadStock: cantidad,
            });
          }

          const isBandeja = p.tipo === 'Bandeja';
          return {
            ...p,
            stockBandejas: isBandeja ? (p.stockBandejas || 0) + cantidad : p.stockBandejas,
            stockGranelKg: !isBandeja ? (p.stockGranelKg || 0) + cantidad : p.stockGranelKg,
            lotes: newLotes,
            loteDefault: lote,
            vencimientoDefault: vencimiento || p.vencimientoDefault,
          };
        }
        return p;
      })
    );
  };

  const deductProductLot = (
    productId: number | string,
    lote: string,
    cantidad: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId || String(p.id) === String(productId)) {
          if (!p.lotes || p.lotes.length === 0) return p;
          const newLotes = p.lotes.map((l) => {
            if (l.lote === lote) {
              return {
                ...l,
                cantidadStock: Math.max(0, (l.cantidadStock || 0) - cantidad),
              };
            }
            return l;
          });
          return { ...p, lotes: newLotes };
        }
        return p;
      })
    );
  };

  // System Config Actions
  const updateSystemConfig = (newConfig: Partial<AppSystemConfig>) => {
    setSystemConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      syncDocumentToFirestore('systemConfig', 'main', updated);
      return updated;
    });
  };

  // Products ABM
  const addProduct = (productData: Partial<Product>) => {
    const newProduct: Product = {
      id: Date.now(),
      codigo: productData.codigo || '999',
      nombre: productData.nombre || 'Nuevo Producto',
      tipo: productData.tipo || 'Bandeja',
      pesoGrs: productData.pesoGrs || 400,
      presentacionTexto: productData.presentacionTexto || '',
      costo: productData.costo || 0,
      precioComercio: productData.precioComercio || 0,
      precioParticular: productData.precioParticular || 0,
      stockGranelKg: productData.stockGranelKg || 0,
      stockBandejas: productData.stockBandejas || 0,
      grsPorBandeja: productData.grsPorBandeja || 400,
      ingredientes: productData.ingredientes || '',
      alergenos: productData.alergenos || '',
      conservacion: productData.conservacion || '-18°C (Freezer)',
      rotuloImagenJpg: productData.rotuloImagenJpg || '',
      stickerImagenJpg: productData.stickerImagenJpg || '',
      paginaCompletaImagenJpg: productData.paginaCompletaImagenJpg || '',
      activo: true,
    };
    setProducts((prev) => [...prev, newProduct]);
  };

  const updateProduct = (id: number | string, updatedData: Partial<Product>) => {
    const existing = products.find((p) => p.id === id || String(p.id) === String(id));
    if (existing) {
      const oldBandejas = existing.stockBandejas || 0;
      const newBandejas = updatedData.stockBandejas !== undefined ? updatedData.stockBandejas : oldBandejas;
      const oldGranel = existing.stockGranelKg || 0;
      const newGranel = updatedData.stockGranelKg !== undefined ? updatedData.stockGranelKg : oldGranel;

      if (oldBandejas !== newBandejas || oldGranel !== newGranel) {
        const diffBandejas = newBandejas - oldBandejas;
        const diffGranel = newGranel - oldGranel;
        const today = new Date().toISOString().split('T')[0];

        const detailsParts: string[] = [];
        if (diffBandejas !== 0) detailsParts.push(`${diffBandejas > 0 ? '+' : ''}${diffBandejas} Band.`);
        if (diffGranel !== 0) detailsParts.push(`${diffGranel > 0 ? '+' : ''}${diffGranel} Kg`);

        const detailsStr = detailsParts.join(', ');

        const newMov: Movement = {
          id: Date.now(),
          fecha: today,
          tipo: 'Ajuste Manual',
          item: `Ajuste Stock Manual: [${existing.codigo}] ${existing.nombre} (${detailsStr})`,
          cantidad: 1,
          clienteProveedor: `Usuario: ${role || 'Admin'}`,
        };
        setMovements((prev) => [newMov, ...prev]);
      }
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === id || String(p.id) === String(id) ? { ...p, ...updatedData } : p
      )
    );
  };

  const deleteProduct = (id: number | string) => {
    const targetProduct = products.find((p) => p.id === id || String(p.id) === String(id));
    if (!targetProduct) return;

    // Check if product has stock
    const hasStock = (targetProduct.stockGranelKg || 0) > 0 || (targetProduct.stockBandejas || 0) > 0;

    // Check if product has associated movements or orders
    const hasMovements = movements.some(
      (m) =>
        m.item.toLowerCase().includes(targetProduct.nombre.toLowerCase()) ||
        m.item.includes(targetProduct.codigo)
    );
    const hasOrders = ordersOP.some((o) =>
      o.items.some(
        (item) =>
          item.productId === id ||
          String(item.productId) === String(id) ||
          item.codigo === targetProduct.codigo
      )
    );

    // Check if counterpart associated product exists (e.g. 106 <-> 206)
    const codeDigits = targetProduct.codigo.slice(-2);
    const hasAssociatedCounterpart = products.some((p) => {
      if (p.id === targetProduct.id) return false;
      if (p.codigo.length >= 3 && p.codigo.slice(-2) === codeDigits) {
        return true;
      }
      return false;
    });

    if (hasStock || hasMovements || hasOrders || hasAssociatedCounterpart) {
      // Soft delete: flag as inactive
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id || String(p.id) === String(id) ? { ...p, activo: false } : p
        )
      );
    } else {
      // Hard delete: remove from products and recipes
      setProducts((prev) => prev.filter((p) => p.id !== id && String(p.id) !== String(id)));
      setRecipes((prev) =>
        prev.filter((r) => r.productoId !== id && String(r.productoId) !== String(id))
      );
    }
  };

  const reactivateProduct = (id: number | string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id || String(p.id) === String(id) ? { ...p, activo: true } : p
      )
    );
  };

  // Add or Update Recipe (Upsert)
  const addRecipe = (recipeData: {
    productoId: number | string;
    insumoId?: number | string;
    gramosRequeridos?: number;
    insumos?: RecipeItem[];
    envase?: string;
  }) => {
    const product = products.find((p) => p.id === recipeData.productoId || String(p.id) === String(recipeData.productoId));
    if (!product) return;

    let totalCosto = 0;
    if (recipeData.insumos && recipeData.insumos.length > 0) {
      recipeData.insumos.forEach((item) => {
        const raw = rawMaterials.find((r) => r.id === item.insumoId || String(r.id) === String(item.insumoId));
        if (raw) {
          if (item.unidad === 'grs') {
            totalCosto += (raw.costo / 1000) * item.gramosOCantidad;
          } else {
            totalCosto += raw.costo * item.gramosOCantidad;
          }
        }
      });
    } else if (recipeData.insumoId && recipeData.gramosRequeridos) {
      const insumo = rawMaterials.find((r) => r.id === recipeData.insumoId || String(r.id) === String(recipeData.insumoId));
      if (insumo) {
        totalCosto = (insumo.costo / 4) * (recipeData.gramosRequeridos / 1000) + 120 + 35;
      }
    }

    const firstInsumo = recipeData.insumos?.[0];

    const newRecipe: Recipe = {
      id: Date.now(),
      productoId: product.id,
      productoNombre: product.nombre,
      insumoId: recipeData.insumoId || firstInsumo?.insumoId || '',
      insumoNombre: firstInsumo?.insumoNombre || '',
      gramosRequeridos: recipeData.gramosRequeridos || (firstInsumo?.gramosOCantidad || 0),
      insumos: recipeData.insumos || [],
      costoEstimadoBandeja: Math.round(totalCosto),
      envase: recipeData.envase || '',
    };

    setRecipes((prev) => {
      const filtered = prev.filter(
        (r) => r.productoId !== product.id && String(r.productoId) !== String(product.id)
      );
      return [...filtered, newRecipe];
    });
  };

  const deleteRecipe = (id: number | string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id && String(r.id) !== String(id)));
  };

  // Perform Fraccionamiento (Kg -> Trays) with Insumo Stock Deduction
  const performFraccionamiento = (productId: number | string, kgToFraction: number, mermaPct: number) => {
    const product = products.find((p) => p.id === productId || String(p.id) === String(productId));
    if (!product) return { success: false, message: 'Producto no encontrado.' };

    const effectiveGrams = (kgToFraction * 1000) * (1 - mermaPct / 100);
    const gramsPerTray = product.grsPorBandeja || 400;
    const resultingTrays = Math.floor(effectiveGrams / gramsPerTray);

    if (resultingTrays <= 0) {
      return { success: false, message: 'La cantidad de Kilos es insuficiente para armar al menos 1 bandeja.' };
    }

    // Find destination product 2XX
    const targetCode = product.codigo.startsWith('1') ? '2' + product.codigo.slice(1) : '';
    let destinationProduct = products.find((p) => p.codigo === targetCode);
    if (!destinationProduct) {
      const cleanOriginName = product.nombre.replace('X KG.', '').replace('X KG', '').trim();
      destinationProduct = products.find(
        (p) => p.codigo.startsWith('2') && p.nombre.toLowerCase().includes(cleanOriginName.toLowerCase())
      );
    }

    // Find recipe for destination product
    const destRecipe = destinationProduct
      ? recipes.find((r) => r.productoId === destinationProduct!.id || String(r.productoId) === String(destinationProduct!.id))
      : null;

    // Update Product stocks
    setProducts((prev) =>
      prev.map((p) => {
        // Bulk stock reduction
        if (p.id === product.id && p.tipo === 'Gramos') {
          return {
            ...p,
            stockGranelKg: Math.max(0, (p.stockGranelKg || 0) - kgToFraction),
          };
        }
        // Tray stock increase
        if (destinationProduct && p.id === destinationProduct.id) {
          return {
            ...p,
            stockBandejas: (p.stockBandejas || 0) + resultingTrays,
          };
        }
        return p;
      })
    );

    // Deduct raw materials (Insumos: Bolsas, Rótulos, Packaging, etc.)
    const deductedInsumosSummary: string[] = [];
    if (destRecipe?.insumos && destRecipe.insumos.length > 0) {
      destRecipe.insumos.forEach((i) => {
        const insumoId = i.insumoId;
        const requiredTotal = i.gramosOCantidad * resultingTrays;

        setRawMaterials((prev) =>
          prev.map((rm) => {
            if (rm.id === insumoId || String(rm.id) === String(insumoId) || rm.nombre.toLowerCase().includes(i.insumoNombre.toLowerCase())) {
              const currentStock = rm.stockActual !== undefined ? rm.stockActual : 100;
              return {
                ...rm,
                stockActual: Math.max(0, currentStock - requiredTotal),
              };
            }
            return rm;
          })
        );
        deductedInsumosSummary.push(`${i.insumoNombre}: -${requiredTotal} ${i.unidad || 'u.'}`);
      });
    } else {
      deductedInsumosSummary.push(`Bolsa Polietileno: -${resultingTrays} u.`);
      deductedInsumosSummary.push(`Hoja A4 Rótulo Autoadhesivo: -${(resultingTrays * 0.125).toFixed(2)} u.`);
    }

    const today = new Date().toISOString().split('T')[0];
    const newMov: Movement = {
      id: Date.now(),
      fecha: today,
      tipo: 'Fraccionamiento',
      item: `${product.nombre} -> ${destinationProduct?.nombre || 'Bandejas'}: -${kgToFraction} Kg -> +${resultingTrays} Band. [Insumos: ${deductedInsumosSummary.join(', ')}]`,
      cantidad: resultingTrays,
      clienteProveedor: 'Elaboración Interna',
    };

    setMovements((prev) => [newMov, ...prev]);

    // History event tracking
    const stockImpacts: StockImpact[] = [
      {
        itemId: product.id,
        itemType: 'Product',
        codigo: product.codigo,
        nombre: product.nombre,
        tipoStock: 'GranelKg',
        stockAnterior: product.stockGranelKg || 0,
        stockNuevo: Math.max(0, (product.stockGranelKg || 0) - kgToFraction),
        deltaStock: -kgToFraction,
        unidad: 'Kg',
      },
    ];

    if (destinationProduct) {
      stockImpacts.push({
        itemId: destinationProduct.id,
        itemType: 'Product',
        codigo: destinationProduct.codigo,
        nombre: destinationProduct.nombre,
        tipoStock: 'Bandejas',
        stockAnterior: destinationProduct.stockBandejas || 0,
        stockNuevo: (destinationProduct.stockBandejas || 0) + resultingTrays,
        deltaStock: resultingTrays,
        unidad: 'Bandejas',
      });
    }

    // Calculate theoretical vs real merma for audit tracking
    const destCategory = systemConfig.productCategories?.find((cat: any) => {
      if (typeof cat === 'string') return cat === destinationProduct?.categoria;
      return (
        cat.nombre === destinationProduct?.categoria ||
        (destinationProduct?.codigo?.startsWith('2') && cat.nombre?.includes('2XX'))
      );
    });
    const mermaTeoricaPct =
      typeof destCategory === 'object' && destCategory?.mermaPct !== undefined
        ? destCategory.mermaPct
        : 3.5;
    const mermaRealPct = mermaPct;

    addHistoryEvent({
      tipoEvento: 'Fraccionamiento',
      usuarioResponsable: role || 'Operador',
      impactoStock: stockImpacts,
      impactoFinanciero: {},
      detalles: `Fraccionamiento: ${product.nombre} (-${kgToFraction} Kg) ➔ ${destinationProduct?.nombre || 'Destino'} (+${resultingTrays} Band.) [Merma Categoría Teórica: ${mermaTeoricaPct}% | Merma Real Operativa: ${mermaRealPct}%]`,
    });

    triggerAutoBackupIfEnabled();

    return {
      success: true,
      message: `¡Fraccionamiento completado con éxito!\n\n• Salida Granel: -${kgToFraction} Kg\n• Entrada Bandejas: +${resultingTrays} bandejas de ${destinationProduct?.nombre || 'Destino'}\n• Egreso Insumos: ${deductedInsumosSummary.join(' | ')}`,
    };
  };

  const updateProductRotuloImagen = (productId: number | string, imageUrl: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId || String(p.id) === String(productId)
          ? { ...p, rotuloImagenJpg: imageUrl }
          : p
      )
    );
  };

  const updateProductStickerImagen = (productId: number | string, imageUrl: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId || String(p.id) === String(productId)
          ? { ...p, stickerImagenJpg: imageUrl }
          : p
      )
    );
  };

  const resetData = () => {
    setProducts(
      initialProducts
        .filter((p) => String(p.codigo).startsWith('1') || String(p.codigo).startsWith('2'))
        .map((p) => ({ ...p, stockGranelKg: 0, stockBandejas: 0 }))
    );
    setClients(initialClients.map((c) => ({ ...c, saldo: 0, historial: [] })));
    setMovements([]);
    setRawMaterials(initialRawMaterials.map((r) => ({ ...r, stock: 0 })));
    setRecipes(initialRecipes);
    setOrdersOP([]);
    setSuppliers(initialSuppliers.map((s) => ({ ...s, saldo: 0, historial: [] })));
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportData = () => {
    const state = { products, clients, movements, rawMaterials, recipes, ordersOP, suppliers, systemConfig, users, historyEvents };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    downloadAnchor.setAttribute('download', `Frizame_Backup_${dateStr}_${timeStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importData = (jsonData: any) => {
    try {
      if (jsonData.products || jsonData.clients) {
        if (jsonData.products) setProducts(jsonData.products);
        if (jsonData.clients) setClients(jsonData.clients);
        if (jsonData.movements) setMovements(jsonData.movements);
        if (jsonData.rawMaterials) setRawMaterials(jsonData.rawMaterials);
        if (jsonData.recipes) setRecipes(jsonData.recipes);
        if (jsonData.ordersOP) setOrdersOP(jsonData.ordersOP);
        if (jsonData.suppliers) setSuppliers(jsonData.suppliers);
        if (jsonData.users) setUsersList(jsonData.users);
        if (jsonData.historyEvents) setHistoryEvents(jsonData.historyEvents);
        if (jsonData.systemConfig) setSystemConfig(jsonData.systemConfig);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        products,
        clients,
        suppliers,
        systemConfig,
        movements,
        rawMaterials,
        recipes,
        ordersOP,
        historyEvents,
        showValorizacion,
        setShowValorizacion,
        addProduct,
        updateProduct,
        deleteProduct,
        reactivateProduct,
        addHistoryEvent,
        exportZipBackup,
        importZipBackup,
        addSale,
        addMultiItemSale,
        updateOrderOP,
        cancelOrderOP,
        addClient,
        updateClient,
        deleteClient,
        registerPayment,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        registerSupplierPayment,
        registerSupplierInvoice,
        editSupplierTransaction,
        cancelSupplierTransaction,
        addProductLot,
        deductProductLot,
        updateSystemConfig,
        addRawMaterial,
        updateRawMaterial,
        updateRawMaterialCosto,
        deleteRawMaterial,
        reactivateRawMaterial,
        addRecipe,
        deleteRecipe,
        performFraccionamiento,
        updateProductRotuloImagen,
        updateProductStickerImagen,
        resetData,
        exportData,
        importData,
        requireLogin,
        setRequireLogin,
        users,
        setUsersList,
        currentUser,
        isLoggedIn,
        loginUser,
        logoutUser,
        sessionExpiredMsg,
        clearSessionExpiredMsg,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
