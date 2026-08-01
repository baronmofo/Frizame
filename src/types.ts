export type UserRole = 'Admin' | 'Vendedor';

export type SaleChannel = 'Particular' | 'Comercio' | 'Especial';

export type ProductType = 'Gramos' | 'Bandeja' | 'Insumo' | 'Marketing' | 'Otros';

export interface CookingMethods {
  sarten?: boolean;
  horno?: boolean;
  frito?: boolean;
  sinDescongelar?: boolean;
}

export interface ProductLot {
  lote: string;
  vencimiento: string; // YYYY-MM-DD
  cantidadStock?: number;
}

export interface Product {
  id: number | string;
  codigo: string;
  nombre: string;
  tipo: ProductType;
  pesoGrs: number;
  presentacionTexto?: string; // Textual presentation e.g. "Bandeja por 400 gr"
  costo: number; // Costo base por Kg o por bandeja
  precioComercio: number;
  precioParticular: number;
  stockGranelKg: number;
  stockBandejas: number;
  grsPorBandeja: number;
  ingredientes: string;
  alergenos: string;
  loteDefault?: string;
  vencimientoDefault?: string;
  lotes?: ProductLot[];
  conservacion?: string;
  productoImagenJpg?: string; // Optional JPG product photo URL/base64
  rotuloImagenJpg?: string; // Optional JPG label image URL/base64 per product
  stickerImagenJpg?: string; // Optional JPG sticker image URL/base64 per product
  paginaCompletaImagenJpg?: string; // Optional full page JPG image for Marketing products
  metodosCoccion?: CookingMethods; // Cooking method icons
  stockMinimo?: number; // Minimum stock alert threshold
  stockMaximo?: number; // Maximum stock threshold
  margenComercio?: number; // % Profit margin for Comercio
  margenParticular?: number; // % Profit margin for Particular
  activo?: boolean; // Active state (false = Inactivo)
}

export interface ClientHistory {
  id?: string;
  fecha: string;
  concepto: string;
  debe: number;
  haber: number;
  saldo: number;
}

export interface Client {
  id: number | string;
  nombre: string;
  canal: SaleChannel;
  telefono: string;
  direccion: string;
  localidad?: string;
  contacto?: string;
  saldo: number;
  historial: ClientHistory[];
  observaciones?: string;
}

export interface SupplierHistory {
  id?: string;
  fecha: string;
  concepto: string;
  debe: number; // Facturas / Compras a pagar
  haber: number; // Pagos realizados
  saldo: number;
}

export interface Supplier {
  id: number | string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  cuit?: string;
  rubro?: string;
  saldo: number;
  historial: SupplierHistory[];
  observaciones?: string;
}

export type MovementType = 'Entrada Stock' | 'Salida Preventa' | 'Fraccionamiento' | 'Cobro Cta Cte' | 'Pago Proveedor' | 'Ajuste Manual';

export interface CartItem {
  productId: number | string;
  codigo: string;
  nombre: string;
  tipo: ProductType;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  lote?: string;
  vencimiento?: string;
}

export interface OrderOP {
  id: string;
  numeroOP: string;
  fecha: string;
  clientId: number | string;
  clientNombre: string;
  clientTelefono: string;
  clientDireccion: string;
  clientLocalidad?: string;
  clientContacto?: string;
  canal: SaleChannel;
  items: CartItem[];
  subtotal: number;
  descuento: number;
  total: number;
  formaPago: 'Efectivo' | 'Transferencia' | 'Cuenta Corriente';
  observaciones?: string;
  estado?: 'Reservado' | 'Confirmado' | 'Anulado';
}

export interface Movement {
  id: number | string;
  fecha: string;
  tipo: MovementType;
  item: string;
  cantidad: number | string;
  clienteProveedor: string;
}

export interface RawMaterial {
  id: number | string;
  codigo?: string;
  nombre: string;
  categoria?: string;
  proveedor: string;
  marca: string;
  presentacion: string;
  unidadMedida?: string; // 'Kg' | 'u.' | 'cm' | 'lts' | 'grs' | 'm.'
  umPorPresentacion?: number; // e.g., 25 kg per presentation
  costo: number; // Costo por presentación
  costoUnidad?: number;
  unidad?: string;
  stock?: number;
  stockMinimo?: number;
  stockMaximo?: number;
  fechaUltimaActualizacionCosto?: string; // YYYY-MM-DD
  activo?: boolean;
}

export interface CategoryConfigItem {
  id: string;
  nombre: string;
  tipo?: 'Productos' | 'Materia Prima' | 'Otro';
  activa?: boolean;
  activo?: boolean;
  mermaPct?: number; // % Merma Fija por Categoría
}

export interface StockImpact {
  itemId: number | string;
  itemType: 'Product' | 'RawMaterial';
  codigo?: string;
  nombre: string;
  tipoStock?: 'GranelKg' | 'Bandejas' | 'Unidades';
  stockAnterior: number;
  stockNuevo: number;
  deltaStock: number;
  unidad: string;
}

export interface FinancialImpact {
  montoTotal?: number;
  metodoPago?: string;
  impactoSaldoCliente?: number;
  impactoSaldoProveedor?: number;
  impactoCaja?: number;
  descuentoAplicado?: number;
}

export interface HistoryEvent {
  id: string; // ID único e.g. HIST-171823912
  timestamp: string; // ISO String
  tipoEvento: 'Fraccionamiento' | 'Venta' | 'Cobro Cta Cte' | 'Ajuste Stock' | 'Modificacion Insumo' | 'Alta Insumo' | 'Baja Insumo' | 'Modificacion Producto' | 'Pago Proveedor' | 'Factura Proveedor' | 'Inicio de Sesión' | 'Cierre de Sesión' | 'Modificacion Usuario';
  usuarioResponsable: string;
  impactoStock: StockImpact[];
  impactoFinanciero?: FinancialImpact;
  detalles: string;
  metadata?: Record<string, any>;
}

export interface RecipeItem {
  insumoId: number | string;
  insumoNombre: string;
  gramosOCantidad: number;
  unidad?: string; // 'grs' | 'u' | 'kg'
  costoUnitario?: number;
}

export interface OverheadCostItem {
  id: string;
  nombre: string;
  monto: number;
}

export interface Recipe {
  id: number | string;
  productoId: number | string;
  productoNombre: string;
  insumoId?: number | string;
  insumoNombre?: string;
  gramosRequeridos?: number;
  insumos?: RecipeItem[];
  costoEstimadoBandeja: number;
  envase?: string;
  overheads?: OverheadCostItem[];
}

export interface CodeRuleConfig {
  categoria: string;
  prefijo?: string;
  min?: number;
  max?: number;
  minimo?: number;
  maximo?: number;
  modo: 'prefijo' | 'rango' | 'libre' | 'mayor' | 'menor';
}

export interface SystemUser {
  id: string;
  nombre: string;
  email: string;
  password?: string;
  rol: 'Administrador' | 'Vendedor' | 'Operador';
  activo: boolean;
  ultimoAcceso: string;
}

export interface CompanyInfo {
  razonSocial?: string;
  rne?: string;
  rnpa?: string;
  direccion?: string;
  telefono?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  companyLogoUrl?: string;
}

export interface AppSystemConfig {
  codeRules: CodeRuleConfig[];
  productCategories: (string | CategoryConfigItem)[];
  overheadTypes: string[];
  companyData?: CompanyInfo;
  diasAlertaDesactualizacionCosto?: number;
  margenComercioSugerido?: number;
  margenParticularSugerido?: number;
  mermaDefaultPct?: number;
  themePalette?: 'classic' | 'sapphire' | 'emerald' | 'sunset' | 'dark';
  printFormatCategoryDefaults?: Record<string, 'rotulo' | 'sticker' | 'a4' | 'individual'>;
  googleDriveFolderId?: string;
  lastGoogleDriveBackupTime?: string;
  lastGoogleDriveBackupFileName?: string;
  autoBackupEnabled?: boolean;
  requireLogin?: boolean;
  adminPassword?: string;
}

export interface LabelConfig {
  productoId: number | string;
  lote: string;
  vencimiento: string;
  pesoNeto: string;
  conservacion: string;
  ingredientes: string;
  alergenos: string;
  picSarten: boolean;
  picHorno: boolean;
  picSinDescongelar: boolean;
  copiesCount: number; // 9 para Rótulos (3x3), 30 para Stickers (5x6), 1 para A4/Individual
  printType?: 'rotulo' | 'sticker' | 'a4' | 'individual';
  rotuloImagenJpg?: string;
  stickerImagenJpg?: string;
  productoNombre?: string;
  qrCodeUrl?: string;
}

