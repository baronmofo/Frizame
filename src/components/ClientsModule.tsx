import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ConfirmModal } from './modals/ConfirmModal';
import {
  Users,
  UserPlus,
  Search,
  Receipt,
  QrCode,
  HandCoins,
  X,
  Upload,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  MessageCircle,
  ArrowUpDown,
  FileText,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Client } from '../types';

interface ClientsModuleProps {
  selectedClientId: number | string | null;
  setSelectedClientId: (id: number | string | null) => void;
  openNuevoClienteModal: () => void;
  onEditClient?: (client: Client) => void;
  openRegistrarPagoModal: (clientId: number | string) => void;
}

type SortField = 'nombre' | 'canal' | 'telefono' | 'saldo';

export const ClientsModule: React.FC<ClientsModuleProps> = ({
  selectedClientId,
  setSelectedClientId,
  openNuevoClienteModal,
  onEditClient,
  openRegistrarPagoModal,
}) => {
  const { clients, deleteClient } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSaldos, setShowSaldos] = useState(false);
  const [showQrBox, setShowQrBox] = useState(false);
  const [qrCanvasUrl, setQrCanvasUrl] = useState<string>('');
  const [customQrImage, setCustomQrImage] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('nombre');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredClients = clients
    .filter((c) => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const selectedClient =
    clients.find(
      (c) => c.id === selectedClientId || String(c.id) === String(selectedClientId)
    ) || clients[0];

  const generateMpQr = async () => {
    if (!selectedClient) return;

    if (showQrBox) {
      setShowQrBox(false);
      return;
    }

    try {
      const montoCobro = selectedClient.saldo > 0 ? selectedClient.saldo : 0;
      const payload = `https://mpago.la/pos?monto=${montoCobro}&ref=${encodeURIComponent(
        selectedClient.nombre
      )}`;
      const url = await QRCode.toDataURL(payload, { width: 180, margin: 1 });
      setQrCanvasUrl(url);
      setShowQrBox(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomQrImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#D1E3EB] pb-4">
        <div>
          <h2 className="font-brand font-bold text-2xl text-[#0B4F6C] flex items-center gap-2">
            <Users className="w-7 h-7 text-[#017E9A]" />
            Agenda de Clientes / Cuentas Corrientes
          </h2>
          <p className="text-sm text-[#607D8B]">
            Gestión de compradores, historial de pedidos, saldos pendientes y cobro mediante Código QR de Mercado Pago.
          </p>
        </div>

        <button
          onClick={openNuevoClienteModal}
          className="px-4 py-2 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand font-medium rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients List Card */}
        <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden flex flex-col h-[580px]">
          <div className="bg-[#E8F4F8] px-5 py-3 border-b border-[#D1E3EB] flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#017E9A]" />
                Clientes Registrados
              </h3>
              <button
                onClick={() => setShowSaldos(!showSaldos)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0B4F6C] rounded-lg border border-[#D1E3EB] transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs"
                title="Mostrar u ocultar saldos"
              >
                {showSaldos ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-[#017E9A]" />}
                <span>{showSaldos ? 'Ocultar Saldos' : 'Ver Saldos'}</span>
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative w-full sm:w-44">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white text-xs border border-[#D1E3EB] rounded-lg focus:outline-none focus:border-[#017E9A]"
              />
            </div>
          </div>

          <div className="p-3 overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left text-xs md:text-sm border-collapse">
              <thead className="sticky top-0 bg-[#E8F4F8] z-10">
                <tr className="text-[#0B4F6C] font-brand border-b border-[#D1E3EB]">
                  <th
                    onClick={() => handleSort('nombre')}
                    className="p-2.5 cursor-pointer hover:bg-[#d5e8f0] transition-colors"
                  >
                    <div className="flex items-center gap-1 font-bold">
                      <span>Cliente</span>
                      <ArrowUpDown className="w-3 h-3 text-gray-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('canal')}
                    className="p-2.5 cursor-pointer hover:bg-[#d5e8f0] transition-colors"
                  >
                    <div className="flex items-center gap-1 font-bold">
                      <span>Canal</span>
                      <ArrowUpDown className="w-3 h-3 text-gray-500" />
                    </div>
                  </th>
                  <th className="p-2.5 font-bold">Teléfono</th>
                  <th
                    onClick={() => handleSort('saldo')}
                    className="p-2.5 cursor-pointer hover:bg-[#d5e8f0] transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1 font-bold">
                      <span>Saldo</span>
                      <ArrowUpDown className="w-3 h-3 text-gray-500" />
                    </div>
                  </th>
                  <th className="p-2.5 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1E3EB]">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      No se encontraron clientes.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((c) => {
                    const isSelected = selectedClient && selectedClient.id === c.id;
                    const isPaid = c.saldo <= 0;
                    const cleanPhone = c.telefono ? c.telefono.replace(/[^0-9]/g, '') : '';

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedClientId(c.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#E8F4F8] border-l-4 border-l-[#017E9A]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="p-2.5">
                          <strong className="text-gray-800 block">{c.nombre}</strong>
                          <small className="text-gray-500 text-[11px] block">
                            {c.direccion ? `${c.direccion}${c.localidad ? `, ${c.localidad}` : ''}` : 'Sin dirección'}
                          </small>
                          {c.contacto && (
                            <small className="text-gray-400 text-[10px] block italic">Contacto: {c.contacto}</small>
                          )}
                        </td>
                        <td className="p-2.5">
                          <span className="bg-[#E8F4F8] text-[#0B4F6C] px-2 py-0.5 rounded text-[11px] font-semibold border border-[#D1E3EB]">
                            {c.canal}
                          </span>
                        </td>
                        <td className="p-2.5 text-xs text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <span>{c.telefono || '-'}</span>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-all shadow-xs"
                                title={`Escribir por WhatsApp a ${c.nombre}`}
                              >
                                <MessageCircle className="w-3 h-3 fill-current text-white" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 font-bold text-right">
                          <span className={isPaid ? 'text-emerald-600' : 'text-amber-600'}>
                            {showSaldos
                              ? `$${c.saldo.toLocaleString('es-AR')}`
                              : '••••••••'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {onEditClient && (
                              <button
                                onClick={() => onEditClient(c)}
                                className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 transition-colors"
                                title="Editar cliente"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setClientToDelete(c)}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200 transition-colors"
                              title="Eliminar cliente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Client Ledger & MP QR Card */}
        <div className="bg-white rounded-xl border border-[#D1E3EB] shadow-sm overflow-hidden flex flex-col h-[580px]">
          <div className="bg-[#E8F4F8] px-5 py-3 border-b border-[#D1E3EB] flex items-center justify-between shrink-0">
            <h3 className="font-brand font-bold text-lg text-[#0B4F6C] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#017E9A]" />
              Cuenta Corriente:{' '}
              <span className="text-[#017E9A] underline">
                {selectedClient ? selectedClient.nombre : 'Seleccionar cliente'}
              </span>
            </h3>

            {selectedClient && onEditClient && (
              <button
                onClick={() => onEditClient(selectedClient)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0B4F6C] rounded-lg border border-[#D1E3EB] transition-colors text-xs font-bold flex items-center gap-1"
              >
                <Pencil className="w-3.5 h-3.5 text-[#017E9A]" />
                <span>Editar</span>
              </button>
            )}
          </div>

          <div className="p-5 space-y-6 flex-1 overflow-y-auto">
            {selectedClient ? (
              <>
                {/* Balance Summary Header */}
                <div className="bg-[#F4F8FA] p-4 rounded-xl border border-[#D1E3EB] flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 block">Saldo Pendiente Actual:</span>
                    <h2
                      className={`font-brand font-bold text-2xl ${
                        selectedClient.saldo <= 0 ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {showSaldos
                        ? `$${selectedClient.saldo.toLocaleString('es-AR')}`
                        : '••••••••'}
                    </h2>
                    <span
                      className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        selectedClient.saldo <= 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedClient.saldo <= 0 ? 'Al Día ($0)' : 'Saldo Pendiente'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={generateMpQr}
                      className="px-3 py-1.5 bg-[#017E9A] hover:bg-[#016278] text-white font-brand font-medium rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QR MP</span>
                    </button>

                    <button
                      onClick={() => openRegistrarPagoModal(selectedClient.id)}
                      className="px-3 py-1.5 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand font-medium rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <HandCoins className="w-4 h-4" />
                      <span>Registrar Pago</span>
                    </button>
                  </div>
                </div>

                {/* Delivery Address, Localidad & Contact Person */}
                <div className="bg-[#F4F8FA] border border-[#D1E3EB] p-3 rounded-xl text-xs text-gray-700 space-y-1">
                  <div>
                    <span className="font-bold text-[#0B4F6C]">Dirección de Entrega: </span>
                    <span>{selectedClient.direccion ? `${selectedClient.direccion}${selectedClient.localidad ? `, ${selectedClient.localidad}` : ''}` : 'No registrada'}</span>
                  </div>
                  {selectedClient.contacto && (
                    <div>
                      <span className="font-bold text-[#0B4F6C]">Persona de Contacto: </span>
                      <span>{selectedClient.contacto}</span>
                    </div>
                  )}
                </div>

                {/* Internal Observations if available */}
                {selectedClient.observaciones && (
                  <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 font-brand flex items-start gap-2">
                    <FileText className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Observaciones Internas:</strong> {selectedClient.observaciones}
                    </div>
                  </div>
                )}

                {/* MP QR Box Overlay/Card */}
                {showQrBox && (
                  <div className="bg-[#E8F4F8] border-2 border-[#017E9A] rounded-xl p-4 relative animate-fadeIn space-y-3">
                    <button
                      onClick={() => setShowQrBox(false)}
                      className="absolute top-2.5 right-2.5 p-1 text-gray-500 hover:text-gray-800"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="text-center space-y-2">
                      <h4 className="font-brand font-bold text-[#0B4F6C] flex items-center justify-center gap-2">
                        <QrCode className="w-5 h-5 text-[#017E9A]" />
                        Cobro Express Mercado Pago
                      </h4>
                      <p className="text-xs text-gray-600">
                        Escanea con Mercado Pago para abonar el saldo adeudado:
                      </p>

                      <div className="flex justify-center my-2">
                        {customQrImage ? (
                          <img
                            src={customQrImage}
                            alt="Mercado Pago QR Oficial"
                            className="w-36 h-36 object-contain border rounded p-1 bg-white shadow-sm"
                          />
                        ) : qrCanvasUrl ? (
                          <img
                            src={qrCanvasUrl}
                            alt="Generado QR"
                            className="w-36 h-36 border rounded p-1 bg-white shadow-sm"
                          />
                        ) : null}
                      </div>

                      <h3 className="font-brand font-bold text-xl text-[#0B4F6C]">
                        ${selectedClient.saldo.toLocaleString('es-AR')}
                      </h3>
                      <small className="text-[11px] text-gray-500 block">
                        Asociado a la cuenta oficial de Frizame
                      </small>

                      <label className="inline-flex items-center gap-1.5 text-xs text-[#017E9A] hover:underline cursor-pointer mt-2">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Imagen de QR Oficial MP</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCustomQrUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Ledger Movements Table */}
                <div>
                  <h4 className="font-brand font-bold text-sm text-[#0B4F6C] mb-2">
                    Historial de Movimientos (Debe / Haber)
                  </h4>
                  <div className="overflow-x-auto border border-[#D1E3EB] rounded-lg max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-[#E8F4F8] z-10">
                        <tr className="text-[#0B4F6C] font-brand border-b border-[#D1E3EB]">
                          <th className="p-2">Fecha</th>
                          <th className="p-2">Concepto</th>
                          <th className="p-2">Debe</th>
                          <th className="p-2">Haber</th>
                          <th className="p-2">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D1E3EB]">
                        {selectedClient.historial.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-3 text-center text-gray-500">
                              Sin movimientos registrados para este cliente.
                            </td>
                          </tr>
                        ) : (
                          selectedClient.historial.map((h, i) => (
                            <tr key={h.id || i} className="hover:bg-gray-50">
                              <td className="p-2 text-gray-600">{h.fecha}</td>
                              <td className="p-2 font-medium text-gray-800">{h.concepto}</td>
                              <td className="p-2 font-bold text-amber-600">
                                {h.debe > 0 ? `$${h.debe.toLocaleString('es-AR')}` : '-'}
                              </td>
                              <td className="p-2 font-bold text-emerald-600">
                                {h.haber > 0 ? `$${h.haber.toLocaleString('es-AR')}` : '-'}
                              </td>
                              <td className="p-2 font-bold text-[#0B4F6C]">
                                {showSaldos ? `$${h.saldo.toLocaleString('es-AR')}` : '••••••••'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 text-sm">
                Selecciona un cliente de la lista para ver su estado de cuenta corriente.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Client Deletion */}
      <ConfirmModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={() => {
          if (clientToDelete) {
            deleteClient(clientToDelete.id);
            setClientToDelete(null);
          }
        }}
        title="Eliminar Cliente"
        message={
          <p>
            ¿Está seguro de eliminar al cliente <strong>"{clientToDelete?.nombre}"</strong> y todos sus registros asociados?
          </p>
        }
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
};
