import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { notebookLmMarkdown } from '../data/notebookLmContent';
import {
  Settings,
  Users,
  Shield,
  Key,
  Database,
  Scale,
  Building2,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  X,
  Pencil,
  AlertTriangle,
  Ban,
  RotateCcw,
  Palette,
  BookOpen,
  Copy,
  Download,
  Sparkles,
  FileText,
} from 'lucide-react';
import { ConfirmModal } from './modals/ConfirmModal';

import { SystemUser } from '../types';

interface CategoryItem {
  id: string;
  nombre: string;
  tipo: 'Productos' | 'Materia Prima' | 'Otro';
  activo: boolean;
  mermaPct?: number;
}

const getCategoryTipoDefault = (nombre: string): 'Productos' | 'Materia Prima' | 'Otro' => {
  const lower = nombre.toLowerCase();
  if (lower.includes('insumo') || lower.includes('materia') || lower.startsWith('4')) {
    return 'Materia Prima';
  }
  if (lower.includes('marketing') || lower.includes('difus') || lower.includes('otro') || lower.startsWith('3') || lower.startsWith('5')) {
    return 'Otro';
  }
  return 'Productos';
};

export const ConfiguracionModule: React.FC = () => {
  const {
    role,
    systemConfig,
    updateSystemConfig,
    exportData,
    resetData,
    exportZipBackup,
    importZipBackup,
    products,
    rawMaterials,
    requireLogin,
    setRequireLogin,
    users,
    setUsersList,
    currentUser,
  } = useApp();

  // Category ABM state with Create, Edit, Delete, Anular (Void/Active)
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    const defaultCats = ['1XX - Granel (Kg)', '2XX - Bandeja', 'Insumo', 'Marketing', 'Otros'];
    const rawConfig = systemConfig?.productCategories || defaultCats;
    return rawConfig.map((c: any, idx: number) => {
      if (typeof c === 'string') {
        return {
          id: `cat-${idx}-${c.replace(/\s+/g, '-')}`,
          nombre: c,
          tipo: getCategoryTipoDefault(c),
          activo: true,
          mermaPct: c.includes('2XX') ? 3.5 : c.includes('1XX') ? 2.0 : 0.0,
        };
      }
      return {
        id: c.id || `cat-${idx}-${c.nombre?.replace(/\s+/g, '-')}`,
        nombre: c.nombre,
        tipo: c.tipo || getCategoryTipoDefault(c.nombre),
        activo: c.activo ?? c.activa ?? true,
        mermaPct: c.mermaPct ?? (c.nombre?.includes('2XX') ? 3.5 : c.nombre?.includes('1XX') ? 2.0 : 0.0),
      };
    });
  });

  // Sync state when systemConfig changes
  React.useEffect(() => {
    if (systemConfig?.productCategories) {
      setCategories(
        systemConfig.productCategories.map((c: any, idx: number) => {
          if (typeof c === 'string') {
            return {
              id: `cat-${idx}-${c.replace(/\s+/g, '-')}`,
              nombre: c,
              tipo: getCategoryTipoDefault(c),
              activo: true,
              mermaPct: c.includes('2XX') ? 3.5 : c.includes('1XX') ? 2.0 : 0.0,
            };
          }
          return {
            id: c.id || `cat-${idx}-${c.nombre?.replace(/\s+/g, '-')}`,
            nombre: c.nombre,
            tipo: c.tipo || getCategoryTipoDefault(c.nombre),
            activo: c.activo ?? c.activa ?? true,
            mermaPct: c.mermaPct ?? (c.nombre?.includes('2XX') ? 3.5 : c.nombre?.includes('1XX') ? 2.0 : 0.0),
          };
        })
      );
    }
  }, [systemConfig?.productCategories]);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryTipo, setNewCategoryTipo] = useState<'Productos' | 'Materia Prima' | 'Otro'>('Productos');
  const [newCategoryMermaPct, setNewCategoryMermaPct] = useState<number>(3.5);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryTipo, setEditingCategoryTipo] = useState<'Productos' | 'Materia Prima' | 'Otro'>('Productos');
  const [editingCategoryMermaPct, setEditingCategoryMermaPct] = useState<number>(3.5);

  // Google Drive & Backup state
  const [driveFolderId, setDriveFolderId] = useState(systemConfig?.googleDriveFolderId || '');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(systemConfig?.autoBackupEnabled !== false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  // Overhead Types ABM state
  const [overheadTypes, setOverheadTypes] = useState<string[]>(
    systemConfig?.overheadTypes || ['Transporte y Flete', 'Mano de Obra Directa', 'Energía y Gas', 'Packaging Adicional', 'Mermas y Mantenimiento']
  );
  const [newOverheadName, setNewOverheadName] = useState('');

  // Code Rules ABM state
  const [codeRules, setCodeRules] = useState(
    systemConfig?.codeRules || [
      { categoria: '1XX - Granel (Kg)', min: 100, max: 199, modo: 'rango' as const },
      { categoria: '2XX - Bandeja', min: 200, max: 299, modo: 'rango' as const },
      { categoria: 'Marketing', min: 300, max: 399, modo: 'rango' as const },
      { categoria: 'Insumo', min: 400, max: 499, modo: 'rango' as const },
      { categoria: 'Otros', min: 500, max: 999, modo: 'rango' as const },
    ]
  );

  // General Confirmation Modals
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmAction({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  // Category Handlers with Confirm Modal
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCatRequiresValidation, setNewCatRequiresValidation] = useState(false);
  const [categoryBlockedMessage, setCategoryBlockedMessage] = useState<string | null>(null);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const catName = newCategoryName.trim();
    if (categories.some((c) => c.nombre.toLowerCase() === catName.toLowerCase())) {
      setCategoryBlockedMessage(`Ya existe una categoría llamada "${catName}". Por favor elija un nombre único.`);
      return;
    }

    const updated: CategoryItem[] = [
      ...categories,
      { id: `cat-${Date.now()}`, nombre: catName, tipo: newCategoryTipo, activo: true, mermaPct: newCategoryMermaPct },
    ];
    setCategories(updated);

    let updatedRules = [...codeRules];
    if (!codeRules.some((r) => r.categoria === catName)) {
      updatedRules.push({
        categoria: catName,
        min: 100,
        max: 999,
        modo: newCatRequiresValidation ? ('rango' as const) : ('libre' as const),
      });
      setCodeRules(updatedRules);
    }

    updateSystemConfig({
      productCategories: updated,
      codeRules: updatedRules,
    });

    setNewCategoryName('');
    setNewCategoryTipo('Productos');
    setNewCategoryMermaPct(3.5);
    setNewCatRequiresValidation(false);
    setIsNewCategoryModalOpen(false);
  };

  const handleStartEditCategory = (cat: CategoryItem) => {
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.nombre);
    setEditingCategoryTipo(cat.tipo || getCategoryTipoDefault(cat.nombre));
    setEditingCategoryMermaPct(cat.mermaPct ?? 3.5);
  };

  const handleSaveEditCategory = (id: string) => {
    if (!editingCategoryName.trim()) return;
    const oldCat = categories.find((c) => c.id === id);
    const newName = editingCategoryName.trim();

    triggerConfirm(
      'Confirmar Edición de Categoría',
      `¿Desea cambiar la categoría a "${newName}" [${editingCategoryTipo}] con Merma ${editingCategoryMermaPct}%?`,
      () => {
        const updated = categories.map((c) =>
          c.id === id ? { ...c, nombre: newName, tipo: editingCategoryTipo, mermaPct: editingCategoryMermaPct } : c
        );
        setCategories(updated);

        let updatedRules = [...codeRules];
        if (oldCat) {
          updatedRules = codeRules.map((r) => (r.categoria === oldCat.nombre ? { ...r, categoria: newName } : r));
          setCodeRules(updatedRules);
        }

        updateSystemConfig({
          productCategories: updated,
          codeRules: updatedRules,
        });

        setEditingCategoryId(null);
      }
    );
  };

  const handleToggleAnularCategory = (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;
    const newStatus = !target.activo;

    const countProd = products.filter(
      (p) => p.tipo === target.nombre || p.categoria === target.nombre
    ).length;

    const warningDetail = countProd > 0 ? ` Contiene ${countProd} producto(s) asignados en el sistema.` : '';

    triggerConfirm(
      newStatus ? 'Reactivar Categoría' : 'Anular Categoría',
      `¿Está seguro de ${newStatus ? 'reactivar' : 'anular'} la categoría "${target.nombre}"?${warningDetail}`,
      () => {
        const updated = categories.map((c) => (c.id === id ? { ...c, activo: newStatus } : c));
        setCategories(updated);
        updateSystemConfig({ productCategories: updated });
      }
    );
  };

  const handleRemoveCategory = (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;

    // Direct data dependencies: Products or Raw Materials explicitly assigned to this category
    const associatedProducts = products.filter(
      (p) => p.tipo === target.nombre || p.categoria === target.nombre
    );

    const associatedInsumos = rawMaterials.filter(
      (m) => m.categoria === target.nombre
    );

    if (associatedProducts.length > 0 || associatedInsumos.length > 0) {
      const details: string[] = [];
      if (associatedProducts.length > 0) details.push(`${associatedProducts.length} producto(s)`);
      if (associatedInsumos.length > 0) details.push(`${associatedInsumos.length} insumo(s)`);

      setCategoryBlockedMessage(
        `No es posible eliminar la categoría "${target.nombre}" porque tiene elementos directamente asignados: ${details.join(' y ')}. Para preservar la trazabilidad, sólo se permite eliminar categorías sin productos o insumos vinculados. Si desea inhabilitarla, puede anularla.`
      );
      return;
    }

    triggerConfirm(
      'Confirmar Eliminación de Categoría',
      `¿Está seguro de eliminar definitivamente la categoría "${target.nombre}"? Esta acción no se puede deshacer.`,
      () => {
        const updated = categories.filter((c) => c.id !== id);
        setCategories(updated);

        // Remove from code rules if present
        const updatedRules = codeRules.filter((r) => r.categoria !== target.nombre);
        setCodeRules(updatedRules);

        updateSystemConfig({
          productCategories: updated,
          codeRules: updatedRules,
        });
      }
    );
  };

  // Overhead Handlers
  const handleAddOverhead = () => {
    if (!newOverheadName.trim()) return;
    const name = newOverheadName.trim();
    if (overheadTypes.includes(name)) return;

    triggerConfirm(
      'Confirmar Concepto de Costo',
      `¿Desea agregar el concepto "${name}" al desglose de costos?`,
      () => {
        const updated = [...overheadTypes, name];
        setOverheadTypes(updated);
        updateSystemConfig({ overheadTypes: updated });
        setNewOverheadName('');
      }
    );
  };

  const handleRemoveOverhead = (oh: string) => {
    triggerConfirm(
      'Eliminar Concepto de Costo',
      `¿Desea eliminar el concepto "${oh}" del desglose de costos?`,
      () => {
        const updated = overheadTypes.filter((o) => o !== oh);
        setOverheadTypes(updated);
        updateSystemConfig({ overheadTypes: updated });
      }
    );
  };

  const handleSaveCodeRules = () => {
    triggerConfirm(
      'Guardar Reglas de Validación de Códigos',
      '¿Desea actualizar los rangos y condiciones de validación para los códigos de productos?',
      () => {
        updateSystemConfig({ codeRules });
        setSavedParamsMessage(true);
        setTimeout(() => setSavedParamsMessage(false), 3000);
      }
    );
  };

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);

  const handleExecuteResetWithPassword = () => {
    const validPasswords = ['frizame2026', 'admin', 'admin123', systemConfig?.adminPassword].filter(Boolean);
    const pwd = adminPasswordInput.trim();

    if (!pwd) {
      setAdminPasswordError('Ingrese la contraseña de Administrador.');
      return;
    }

    if (validPasswords.includes(pwd)) {
      resetData();
      setIsResetConfirmOpen(false);
      setAdminPasswordInput('');
      setAdminPasswordError('');
      setBackupMsg('¡Base de datos restablecida con éxito a valores iniciales de fábrica!');
      setTimeout(() => setBackupMsg(null), 4000);
    } else {
      setAdminPasswordError('Contraseña de Administrador incorrecta. Acción denegada por seguridad.');
    }
  };

  const [newNombre, setNewNombre] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewUserPass, setShowNewUserPass] = useState(false);
  const [newRol, setNewRol] = useState<'Administrador' | 'Vendedor'>('Vendedor');
  const [showAddUser, setShowAddUser] = useState(false);

  // Edit user state
  const [userToEdit, setUserToEdit] = useState<SystemUser | null>(null);
  const [editUserNombre, setEditUserNombre] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [showEditUserPass, setShowEditUserPass] = useState(false);
  const [editUserRol, setEditUserRol] = useState<'Administrador' | 'Vendedor'>('Vendedor');
  const [editUserActivo, setEditUserActivo] = useState(true);

  // Table password visibility state
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const handleOpenEditUser = (u: SystemUser) => {
    if (role === 'Vendedor' && u.rol === 'Administrador') {
      return;
    }
    setUserToEdit(u);
    setEditUserNombre(u.nombre);
    setEditUserPassword(u.password || 'frizame2026');
    setShowEditUserPass(false);
    setEditUserRol(u.rol === 'Administrador' ? 'Administrador' : 'Vendedor');
    setEditUserActivo(u.activo);
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    if (role === 'Vendedor' && (userToEdit.rol === 'Administrador' || editUserRol === 'Administrador')) {
      return;
    }

    triggerConfirm(
      'Actualizar Datos de Usuario',
      `¿Desea guardar los cambios para el usuario ${userToEdit.email}?`,
      () => {
        const updated = users.map((u) => {
          if (u.id === userToEdit.id) {
            return {
              ...u,
              nombre: editUserNombre.trim(),
              password: editUserPassword.trim(),
              rol: editUserRol,
              activo: editUserActivo,
            };
          }
          return u;
        });
        setUsersList(updated);
        setUserToEdit(null);
        setBackupMsg('¡Usuario actualizado exitosamente!');
        setTimeout(() => setBackupMsg(null), 3000);
      }
    );
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passSavedMessage, setPassSavedMessage] = useState(false);

  const [mermaDefaultPct, setMermaDefaultPct] = useState<number>(5);
  const [margenComercioDefault, setMargenComercioDefault] = useState<number>(35);
  const [margenParticularDefault, setMargenParticularDefault] = useState<number>(50);
  const [diasAlertaDesactualizacion, setDiasAlertaDesactualizacion] = useState<number>(
    systemConfig?.diasAlertaDesactualizacionCosto || 30
  );
  const [savedParamsMessage, setSavedParamsMessage] = useState(false);

  const saveRequireLogin = (val: boolean) => {
    triggerConfirm(
      'Cambiar Configuración de Login',
      `¿Desea ${val ? 'activar' : 'desactivar'} la pantalla de Login con Usuario & Contraseña al iniciar o actualizar la aplicación?`,
      () => {
        setRequireLogin(val);
        setBackupMsg(
          val
            ? '¡Pantalla de Login ACTIVADA! Al actualizar o ingresar al sistema se requerirá correo electrónico y contraseña.'
            : 'Pantalla de Login desactivada.'
        );
        setTimeout(() => setBackupMsg(null), 4000);
      }
    );
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim() || !newEmail.trim() || !newUserPassword.trim()) return;

    triggerConfirm(
      'Confirmar Registro de Usuario',
      `¿Desea registrar al usuario ${newNombre} (${newRol}) con la contraseña especificada?`,
      () => {
        const newUser: SystemUser = {
          id: `usr-${Date.now()}`,
          nombre: newNombre.trim(),
          email: newEmail.trim(),
          password: newUserPassword.trim(),
          rol: newRol,
          activo: true,
          ultimoAcceso: 'Pendiente activación',
        };

        const updated = [...users, newUser];
        setUsersList(updated);

        setNewNombre('');
        setNewEmail('');
        setNewUserPassword('');
        setShowAddUser(false);
      }
    );
  };

  const handleToggleUserStatus = (id: string) => {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    if (role === 'Vendedor' && u.rol === 'Administrador') return;

    triggerConfirm(
      'Cambio de Estado de Usuario',
      `¿Desea ${u.activo ? 'desactivar' : 'activar'} la cuenta de ${u.nombre}?`,
      () => {
        const updated = users.map((x) => (x.id === id ? { ...x, activo: !x.activo } : x));
        setUsersList(updated);
      }
    );
  };

  const handleDeleteUserConfirm = () => {
    if (!userToDelete) return;
    if (role === 'Vendedor' && userToDelete.rol === 'Administrador') return;
    const updated = users.filter((u) => u.id !== userToDelete.id);
    setUsersList(updated);
    setUserToDelete(null);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;

    triggerConfirm(
      'Confirmar Cambio de Contraseña',
      '¿Está seguro de actualizar la clave de administrador?',
      () => {
        const updatedUsers = users.map((u) => {
          if (u.rol === 'Administrador' || u.id === 'usr-1') {
            return { ...u, password: newPassword.trim() };
          }
          return u;
        });
        setUsersList(updatedUsers);
        updateSystemConfig({ adminPassword: newPassword.trim() });
        setPassSavedMessage(true);
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setPassSavedMessage(false), 3000);
      }
    );
  };

  const handleSaveParameters = (e: React.FormEvent) => {
    e.preventDefault();
    triggerConfirm(
      'Guardar Parámetros de Sistema',
      '¿Desea actualizar los márgenes sugeridos, mermas por defecto y días de alerta de desactualización?',
      () => {
        updateSystemConfig({
          margenComercioSugerido: margenComercioDefault,
          margenParticularSugerido: margenParticularDefault,
          diasAlertaDesactualizacionCosto: diasAlertaDesactualizacion,
        });
        setSavedParamsMessage(true);
        setTimeout(() => setSavedParamsMessage(false), 3000);
      }
    );
  };

  const [activeSubTab, setActiveSubTab] = useState<'categorias' | 'parametros' | 'usuarios' | 'sistema' | 'colorimetria' | 'notebooklm'>(
    role === 'Vendedor' ? 'usuarios' : 'categorias'
  );

  React.useEffect(() => {
    if (role === 'Vendedor' && activeSubTab !== 'usuarios' && activeSubTab !== 'colorimetria') {
      setActiveSubTab('usuarios');
    }
  }, [role, activeSubTab]);

  // Colorimetría state
  const [selectedTheme, setSelectedTheme] = useState<'classic' | 'sapphire' | 'emerald' | 'sunset' | 'dark'>(
    systemConfig?.themePalette || 'classic'
  );
  const [savedThemeMsg, setSavedThemeMsg] = useState(false);

  const handleSaveTheme = (themeKey: 'classic' | 'sapphire' | 'emerald' | 'sunset' | 'dark') => {
    setSelectedTheme(themeKey);
    updateSystemConfig({ themePalette: themeKey });
    setSavedThemeMsg(true);
    setTimeout(() => setSavedThemeMsg(false), 3000);
  };

  // NotebookLM state
  const [copiedNotebookMsg, setCopiedNotebookMsg] = useState(false);

  const handleCopyNotebookLM = () => {
    navigator.clipboard.writeText(notebookLmMarkdown);
    setCopiedNotebookMsg(true);
    setTimeout(() => setCopiedNotebookMsg(false), 3000);
  };

  const handleDownloadNotebookLMDoc = () => {
    const blob = new Blob([notebookLmMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'NotebookLM_Frizame_Dossier.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="border-b border-[#D1E3EB] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-brand font-bold text-2xl text-[#0B4F6C] flex items-center gap-2">
            <Settings className="w-7 h-7 text-[#017E9A]" />
            6. Configuración General del Sistema Y Seguridad
          </h2>
          <p className="text-sm text-[#607D8B]">
            Administración de usuarios, roles, ABM de categorías de productos, validación de códigos y parámetros de costos.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#E8F4F8] px-3.5 py-1.5 rounded-xl border border-[#D1E3EB]">
          <Shield className="w-5 h-5 text-[#017E9A]" />
          <span className="text-xs font-bold text-[#0B4F6C]">
            Nivel de Acceso: {role === 'Admin' ? 'Administrador Principal' : 'Vendedor / Operador'}
          </span>
        </div>
      </div>

      {/* Internal Sub-Tabs Navigation for Reduced Vertical Scrolling */}
      <div className="flex flex-wrap gap-2 border-b border-[#D1E3EB] pb-3 bg-[#F4F8FA] p-2 rounded-xl border">
        {role === 'Admin' && (
          <>
            <button
              onClick={() => setActiveSubTab('categorias')}
              className={`py-2 px-4 rounded-lg font-brand font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                activeSubTab === 'categorias'
                  ? 'bg-[#0B4F6C] text-white shadow-sm'
                  : 'bg-white text-[#0B4F6C] hover:bg-[#E8F4F8] border border-[#D1E3EB]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>1. Categorías y Rangos de Código</span>
            </button>

            <button
              onClick={() => setActiveSubTab('parametros')}
              className={`py-2 px-4 rounded-lg font-brand font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                activeSubTab === 'parametros'
                  ? 'bg-[#0B4F6C] text-white shadow-sm'
                  : 'bg-white text-[#0B4F6C] hover:bg-[#E8F4F8] border border-[#D1E3EB]'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>2. Parámetros y Sobrecostos</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveSubTab('usuarios')}
          className={`py-2 px-4 rounded-lg font-brand font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            activeSubTab === 'usuarios'
              ? 'bg-[#0B4F6C] text-white shadow-sm'
              : 'bg-white text-[#0B4F6C] hover:bg-[#E8F4F8] border border-[#D1E3EB]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>3. Usuarios y Permisos</span>
        </button>

        {role === 'Admin' && (
          <button
            onClick={() => setActiveSubTab('sistema')}
            className={`py-2 px-4 rounded-lg font-brand font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeSubTab === 'sistema'
                ? 'bg-[#0B4F6C] text-white shadow-sm'
                : 'bg-white text-[#0B4F6C] hover:bg-[#E8F4F8] border border-[#D1E3EB]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>4. Base de Datos y Sistema</span>
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('colorimetria')}
          className={`py-2 px-4 rounded-lg font-brand font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
            activeSubTab === 'colorimetria'
              ? 'bg-[#0B4F6C] text-white shadow-sm'
              : 'bg-white text-[#0B4F6C] hover:bg-[#E8F4F8] border border-[#D1E3EB]'
          }`}
        >
          <Palette className="w-4 h-4 text-purple-500" />
          <span>5. Colorimetría y Temas</span>
        </button>

        {role === 'Admin' && (
          <button
            onClick={() => setActiveSubTab('notebooklm')}
            className={`py-2 px-4 rounded-lg font-brand font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeSubTab === 'notebooklm'
                ? 'bg-[#0B4F6C] text-white shadow-sm'
                : 'bg-white text-[#0B4F6C] hover:bg-[#E8F4F8] border border-[#D1E3EB]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>6. Cuaderno NotebookLM / Docs</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: Categorías y Rangos de Código */}
      {activeSubTab === 'categorias' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn items-start">
          {/* Column 1: Product Categories ABM */}
          <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-[#E8F4F8] px-5 py-3 border-b border-[#D1E3EB] flex justify-between items-center">
              <h3 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#017E9A]" />
                ABM de Categorías de Productos
              </h3>
            </div>

            <div className="p-4 space-y-4 text-xs md:text-sm flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-3">
                  Permite <strong>Crear, Editar, Anular y Eliminar</strong> categorías de productos en todo el sistema.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Escriba nueva categoría..."
                    className="flex-1 p-2 border border-[#D1E3EB] rounded-lg bg-white text-xs font-semibold"
                  />
                  <select
                    value={newCategoryTipo}
                    onChange={(e) => setNewCategoryTipo(e.target.value as 'Productos' | 'Materia Prima' | 'Otro')}
                    className="p-2 border border-[#D1E3EB] rounded-lg bg-white text-xs font-bold text-[#0B4F6C]"
                  >
                    <option value="Productos">Productos</option>
                    <option value="Materia Prima">Materia Prima</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <div className="flex items-center gap-1 bg-white px-2 py-1 border border-[#D1E3EB] rounded-lg shrink-0">
                    <span className="text-[11px] text-gray-500 font-semibold">% Merma:</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={newCategoryMermaPct}
                      onChange={(e) => setNewCategoryMermaPct(parseFloat(e.target.value) || 0)}
                      className="w-14 p-1 text-xs font-bold border border-gray-200 rounded text-center"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-1.5 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-bold rounded-lg flex items-center justify-center gap-1 transition-colors text-xs shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const isEditing = editingCategoryId === cat.id;

                    return (
                      <div
                        key={cat.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          !cat.activo
                            ? 'bg-gray-100 border-gray-300 opacity-60'
                            : 'bg-[#F4F8FA] border-[#D1E3EB]'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editingCategoryName}
                              onChange={(e) => setEditingCategoryName(e.target.value)}
                              className="p-1 border border-[#017E9A] rounded-lg bg-white font-bold text-xs flex-1"
                            />
                            <select
                              value={editingCategoryTipo}
                              onChange={(e) => setEditingCategoryTipo(e.target.value as 'Productos' | 'Materia Prima' | 'Otro')}
                              className="p-1 border border-[#017E9A] rounded-lg bg-white font-semibold text-xs"
                            >
                              <option value="Productos">Productos</option>
                              <option value="Materia Prima">Materia Prima</option>
                              <option value="Otro">Otro</option>
                            </select>
                            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 border border-[#017E9A] rounded">
                              <span className="text-[10px] text-gray-500 font-bold">% Merma:</span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="50"
                                value={editingCategoryMermaPct}
                                onChange={(e) => setEditingCategoryMermaPct(parseFloat(e.target.value) || 0)}
                                className="w-12 text-xs font-bold text-center"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleSaveEditCategory(cat.id)}
                                className="px-2 py-1 bg-emerald-600 text-white rounded font-bold text-xs"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => setEditingCategoryId(null)}
                                className="px-2 py-1 bg-gray-300 text-gray-700 rounded font-bold text-xs"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className={`font-brand font-bold text-xs ${!cat.activo ? 'line-through text-gray-500' : 'text-[#0B4F6C]'}`}>
                              {cat.nombre}
                            </strong>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                cat.tipo === 'Materia Prima'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : cat.tipo === 'Otro'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {cat.tipo}
                            </span>
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                              Merma: {cat.mermaPct ?? 0}%
                            </span>
                            {!cat.activo && (
                              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                Anulada
                              </span>
                            )}
                          </div>
                        )}

                        {!isEditing && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditCategory(cat)}
                              className="p-1 text-[#017E9A] hover:bg-[#E8F4F8] rounded"
                              title="Editar nombre"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAnularCategory(cat.id)}
                              className={`p-1 rounded ${cat.activo ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                              title={cat.activo ? 'Anular Categoría' : 'Reactivar Categoría'}
                            >
                              {cat.activo ? <Ban className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(cat.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              title="Eliminar Categoría"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Code Validation Rules ABM */}
          <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-[#E8F4F8] px-5 py-3 border-b border-[#D1E3EB]">
              <h3 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2">
                <Check className="w-5 h-5 text-[#017E9A]" />
                Reglas de Validación de Códigos
              </h3>
            </div>

            <div className="p-4 space-y-4 text-xs md:text-sm flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-3">
                  Restringe y valida que los códigos cumplan los parámetros por categoría.
                </p>

                <div className="overflow-x-auto border border-[#D1E3EB] rounded-lg mb-3">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#E8F4F8] text-[#0B4F6C] font-brand border-b border-[#D1E3EB]">
                        <th className="p-2">Categoría</th>
                        <th className="p-2">Modo</th>
                        <th className="p-2">Mín</th>
                        <th className="p-2">Máx</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D1E3EB]">
                      {codeRules.map((rule, idx) => (
                        <tr key={idx} className="hover:bg-[#E8F4F8]/40">
                          <td className="p-2 font-bold text-gray-800">{rule.categoria}</td>
                          <td className="p-2">
                            <select
                              value={rule.modo}
                              onChange={(e) => {
                                const newRules = [...codeRules];
                                newRules[idx].modo = e.target.value as any;
                                setCodeRules(newRules);
                              }}
                              className="p-1 border border-[#D1E3EB] rounded bg-white text-xs font-semibold"
                            >
                              <option value="rango">Entre (Rango)</option>
                              <option value="mayor">Mayor (&gt;)</option>
                              <option value="menor">Menor (&lt;)</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={rule.min}
                              onChange={(e) => {
                                const newRules = [...codeRules];
                                newRules[idx].min = parseInt(e.target.value) || 0;
                                setCodeRules(newRules);
                              }}
                              className="w-16 p-1 border border-[#D1E3EB] rounded bg-white font-mono text-center font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={rule.max}
                              onChange={(e) => {
                                const newRules = [...codeRules];
                                newRules[idx].max = parseInt(e.target.value) || 0;
                                setCodeRules(newRules);
                              }}
                              className="w-16 p-1 border border-[#D1E3EB] rounded bg-white font-mono text-center font-bold"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[#D1E3EB]">
                <button
                  type="button"
                  onClick={handleSaveCodeRules}
                  className="px-4 py-2 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Reglas de Códigos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Parámetros y Sobrecostos */}
      {activeSubTab === 'parametros' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn items-start">
          {/* Column 1: Parameters, Margins & Cost Outdated Thresholds */}
          <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-[#E8F4F8] px-5 py-3 border-b border-[#D1E3EB]">
              <h3 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#017E9A]" />
                Parámetros Globales y Alertas
              </h3>
            </div>

            <form onSubmit={handleSaveParameters} className="p-4 space-y-3.5 text-xs md:text-sm flex-1 flex flex-col justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    % Merma Operativa Sugerida
                  </label>
                  <input
                    type="number"
                    value={mermaDefaultPct}
                    onChange={(e) => setMermaDefaultPct(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-[#D1E3EB] rounded-lg font-bold text-gray-800"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Por defecto en fraccionamiento.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Días Alerta Desactualización
                  </label>
                  <input
                    type="number"
                    value={diasAlertaDesactualizacion}
                    onChange={(e) => setDiasAlertaDesactualizacion(parseInt(e.target.value) || 30)}
                    className="w-full p-2 border border-[#D1E3EB] rounded-lg font-bold text-red-700"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Alerta roja si excede días.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    % Margen Sugerido (Comercio)
                  </label>
                  <input
                    type="number"
                    value={margenComercioDefault}
                    onChange={(e) => setMargenComercioDefault(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-[#D1E3EB] rounded-lg font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    % Margen Sugerido (Particular)
                  </label>
                  <input
                    type="number"
                    value={margenParticularDefault}
                    onChange={(e) => setMargenParticularDefault(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-[#D1E3EB] rounded-lg font-bold text-emerald-700"
                  />
                </div>
              </div>

              {savedParamsMessage && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>¡Parámetros guardados con éxito!</span>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-[#D1E3EB]">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-2xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Parámetros</span>
                </button>
              </div>
            </form>
          </div>

          {/* Overhead Concepts ABM */}
          <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden">
            <div className="bg-[#E8F4F8] px-5 py-3 border-b border-[#D1E3EB]">
              <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#017E9A]" />
                ABM de Conceptos Adicionales de Costo (Flete, Mano de Obra, Gas)
              </h3>
            </div>

            <div className="p-5 space-y-4 text-xs md:text-sm">
              <p className="text-xs text-gray-600">
                Agregue conceptos configurables para sumar al desglose de costo de cada receta (ej: Transporte, Flete, Mano de Obra, Gas, Electricidad, Packaging).
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOverheadName}
                  onChange={(e) => setNewOverheadName(e.target.value)}
                  placeholder="Ej: Flete y Logística Refrigerada..."
                  className="flex-1 p-2 border border-[#D1E3EB] rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddOverhead}
                  className="px-4 py-2 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-bold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Concepto</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {overheadTypes.map((oh) => (
                  <div
                    key={oh}
                    className="bg-[#F4F8FA] p-2.5 rounded-xl border border-[#D1E3EB] flex items-center justify-between font-semibold text-gray-800"
                  >
                    <span>{oh}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOverhead(oh)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Quitar concepto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Usuarios y Permisos */}
      {activeSubTab === 'usuarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: User Management */}
            <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden">
              <div className="bg-[#E8F4F8] px-5 py-3 border-b border-[#D1E3EB] flex justify-between items-center">
                <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#017E9A]" />
                  Usuarios, Perfiles y Roles de Acceso
                </h3>
                <button
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="px-3 py-1 bg-[#017E9A] hover:bg-[#016278] text-white font-brand text-xs rounded-lg font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Usuario</span>
                </button>
              </div>

              <div className="p-5 space-y-4">
                {showAddUser && (
                  <form
                    onSubmit={handleAddUser}
                    className="bg-[#F4F8FA] p-4 rounded-xl border border-[#D1E3EB] space-y-3 animate-fadeIn text-xs"
                  >
                    <h4 className="font-brand font-bold text-[#0B4F6C]">
                      Registrar Nuevo Usuario en el Sistema
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          required
                          value={newNombre}
                          onChange={(e) => setNewNombre(e.target.value)}
                          placeholder="Ej: Carlos Rossi"
                          className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Email / Usuario</label>
                        <input
                          type="email"
                          required
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="carlos@frizame.com"
                          className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Contraseña Requerida</label>
                        <div className="relative">
                          <input
                            type={showNewUserPass ? 'text' : 'password'}
                            required
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="Clave (ej: frizame2026)"
                            className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white font-mono pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewUserPass(!showNewUserPass)}
                            className="absolute right-2 top-2 text-gray-400 hover:text-gray-700"
                            title={showNewUserPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showNewUserPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Rol / Permisos</label>
                        <select
                          value={newRol}
                          onChange={(e) => setNewRol(e.target.value as any)}
                          className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white font-semibold"
                        >
                          {role === 'Admin' && <option value="Administrador">Administrador (Acceso Total)</option>}
                          <option value="Vendedor">Vendedor (Preventas/Clientes)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddUser(false)}
                        className="px-3 py-1.5 border border-[#D1E3EB] rounded-lg text-gray-600 hover:bg-gray-100"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#0B4F6C] text-white rounded-lg font-bold hover:bg-[#083b52]"
                      >
                        Guardar Usuario
                      </button>
                    </div>
                  </form>
                )}

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#E8F4F8] text-[#0B4F6C] font-brand border-b border-[#D1E3EB]">
                        <th className="p-2.5">Usuario / Email</th>
                        <th className="p-2.5">Rol / Permiso</th>
                        <th className="p-2.5">Contraseña</th>
                        <th className="p-2.5">Último Acceso</th>
                        <th className="p-2.5">Estado</th>
                        <th className="p-2.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D1E3EB]">
                      {users
                        .filter((u) => {
                          if (role === 'Vendedor') {
                            return u.rol !== 'Administrador';
                          }
                          return true;
                        })
                        .map((u) => (
                        <tr key={u.id} className="hover:bg-[#E8F4F8]/40 transition-colors">
                          <td className="p-2.5">
                            <strong className="text-gray-800 block text-sm">{u.nombre}</strong>
                            <span className="text-gray-500 font-mono text-[11px]">{u.email}</span>
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                u.rol === 'Administrador'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {u.rol}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-gray-700">
                            <div className="flex items-center gap-1.5">
                              <span>{role === 'Admin' && visiblePasswords[u.id] ? (u.password || 'frizame2026') : '••••••••'}</span>
                              {role === 'Admin' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVisiblePasswords((prev) => ({
                                      ...prev,
                                      [u.id]: !prev[u.id],
                                    }))
                                  }
                                  className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                                  title={visiblePasswords[u.id] ? 'Ocultar clave' : 'Mostrar clave'}
                                >
                                  {visiblePasswords[u.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 text-gray-600">{u.ultimoAcceso}</td>
                          <td className="p-2.5">
                            <button
                              onClick={() => handleToggleUserStatus(u.id)}
                              className={`px-2 py-0.5 rounded-full font-semibold transition-colors ${
                                u.activo
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {u.activo ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 text-[#017E9A] hover:text-[#016278] hover:bg-[#E8F4F8] rounded transition-colors"
                                title="Editar Nombre, Clave o Rol"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setUserToDelete(u)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar Usuario"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#E8F4F8] p-4 rounded-xl border border-[#D1E3EB] flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-brand font-bold text-sm text-[#0B4F6C] flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-[#017E9A]" />
                      <span>Pantalla de Login con Usuario &amp; Contraseña</span>
                    </span>
                    <p className="text-xs text-gray-600">
                      Al activar esta opción, el sistema requerirá autenticación mediante usuario y clave antes de ingresar al panel.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={requireLogin}
                      onChange={(e) => saveRequireLogin(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#017E9A]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Section 3: Change Admin Password */}
            <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden">
              <div className="bg-[#E8F4F8] px-5 py-3 border-b border-[#D1E3EB]">
                <h3 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#017E9A]" />
                  Cambiar Contraseña Administrador
                </h3>
              </div>

              <form onSubmit={handleChangePassword} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Contraseña Actual</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2.5 border border-[#D1E3EB] rounded-lg pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-800"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Nueva Contraseña</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full p-2.5 border border-[#D1E3EB] rounded-lg"
                  />
                </div>

                {passSavedMessage && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Contraseña actualizada correctamente.</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Lock className="w-4 h-4" />
                  <span>Actualizar Clave</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Base de Datos y Sistema */}
      {activeSubTab === 'sistema' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* Business Data & Headers */}
          <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden">
            <div className="bg-[#E8F4F8] px-5 py-3 border-b border-[#D1E3EB]">
              <h3 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#017E9A]" />
                Datos de la Empresa &amp; RNE / RNPA
              </h3>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-0.5">Razón Social / Nombre Fantasía</label>
                <input
                  type="text"
                  defaultValue="Frizame - Congelados Premium"
                  className="w-full p-2 border border-[#D1E3EB] rounded-lg font-bold text-[#0B4F6C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-0.5">RNE (Establecimiento)</label>
                  <input
                    type="text"
                    defaultValue="02-034.567"
                    className="w-full p-2 border border-[#D1E3EB] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-0.5">RNPA (Producto Base)</label>
                  <input
                    type="text"
                    defaultValue="02-589.123"
                    className="w-full p-2 border border-[#D1E3EB] rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-0.5">Dirección Planta / Local</label>
                <input
                  type="text"
                  defaultValue="Av. Rondeau 1024, CABA"
                  className="w-full p-2 border border-[#D1E3EB] rounded-lg text-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Google Drive Auto Backup Configuration */}
          <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden md:col-span-2">
            <div className="bg-[#E8F4F8] px-5 py-3 border-b border-[#D1E3EB] flex justify-between items-center">
              <h3 className="font-brand font-bold text-base text-[#0B4F6C] flex items-center gap-2">
                <Database className="w-5 h-5 text-[#017E9A]" />
                Persistencia Automática en Google Drive & Respaldo ZIP Auditoría
              </h3>
              <span className="text-xs bg-[#017E9A]/10 text-[#017E9A] font-bold px-2.5 py-1 rounded-full border border-[#017E9A]/20">
                Respaldo Histórico Auditable
              </span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {backupMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{backupMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="block font-bold text-gray-700">
                    Google Drive Folder ID
                  </label>
                  <p className="text-[11px] text-gray-500">
                    ID de la carpeta en Google Drive donde se alojarán los respaldos automáticos en formato .ZIP (ej: <code>1A2b3C4d5E6f7G8h9I0J</code>).
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={driveFolderId}
                      onChange={(e) => setDriveFolderId(e.target.value)}
                      placeholder="Ingrese ID de Carpeta de Google Drive"
                      className="flex-1 p-2.5 border border-[#D1E3EB] rounded-lg font-mono text-xs bg-white text-[#0B4F6C] font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        updateSystemConfig({
                          googleDriveFolderId: driveFolderId.trim(),
                          autoBackupEnabled,
                        });
                        setBackupMsg('Configuración de Google Drive guardada correctamente.');
                        setTimeout(() => setBackupMsg(null), 3500);
                      }}
                      className="px-4 py-2 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-bold rounded-lg transition-colors shrink-0"
                    >
                      Guardar ID
                    </button>
                  </div>
                </div>

                <div className="bg-[#F4F8FA] p-3.5 rounded-xl border border-[#D1E3EB] flex flex-col justify-between">
                  <div>
                    <label className="font-bold text-[#0B4F6C] block mb-1">
                      Respaldos Automáticos (.ZIP)
                    </label>
                    <p className="text-[11px] text-gray-600">
                      Genera backup .zip automático al registrar Ventas o Fraccionamientos.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={autoBackupEnabled}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setAutoBackupEnabled(val);
                        updateSystemConfig({ autoBackupEnabled: val });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#017E9A]"></div>
                    <span className="ml-2 font-semibold text-[#0B4F6C]">
                      {autoBackupEnabled ? 'Activado' : 'Desactivado'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Manual Backup & Import ZIP */}
              <div className="pt-3 border-t border-[#D1E3EB] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const filename = await exportZipBackup(true);
                    setBackupMsg(`¡Backup ZIP descargado con éxito! (${filename})`);
                    setTimeout(() => setBackupMsg(null), 4000);
                  }}
                  className="py-2.5 px-3 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs text-xs"
                >
                  <Download className="w-4 h-4 text-sky-300" />
                  <span>Descargar Backup .ZIP (frizame_backup_...)</span>
                </button>

                <label className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-brand font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer text-center">
                  <Database className="w-4 h-4 text-emerald-300" />
                  <span>Restaurar Desde Archivo .ZIP</span>
                  <input
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const ok = await importZipBackup(file);
                      if (ok) {
                        setBackupMsg('¡Restauración desde paquete .ZIP completada con éxito!');
                      } else {
                        alert('Error al procesar el archivo .ZIP de respaldo.');
                      }
                      setTimeout(() => setBackupMsg(null), 4000);
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={exportData}
                  className="py-2.5 px-3 bg-slate-700 hover:bg-slate-800 text-white font-brand font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs"
                >
                  <FileText className="w-4 h-4 text-slate-300" />
                  <span>Exportar JSON Simple</span>
                </button>
              </div>
            </div>
          </div>

          {/* Database Maintenance */}
          <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden md:col-span-2">
            <div className="bg-red-50 px-5 py-3 border-b border-red-200">
              <h3 className="font-brand font-bold text-base text-red-800 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-red-600" />
                Zona de Restablecimiento del Sistema
              </h3>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-gray-600">
                Restablezca la base de datos completa a los datos iniciales de fábrica. Esta acción destruirá todas las transacciones recientes a menos que tenga un respaldo descargado.
              </p>

              <div>
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="py-2.5 px-5 bg-red-100 hover:bg-red-200 text-red-800 font-brand font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs"
                >
                  <RefreshCw className="w-4 h-4 text-red-600" />
                  <span>Restablecer Datos Iniciales de Fábrica</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: Colorimetría y Temas Visuales */}
      {activeSubTab === 'colorimetria' && (
        <div className="space-y-6 animate-fadeIn">
          {savedThemeMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>¡Tema y paleta de colores aplicados con éxito en todo el sistema!</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden p-5">
            <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2 mb-2">
              <Palette className="w-5 h-5 text-purple-600" />
              Selección de Paleta de Colores y Estilo Visual
            </h3>
            <p className="text-xs text-gray-600 mb-6">
              Seleccione la combinación cromática preferida para la interfaz del sistema Frizame.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Palette 1: Classic Ocean Teal */}
              <div
                onClick={() => handleSaveTheme('classic')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedTheme === 'classic'
                    ? 'border-[#017E9A] bg-[#E8F4F8] shadow-md ring-2 ring-[#017E9A]/30'
                    : 'border-[#D1E3EB] bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-brand font-bold text-sm text-[#0B4F6C]">Ocean Teal (Clásico)</span>
                  {selectedTheme === 'classic' && <Check className="w-4 h-4 text-[#017E9A]" />}
                </div>
                <div className="flex gap-1.5 h-6 rounded-lg overflow-hidden border border-gray-200">
                  <div className="w-1/3 bg-[#0B4F6C]" />
                  <div className="w-1/3 bg-[#017E9A]" />
                  <div className="w-1/3 bg-[#E8F4F8]" />
                </div>
              </div>

              {/* Palette 2: Deep Sapphire */}
              <div
                onClick={() => handleSaveTheme('sapphire')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedTheme === 'sapphire'
                    ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-500/30'
                    : 'border-[#D1E3EB] bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-brand font-bold text-sm text-indigo-900">Zafiro Profundo</span>
                  {selectedTheme === 'sapphire' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <div className="flex gap-1.5 h-6 rounded-lg overflow-hidden border border-gray-200">
                  <div className="w-1/3 bg-[#0A2540]" />
                  <div className="w-1/3 bg-[#635BFF]" />
                  <div className="w-1/3 bg-indigo-50" />
                </div>
              </div>

              {/* Palette 3: Sunset Emerald */}
              <div
                onClick={() => handleSaveTheme('emerald')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedTheme === 'emerald'
                    ? 'border-emerald-600 bg-emerald-50 shadow-md ring-2 ring-emerald-500/30'
                    : 'border-[#D1E3EB] bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-brand font-bold text-sm text-emerald-900">Esmeralda Frescura</span>
                  {selectedTheme === 'emerald' && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <div className="flex gap-1.5 h-6 rounded-lg overflow-hidden border border-gray-200">
                  <div className="w-1/3 bg-[#064E3B]" />
                  <div className="w-1/3 bg-[#10B981]" />
                  <div className="w-1/3 bg-emerald-50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: Cuaderno NotebookLM / Documentación */}
      {activeSubTab === 'notebooklm' && (
        <div className="space-y-6 animate-fadeIn">
          {copiedNotebookMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>¡Texto del cuaderno copiado al portapapeles! Listo para pegar en Google NotebookLM.</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#E8F4F8] p-4 rounded-xl border border-[#D1E3EB]">
              <div>
                <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#017E9A]" />
                  Cuaderno de Conocimiento para NotebookLM
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Toda la arquitectura, reglas de negocio, esquemas de datos y manuales consolidados en un documento Markdown.
                </p>
              </div>

              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={handleCopyNotebookLM}
                  className="px-3.5 py-2 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar Texto</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadNotebookLMDoc}
                  className="px-3.5 py-2 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar .md</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner">
              {notebookLmMarkdown}
            </div>
          </div>
        </div>
      )}

      {/* Global Confirmation Modal for Configurations */}
      <ConfirmModal
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          confirmAction.onConfirm();
          setConfirmAction((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmAction.title}
        message={confirmAction.message}
        confirmText="Sí, Confirmar Acción"
      />

      {/* Confirm Modal for Delete User */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUserConfirm}
        title="Eliminar Usuario del Sistema"
        message={
          <p>
            ¿Está seguro de eliminar al usuario <strong>{userToDelete?.nombre}</strong> ({userToDelete?.email})? Perderá el acceso al panel.
          </p>
        }
        confirmText="Sí, Eliminar Usuario"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Edit User Modal */}
      {userToEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-[#D1E3EB]">
            <div className="flex justify-between items-center border-b border-[#D1E3EB] pb-3">
              <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[#017E9A]" />
                <span>Editar Datos de Usuario</span>
              </h3>
              <button
                onClick={() => setUserToEdit(null)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editUserNombre}
                  onChange={(e) => setEditUserNombre(e.target.value)}
                  className="w-full p-2.5 border border-[#D1E3EB] rounded-lg bg-white font-medium text-gray-800 focus:outline-none focus:border-[#017E9A]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-500 mb-1 flex items-center justify-between">
                  <span>Correo Electrónico (Email / ID)</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                    Solo Lectura (Inmutable)
                  </span>
                </label>
                <input
                  type="email"
                  disabled
                  readOnly
                  value={userToEdit.email}
                  className="w-full p-2.5 border border-[#D1E3EB] rounded-lg bg-gray-100 text-gray-500 font-mono cursor-not-allowed select-none"
                  title="El correo electrónico del usuario no se puede modificar por seguridad"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Contraseña Requerida</label>
                <div className="relative">
                  <input
                    type={showEditUserPass ? 'text' : 'password'}
                    required
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    className="w-full p-2.5 border border-[#D1E3EB] rounded-lg bg-white font-mono font-bold text-gray-800 focus:outline-none focus:border-[#017E9A] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditUserPass(!showEditUserPass)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
                    title={showEditUserPass ? 'Ocultar clave' : 'Mostrar clave'}
                  >
                    {showEditUserPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Rol / Nivel de Permiso</label>
                <select
                  value={editUserRol}
                  onChange={(e) => setEditUserRol(e.target.value as any)}
                  className="w-full p-2.5 border border-[#D1E3EB] rounded-lg bg-white font-bold text-gray-800 focus:outline-none focus:border-[#017E9A]"
                >
                  {role === 'Admin' && <option value="Administrador">Administrador (Acceso Total)</option>}
                  <option value="Vendedor">Vendedor (Preventas/Clientes)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-edit-activo"
                  checked={editUserActivo}
                  onChange={(e) => setEditUserActivo(e.target.checked)}
                  className="w-4 h-4 text-[#017E9A] rounded border-[#D1E3EB]"
                />
                <label htmlFor="chk-edit-activo" className="font-bold text-gray-800 cursor-pointer">
                  Cuenta de usuario activa (Permitir acceso al sistema)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#D1E3EB]">
                <button
                  type="button"
                  onClick={() => setUserToEdit(null)}
                  className="px-4 py-2 border border-[#D1E3EB] rounded-lg font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B4F6C] hover:bg-[#083b52] text-white rounded-lg font-brand font-bold shadow transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Alert for Category Deletion or Name Conflict Blocked */}
      <ConfirmModal
        isOpen={!!categoryBlockedMessage}
        onClose={() => setCategoryBlockedMessage(null)}
        onConfirm={() => setCategoryBlockedMessage(null)}
        title="Operación de Categoría Restringida"
        message={<p className="text-gray-700 font-medium">{categoryBlockedMessage}</p>}
        confirmText="Entendido"
        cancelText="Cerrar"
        variant="warning"
      />

      {/* Secured Admin Password Verification Modal for Reset Database */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-red-700">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-brand font-bold text-lg text-red-900">
                  Restablecer Datos de Fábrica
                </h3>
                <p className="text-xs text-red-700 font-medium">
                  Validación de Seguridad de Administrador
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              ¿Está seguro de restablecer la base de datos a los valores de fábrica? Se perderán las ventas, fraccionamientos y modificaciones locales no respaldadas.
            </p>

            <div className="space-y-2 bg-red-50/60 p-3.5 rounded-xl border border-red-200">
              <label className="block text-xs font-bold text-red-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-red-600" />
                  Contraseña Administrador:
                </span>
                <span className="text-[10px] text-red-700 font-mono">Clave: frizame2026</span>
              </label>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => {
                  setAdminPasswordInput(e.target.value);
                  setAdminPasswordError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleExecuteResetWithPassword();
                }}
                placeholder="Ingrese contraseña de admin (ej: frizame2026)"
                className="w-full p-2.5 border border-red-300 rounded-lg text-xs font-bold font-mono text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                autoFocus
              />
              {adminPasswordError && (
                <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{adminPasswordError}</span>
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  setAdminPasswordInput('');
                  setAdminPasswordError('');
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
              >
                Cancelar / Volver
              </button>
              <button
                type="button"
                onClick={handleExecuteResetWithPassword}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-brand font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Confirmar Restablecimiento</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
