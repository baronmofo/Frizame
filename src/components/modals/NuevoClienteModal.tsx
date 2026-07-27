import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserPlus, UserCheck, X, Check } from 'lucide-react';
import { Client } from '../../types';

interface NuevoClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
}

export const NuevoClienteModal: React.FC<NuevoClienteModalProps> = ({
  isOpen,
  onClose,
  clientToEdit,
}) => {
  const { addClient, updateClient } = useApp();

  const [nombre, setNombre] = useState('');
  const [canal, setCanal] = useState<'Particular' | 'Comercio' | 'Especial'>('Particular');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (clientToEdit) {
      setNombre(clientToEdit.nombre || '');
      setCanal(clientToEdit.canal || 'Particular');
      setTelefono(clientToEdit.telefono || '');
      setDireccion(clientToEdit.direccion || '');
      setObservaciones(clientToEdit.observaciones || '');
    } else {
      setNombre('');
      setCanal('Particular');
      setTelefono('');
      setDireccion('');
      setObservaciones('');
    }
  }, [clientToEdit, isOpen]);

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

    if (clientToEdit) {
      updateClient(clientToEdit.id, {
        nombre,
        canal,
        telefono,
        direccion,
        observaciones,
      });
    } else {
      addClient({
        nombre,
        canal,
        telefono,
        direccion,
        observaciones,
      });
    }

    setNombre('');
    setTelefono('');
    setDireccion('');
    setObservaciones('');
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0B4F6C]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-[#D1E3EB] animate-fadeIn"
      >
        <div className="bg-[#E8F4F8] px-5 py-3.5 border-b border-[#D1E3EB] flex justify-between items-center">
          <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
            {clientToEdit ? (
              <>
                <UserCheck className="w-5 h-5 text-[#017E9A]" />
                Editar Datos de Cliente
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 text-[#017E9A]" />
                Dar de Alta Nuevo Cliente
              </>
            )}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs md:text-sm">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Nombre o Razón Social
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Restaurante El Faro"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-2 border border-[#D1E3EB] rounded-lg focus:outline-none focus:border-[#017E9A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Canal de Venta
              </label>
              <select
                value={canal}
                onChange={(e) =>
                  setCanal(e.target.value as 'Particular' | 'Comercio' | 'Especial')
                }
                className="w-full p-2 border border-[#D1E3EB] rounded-lg bg-white focus:outline-none focus:border-[#017E9A]"
              >
                <option value="Particular">Particular</option>
                <option value="Comercio">Comercio</option>
                <option value="Especial">Especial</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                placeholder="11 4589-1234"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full p-2 border border-[#D1E3EB] rounded-lg focus:outline-none focus:border-[#017E9A]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Dirección de Entrega
            </label>
            <input
              type="text"
              placeholder="Av. Costanera 1420"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full p-2 border border-[#D1E3EB] rounded-lg focus:outline-none focus:border-[#017E9A]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Observaciones Internas
            </label>
            <textarea
              rows={3}
              placeholder="Notas de entrega, preferencias de horario, requerimientos especiales..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full p-2 border border-[#D1E3EB] rounded-lg focus:outline-none focus:border-[#017E9A] text-xs resize-none"
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
              className="px-5 py-2 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{clientToEdit ? 'Actualizar Cliente' : 'Guardar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
