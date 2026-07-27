import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Check, Building2 } from 'lucide-react';
import { Supplier } from '../../types';

interface NuevoProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit?: Supplier | null;
}

export const NuevoProveedorModal: React.FC<NuevoProveedorModalProps> = ({
  isOpen,
  onClose,
  supplierToEdit,
}) => {
  const { addSupplier, updateSupplier } = useApp();

  const [nombre, setNombre] = useState('');
  const [rubro, setRubro] = useState('General');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [cuit, setCuit] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (supplierToEdit) {
        setNombre(supplierToEdit.nombre || '');
        setRubro(supplierToEdit.rubro || 'General');
        setContacto(supplierToEdit.contacto || '');
        setTelefono(supplierToEdit.telefono || '');
        setEmail(supplierToEdit.email || '');
        setDireccion(supplierToEdit.direccion || '');
        setCuit(supplierToEdit.cuit || '');
        setObservaciones(supplierToEdit.observaciones || '');
      } else {
        setNombre('');
        setRubro('General');
        setContacto('');
        setTelefono('');
        setEmail('');
        setDireccion('');
        setCuit('');
        setObservaciones('');
      }
    }
  }, [isOpen, supplierToEdit]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const payload: Partial<Supplier> = {
      nombre: nombre.trim(),
      rubro,
      contacto: contacto.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      direccion: direccion.trim(),
      cuit: cuit.trim(),
      observaciones: observaciones.trim(),
    };

    if (supplierToEdit) {
      updateSupplier(supplierToEdit.id, payload);
    } else {
      addSupplier(payload);
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
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-[#D1E3EB] animate-fadeIn"
      >
        <div className="bg-[#E8F4F8] px-5 py-3.5 border-b border-[#D1E3EB] flex justify-between items-center">
          <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#017E9A]" />
            {supplierToEdit ? `Editar Proveedor: ${supplierToEdit.nombre}` : 'Nuevo Proveedor en Agenda'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs md:text-sm">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Razón Social / Nombre</label>
            <input
              type="text"
              required
              placeholder="Ej: Grangys / Ártico S.A."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-2 border border-[#D1E3EB] rounded-lg focus:outline-none focus:border-[#017E9A] font-bold text-[#0B4F6C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Rubro / Canal</label>
              <select
                value={rubro}
                onChange={(e) => setRubro(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white font-semibold"
              >
                <option value="Rebozadores y Congelados">Rebozadores y Congelados</option>
                <option value="Lácteos y Quesos">Lácteos y Quesos</option>
                <option value="Harinas y Derivados">Harinas y Derivados</option>
                <option value="Bolsas y Packaging">Bolsas y Packaging</option>
                <option value="Especies y Condimentos">Especies y Condimentos</option>
                <option value="Logística / Flete">Logística / Flete</option>
                <option value="General">General / Otros</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">CUIT / Identificación</label>
              <input
                type="text"
                placeholder="Ej: 30-71122334-9"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Teléfono / WhatsApp</label>
              <input
                type="text"
                placeholder="Ej: 1144556677"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Contacto Principal</label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                placeholder="ventas@proveedor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Dirección / Depósito</label>
              <input
                type="text"
                placeholder="Ej: Av. Crovara 1200, La Matanza"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Observaciones</label>
            <textarea
              rows={2}
              placeholder="Notas comerciales, condiciones de pago..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full p-2 border border-[#D1E3EB] rounded-lg text-xs"
            />
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
              className="px-5 py-2 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{supplierToEdit ? 'Actualizar Proveedor' : 'Guardar Proveedor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
