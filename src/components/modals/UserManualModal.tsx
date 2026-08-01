import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Search,
  CheckCircle2,
  HelpCircle,
  Package,
  ShoppingCart,
  Users,
  Printer,
  Scale,
  Calculator,
  Settings,
  Database,
  ShieldCheck,
  Download,
  AlertTriangle,
  FileText,
  Truck,
  Building2,
} from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<string>('all');

  if (!isOpen) return null;

  const sections = [
    { id: 'all', name: 'Manual Completo', icon: BookOpen },
    { id: 'general', name: 'Tablero General', icon: Package },
    { id: 'ventas', name: 'Stock y Ventas', icon: ShoppingCart },
    { id: 'clientes', name: 'Clientes y Cta. Cte.', icon: Users },
    { id: 'rotulos', name: 'Rótulos A4', icon: Printer },
    { id: 'fraccionamiento', name: 'Fraccionamiento', icon: Scale },
    { id: 'costos', name: 'Costos e Insumos', icon: Calculator },
    { id: 'configuracion', name: 'Configuración y Drive', icon: Settings },
  ];

  const matches = (text: string) => {
    if (!searchTerm.trim()) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0B4F6C]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-[#D1E3EB] flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-[#0B4F6C] text-white px-6 py-4 border-b border-[#017E9A] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#017E9A] rounded-xl text-white shadow-xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-brand font-bold text-xl text-white">
                Manual de Usuario Oficial - Frizame Congelados Premium
              </h2>
              <p className="text-xs text-sky-200">
                Guía completa de operación, reglas de validación, fraccionamiento y gestión integral.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-sky-200 hover:text-white hover:bg-sky-800/50 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[#E8F4F8] px-6 py-3 border-b border-[#D1E3EB] flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar función, módulo o término..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-[#D1E3EB] rounded-lg text-xs bg-white focus:outline-none focus:border-[#017E9A] font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {sections.map((sec) => {
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`px-3 py-1.5 text-xs font-brand font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    activeSection === sec.id
                      ? 'bg-[#0B4F6C] text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-[#D1E3EB]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sec.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual Content Area */}
        <div className="p-6 overflow-y-auto space-y-8 text-xs sm:text-sm text-gray-700 leading-relaxed font-sans flex-1">
          {/* Section: General Overview */}
          {(activeSection === 'all' || activeSection === 'general') && matches('general tablero dashboard kpi kpis resumen') && (
            <section className="space-y-4 border-b border-[#D1E3EB] pb-6">
              <div className="flex items-center gap-2 text-[#0B4F6C] border-b border-[#D1E3EB] pb-2">
                <Package className="w-5 h-5 text-[#017E9A]" />
                <h3 className="font-brand font-bold text-lg text-[#0B4F6C]">
                  1. Tablero General (Dashboard)
                </h3>
              </div>
              <p>
                El <strong>Tablero General</strong> es la pantalla principal del sistema. Brinda un resumen ejecutivo en tiempo real de la operación comercial y productiva de <strong>Frizame Congelados Premium</strong>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#F4F8FA] p-4 rounded-xl border border-[#D1E3EB] space-y-2">
                  <strong className="text-[#0B4F6C] block font-bold">Indicadores Clave (KPIs):</strong>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li><strong>Ingresos del Mes:</strong> Suma acumulada de cobranzas e ingresos registrados.</li>
                    <li><strong>Deuda en Cta. Cte.:</strong> Saldo total adeudado por los clientes en cuenta corriente.</li>
                    <li><strong>Alertas de Stock Crítico:</strong> Cantidad de productos cuya existencia está por debajo del stock mínimo.</li>
                    <li><strong>Órdenes de Pedido Activas:</strong> Cantidad de pedidos pendientes de entrega o preparación.</li>
                  </ul>
                </div>
                <div className="bg-[#F4F8FA] p-4 rounded-xl border border-[#D1E3EB] space-y-2">
                  <strong className="text-[#0B4F6C] block font-bold">Accesos Rápidos y Gráficos:</strong>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li><strong>Botonera de Acción Rápida:</strong> Permite emitir una venta, dar de alta un cliente, generar una nota de compra o imprimir rótulos A4 con un solo clic.</li>
                    <li><strong>Distribución por Canales:</strong> Gráfico comparativo de ventas entre canal Particular, Comercio y Especial.</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Section: Stock & Sales */}
          {(activeSection === 'all' || activeSection === 'ventas') && matches('stock ventas orden pedido remito op op-') && (
            <section className="space-y-4 border-b border-[#D1E3EB] pb-6">
              <div className="flex items-center gap-2 text-[#0B4F6C] border-b border-[#D1E3EB] pb-2">
                <ShoppingCart className="w-5 h-5 text-[#017E9A]" />
                <h3 className="font-brand font-bold text-lg text-[#0B4F6C]">
                  2. Módulo de Stock, Ventas y Remito OP
                </h3>
              </div>
              <p>
                Este módulo administra el inventario de productos terminados, el registro de ventas multi-item y la emisión de Comprobantes Oficiales de Orden de Pedido (Remito OP).
              </p>
              <div className="space-y-3">
                <div className="bg-[#E8F4F8] p-4 rounded-xl border border-[#D1E3EB]">
                  <strong className="text-[#0B4F6C] font-bold block mb-1">Diferenciación de Productos:</strong>
                  <p className="text-xs">
                    El sistema clasifica los productos según su código numérico:
                  </p>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                    <li><strong>Código 1XX (Granel en Kg):</strong> Mezclas elaboradas comercializadas por kilogramo.</li>
                    <li><strong>Código 2XX (Bandejas Selladas):</strong> Unidades fraccionadas y empaquetadas x 4 unidades o peso fijo.</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#D1E3EB] space-y-2">
                  <strong className="text-[#0B4F6C] font-bold block">Preventa y Reglas de Reserva de Stock:</strong>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-700">
                    <li><strong>Validación de Stock Físico:</strong> En el modal "Cargar Pedido de Preventa Multi-Producto", si la cantidad solicitada de cualquier producto supera el stock disponible en depósito, el sistema muestra una alerta clara indicando la disponibilidad y deshabilita (grisa) el botón <strong>"Confirmar Venta y Generar OP"</strong>.</li>
                    <li><strong>Guardar y Reservar Mercadería (Sobre-Demanda):</strong> Si el stock es insuficiente o desea tomar el pedido como reserva, presione <strong>"Guardar y Reservar Mercadería"</strong>. El pedido quedará en estado <em>RESERVA</em> y el producto registrará saldo reservado.</li>
                    <li><strong>Alerta de Stock Reservado (-X*) en Dashboard:</strong> Cuando existen productos con mercadería reservada en preventa, el Tablero de Inicio destaca en su botonera principal la tarjeta de <strong>Preventas Registradas</strong> y la sección de <strong>Alertas de Stock</strong> con badges destacados y avisos explicativos.</li>
                    <li><strong>Trazabilidad de Cancelación y Reactivación:</strong> Al cancelar o modificar una orden reservada, el stock se restituye automáticamente y el historial refleja el evento con precisión sin generar débitos ni créditos ficticios en Cta. Cte.</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Section: Clients & Cta Cte */}
          {(activeSection === 'all' || activeSection === 'clientes') && matches('cliente clientes cta cte cuenta corriente pago cobro direccion contacto') && (
            <section className="space-y-4 border-b border-[#D1E3EB] pb-6">
              <div className="flex items-center gap-2 text-[#0B4F6C] border-b border-[#D1E3EB] pb-2">
                <Users className="w-5 h-5 text-[#017E9A]" />
                <h3 className="font-brand font-bold text-lg text-[#0B4F6C]">
                  3. Módulo de Clientes y Cuentas Corrientes
                </h3>
              </div>
              <p>
                Permite mantener la agenda unificada de clientes con sus datos de logística (Dirección de Entrega, Localidad, Persona de Contacto) y controlar el estado financiero de sus cuentas corrientes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#F4F8FA] p-4 rounded-xl border border-[#D1E3EB] space-y-2">
                  <strong className="text-[#0B4F6C] font-bold block">Alta y Edición de Cliente:</strong>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li><strong>Nombre / Razón Social:</strong> Denominación del comercio o cliente particular.</li>
                    <li><strong>Canal de Venta:</strong> Particular (Aplica Precio Particular) o Comercio (Aplica Precio Mayorista Comercio).</li>
                    <li><strong>Dirección de Entrega y Localidad:</strong> Domicilio físico donde se despachará el pedido.</li>
                    <li><strong>Persona de Contacto:</strong> Nombre y cargo del encargado de recibir las entregas.</li>
                  </ul>
                </div>
                <div className="bg-[#F4F8FA] p-4 rounded-xl border border-[#D1E3EB] space-y-2">
                  <strong className="text-[#0B4F6C] font-bold block">Cobranzas y Registro de Pagos:</strong>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Haga clic en <strong>"Registrar Cobro"</strong> sobre la ficha del cliente.</li>
                    <li>Ingrese el monto recibido y el medio de pago. El saldo en Cta. Cte. se actualizará inmediatamente y quedará asentado en su historial contable.</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Section: Printing & Labels */}
          {(activeSection === 'all' || activeSection === 'rotulos') && matches('rotulo rotulos etiqueta stickers calcomanias a4 impresion qr lote') && (
            <section className="space-y-4 border-b border-[#D1E3EB] pb-6">
              <div className="flex items-center gap-2 text-[#0B4F6C] border-b border-[#D1E3EB] pb-2">
                <Printer className="w-5 h-5 text-[#017E9A]" />
                <h3 className="font-brand font-bold text-lg text-[#0B4F6C]">
                  4. Impresión de Rótulos y Calcomanías en Hoja A4
                </h3>
              </div>
              <p>
                Diseñado para imprimir etiquetas reglamentarias en impresoras estándar con hojas autoadhesivas tamaño A4.
              </p>
              <div className="bg-white p-4 rounded-xl border border-[#D1E3EB] space-y-2">
                <strong className="text-[#0B4F6C] font-bold block">Características de los Rótulos:</strong>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li><strong>Contenido Obligatorio:</strong> Marca Frizame, Denominación, Ingredientes, Alérgenos, Tabla Nutricional, Temperatura de Conservación (-18°C), Lote y Fecha de Vencimiento.</li>
                  <li><strong>Código QR Dinámico:</strong> Incorpora QR en cada etiqueta con el número de lote y fecha de envasado para asegurar la trazabilidad bromatológica.</li>
                  <li><strong>Configuración de Grilla A4:</strong> Permite elegir el número de etiquetas por hoja A4 (ej: 8 etiquetas por hoja) y la cantidad exacta a imprimir.</li>
                </ul>
              </div>
            </section>
          )}

          {/* Section: Fraccionamiento */}
          {(activeSection === 'all' || activeSection === 'fraccionamiento') && matches('fraccionamiento elaboracion recetas merma mezclas insumos') && (
            <section className="space-y-4 border-b border-[#D1E3EB] pb-6">
              <div className="flex items-center gap-2 text-[#0B4F6C] border-b border-[#D1E3EB] pb-2">
                <Scale className="w-5 h-5 text-[#017E9A]" />
                <h3 className="font-brand font-bold text-lg text-[#0B4F6C]">
                  5. Fraccionamiento y Elaboración de Recetas
                </h3>
              </div>
              <p>
                Permite transformar la mezcla elaborada a granel (Kg) en bandejas empaquetadas selladas (2XX), aplicando automáticamente las mermas operativas y descontando del inventario las bolsas y rótulos consumidos.
              </p>
              <div className="bg-[#E8F4F8] p-4 rounded-xl border border-[#D1E3EB] space-y-2">
                <strong className="text-[#0B4F6C] font-bold block">Procedimiento de Fraccionamiento:</strong>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs">
                  <li>Seleccione la mezcla origen (Granel 1XX).</li>
                  <li>Ingrese la cantidad de kilogramos a fraccionar.</li>
                  <li>El sistema calculará automáticamente la cantidad teórica de bandejas resultantes considerando el peso por bandeja (ej: 400 grs) y la merma predeterminada de la categoría (ej: 3.5%).</li>
                  <li>Al confirmar, se reducirá el stock a granel, aumentará el stock de bandejas y se descontarán automáticamente los insumos asociados (bolsas y etiquetas).</li>
                </ol>
              </div>
            </section>
          )}

          {/* Section: Costos & Insumos */}
          {(activeSection === 'all' || activeSection === 'costos') && matches('costo costos insumo insumos precio confirmacion desactualizado regla codigo 4xx 1xx 2xx 3xx') && (
            <section className="space-y-4 border-b border-[#D1E3EB] pb-6">
              <div className="flex items-center gap-2 text-[#0B4F6C] border-b border-[#D1E3EB] pb-2">
                <Calculator className="w-5 h-5 text-[#017E9A]" />
                <h3 className="font-brand font-bold text-lg text-[#0B4F6C]">
                  6. Módulo de Costos, Insumos y Agenda de Proveedores
                </h3>
              </div>
              <p>
                Gestión unificada de precios de materias primas, reglas de codificación de insumos, costos unitarios y cuentas corrientes con proveedores.
              </p>
              <div className="space-y-3">
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Reglas de Modificación de Costo y Confirmación Obligatoria:</span>
                  </div>
                  <p>
                    Al modificar cualquier valor de costo de un insumo en la tabla o en su ficha, el sistema solicitará una <strong>Confirmación en Modal</strong> indicando el valor anterior y el valor nuevo antes de guardar.
                  </p>
                  <p>
                    Al dar de alta un insumo con costo, se asigna automáticamente la fecha de actualización como el día presente. Un costo se marca como <strong>"Costo Desactualizado"</strong> únicamente si han transcurrido más de los días configurados (por defecto 30 días) desde su última actualización.
                  </p>
                </div>

                <div className="bg-[#F4F8FA] p-4 rounded-xl border border-[#D1E3EB] space-y-2">
                  <strong className="text-[#0B4F6C] font-bold block">Reglas de Validación de Códigos:</strong>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li><strong>Categoría Insumo Base / Materia Prima:</strong> Rango numérico recomendado de 401 en adelante.</li>
                    <li><strong>Categoría Granel (Kg):</strong> Rango 100 a 199.</li>
                    <li><strong>Categoría Bandejas:</strong> Rango 200 a 299.</li>
                    <li><strong>Categoría Marketing / Packaging:</strong> Rango 300 a 399.</li>
                  </ul>
                  <p className="text-xs text-gray-600 italic">
                    El código asignado en el alta se mantendrá inalterado en todo el sistema.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Section: Configuration & Google Drive Backup */}
          {(activeSection === 'all' || activeSection === 'configuracion') && matches('configuracion drive backup respaldos zip respaldar ahora administrador') && (
            <section className="space-y-4 pb-2">
              <div className="flex items-center gap-2 text-[#0B4F6C] border-b border-[#D1E3EB] pb-2">
                <Settings className="w-5 h-5 text-[#017E9A]" />
                <h3 className="font-brand font-bold text-lg text-[#0B4F6C]">
                  7. Configuración, Google Drive y Respaldo ZIP Auditoría
                </h3>
              </div>
              <p>
                Configuración global de parámetros del sistema y gestión de la persistencia automática y respaldos en la nube.
              </p>
              <div className="bg-white p-4 rounded-xl border border-[#D1E3EB] space-y-3 text-xs">
                <div className="flex items-center gap-2 text-[#0B4F6C] font-bold text-sm">
                  <Database className="w-4 h-4 text-[#017E9A]" />
                  <span>Persistencia en Google Drive & Respaldo "Respaldar Ahora":</span>
                </div>
                <p>
                  El sistema permite guardar los datos en una carpeta de Google Drive ingresando su <strong>Folder ID</strong>.
                </p>
                <div className="p-3 bg-[#E8F4F8] rounded-lg border border-[#D1E3EB] space-y-1.5">
                  <strong className="text-[#0B4F6C] block">Botón "Respaldar ahora":</strong>
                  <p>
                    Ubicado en la Pestaña 6 (Configuración), permite a los Administradores forzar manualmente en cualquier momento la generación de un archivo comprimido <strong>.ZIP de auditoría</strong> y su sincronización inmediata con la carpeta de Google Drive configurada.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#F4F8FA] px-6 py-3.5 border-t border-[#D1E3EB] flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#017E9A]" />
            <span>Frizame Congelados Premium - Manual de Usuario v3.5</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0B4F6C] hover:bg-[#083b52] text-white font-brand font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            Cerrar Manual
          </button>
        </div>
      </div>
    </div>
  );
};
