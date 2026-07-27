import { Product, Client, Movement, RawMaterial, Recipe, Supplier, AppSystemConfig } from '../types';

export const initialProducts: Product[] = [
  // Productos a Granel (Kg)
  {
    id: 101,
    codigo: "101",
    nombre: "BASTONCITOS DE MOZZARELLA X KG.",
    tipo: "Gramos",
    pesoGrs: 1000,
    costo: 11120,
    precioComercio: 13500,
    precioParticular: 16680,
    stockGranelKg: 15,
    stockBandejas: 0,
    grsPorBandeja: 433,
    ingredientes: "Mozzarella premium, panko, huevo, harina de trigo, sal, orégano y condimentos naturales.",
    alergenos: "CONTIENE LECHE Y DERIVADOS DE TRIGO. PUEDE CONTENER HUEVO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 102,
    codigo: "102",
    nombre: "BOCADITOS DE CALABAZA Y MUZARELLA X KG.",
    tipo: "Gramos",
    pesoGrs: 1000,
    costo: 6280,
    precioComercio: 7800,
    precioParticular: 9420,
    stockGranelKg: 12,
    stockBandejas: 0,
    grsPorBandeja: 377,
    ingredientes: "Calabaza fresca, mozzarella, rebozador especial, sal y condimentos.",
    alergenos: "CONTIENE LECHE Y TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 103,
    codigo: "103",
    nombre: "BOCADITOS DE ESPINACA X KG.",
    tipo: "Gramos",
    pesoGrs: 1000,
    costo: 5500,
    precioComercio: 6900,
    precioParticular: 8250,
    stockGranelKg: 4, // Alerta
    stockBandejas: 0,
    grsPorBandeja: 377,
    ingredientes: "Espinaca seleccionada, queso cremoso, rebozador, cebolla picada y sal.",
    alergenos: "CONTIENE LECHE Y TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 104,
    codigo: "104",
    nombre: "CROQUETA DE ESPINACA Y QUESO X KG.",
    tipo: "Gramos",
    pesoGrs: 1000,
    costo: 7370,
    precioComercio: 8800,
    precioParticular: 9500,
    stockGranelKg: 3, // Alerta
    stockBandejas: 0,
    grsPorBandeja: 400,
    ingredientes: "Espinaca, queso cremoso, salsa bechamel, rebozador y panko.",
    alergenos: "CONTIENE LECHE Y TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 105,
    codigo: "105",
    nombre: "MEDALLON DE MERLUZA X KG.",
    tipo: "Gramos",
    pesoGrs: 1000,
    costo: 4700,
    precioComercio: 5900,
    precioParticular: 7050,
    stockGranelKg: 20,
    stockBandejas: 0,
    grsPorBandeja: 400,
    ingredientes: "Filet de merluza sin espinas, rebozador, jugo de limón y sal.",
    alergenos: "CONTIENE PESCADO Y TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 106,
    codigo: "106",
    nombre: "MEDALLON DE POLLO X KG.",
    tipo: "Gramos",
    pesoGrs: 1000,
    costo: 6280,
    precioComercio: 7800,
    precioParticular: 9420,
    stockGranelKg: 18,
    stockBandejas: 0,
    grsPorBandeja: 400,
    ingredientes: "Pechuga de pollo molida, panko, rebozador, especias naturales.",
    alergenos: "CONTIENE TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 107,
    codigo: "107",
    nombre: "MEDALLONES DE POLLO, ESPINACA Y QUESO X KG.",
    tipo: "Gramos",
    pesoGrs: 1000,
    costo: 7160,
    precioComercio: 8900,
    precioParticular: 10740,
    stockGranelKg: 14,
    stockBandejas: 0,
    grsPorBandeja: 400,
    ingredientes: "Pollo procesado, espinaca, mozzarella, rebozador panko.",
    alergenos: "CONTIENE LECHE Y TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 108,
    codigo: "108",
    nombre: "MILANESA DE SOJA X KG.",
    tipo: "Gramos",
    pesoGrs: 1000,
    costo: 5820,
    precioComercio: 7200,
    precioParticular: 8730,
    stockGranelKg: 16,
    stockBandejas: 0,
    grsPorBandeja: 440,
    ingredientes: "Harina de soja texturizada, rebozador especial, condimentos.",
    alergenos: "CONTIENE SOJA Y TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 109,
    codigo: "109",
    nombre: "NUGGETS X KG.",
    tipo: "Gramos",
    pesoGrs: 1000,
    costo: 8050,
    precioComercio: 9900,
    precioParticular: 12075,
    stockGranelKg: 25,
    stockBandejas: 0,
    grsPorBandeja: 360,
    ingredientes: "Pechuga de pollo seleccionada, rebozador crujiente panko.",
    alergenos: "CONTIENE TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 110,
    codigo: "110",
    nombre: "PAPA BASTON X KG.",
    tipo: "Gramos",
    pesoGrs: 1000,
    costo: 4200,
    precioComercio: 5200,
    precioParticular: 6300,
    stockGranelKg: 30,
    stockBandejas: 0,
    grsPorBandeja: 400,
    ingredientes: "Papa seleccionada prefrita, aceite vegetal.",
    alergenos: "LIBRE DE GLUTEN (SIN TACC).",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 111,
    codigo: "111",
    nombre: "PAPA CARITA X KG.",
    tipo: "Gramos",
    pesoGrs: 1000,
    costo: 6000,
    precioComercio: 7500,
    precioParticular: 9000,
    stockGranelKg: 22,
    stockBandejas: 0,
    grsPorBandeja: 400,
    ingredientes: "Puré de papa deshidratado, almidón, sal.",
    alergenos: "PUEDE CONTENER SOJA.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 112,
    codigo: "112",
    nombre: "PAPA NOISSETTE X KG.",
    tipo: "Gramos",
    pesoGrs: 1000,
    costo: 6000,
    precioComercio: 7500,
    precioParticular: 9000,
    stockGranelKg: 18,
    stockBandejas: 0,
    grsPorBandeja: 400,
    ingredientes: "Papa prefrita moldeada en avellana, especias.",
    alergenos: "LIBRE DE GLUTEN (SIN TACC).",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 113,
    codigo: "113",
    nombre: "PATITAS DE POLLO X KG.",
    tipo: "Gramos",
    pesoGrs: 1000,
    costo: 6280,
    precioComercio: 7800,
    precioParticular: 9420,
    stockGranelKg: 24,
    stockBandejas: 0,
    grsPorBandeja: 400,
    ingredientes: "Carne de pollo procesada, rebozador panko.",
    alergenos: "CONTIENE TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 114,
    codigo: "114",
    nombre: "AROS DE CEBOLLA X KG.",
    tipo: "Gramos",
    pesoGrs: 1000,
    costo: 8800,
    precioComercio: 10800,
    precioParticular: 13200,
    stockGranelKg: 15,
    stockBandejas: 0,
    grsPorBandeja: 380,
    ingredientes: "Cebolla fresca cortada, rebozador crocante.",
    alergenos: "CONTIENE TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 115,
    codigo: "115",
    nombre: "HAMBURGUESAS VEGGIE X KG.",
    tipo: "Gramos",
    pesoGrs: 1000,
    costo: 13300,
    precioComercio: 16200,
    precioParticular: 19950,
    stockGranelKg: 10,
    stockBandejas: 0,
    grsPorBandeja: 400,
    ingredientes: "Lentejas, avena, vegetales seleccionados, especias.",
    alergenos: "CONTIENE AVENA Y TRIGO.",
    conservacion: "-18°C (Freezer)"
  },

  // Productos Producidos / Envasados en Bandejas
  {
    id: 201,
    codigo: "201",
    nombre: "BASTONCITOS DE MOZZARELLA BANDEJA X 16",
    tipo: "Bandeja",
    pesoGrs: 433,
    costo: 4903,
    precioComercio: 6500,
    precioParticular: 6700,
    stockGranelKg: 0,
    stockBandejas: 28,
    grsPorBandeja: 433,
    ingredientes: "Mozzarella premium, rebozador panko, huevo, harina de trigo, sal y orégano.",
    alergenos: "CONTIENE LECHE Y DERIVADOS DE TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 202,
    codigo: "202",
    nombre: "BOCADITOS DE CALABAZA Y MUZARELLA BANDEJA X 12",
    tipo: "Bandeja",
    pesoGrs: 377,
    costo: 2455,
    precioComercio: 3800,
    precioParticular: 3700,
    stockGranelKg: 0,
    stockBandejas: 19,
    grsPorBandeja: 377,
    ingredientes: "Calabaza fresca, mozzarella, rebozador.",
    alergenos: "CONTIENE LECHE Y TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 203,
    codigo: "203",
    nombre: "BOCADITOS DE ESPINACA BANDEJA X 12",
    tipo: "Bandeja",
    pesoGrs: 377,
    costo: 2190,
    precioComercio: 3500,
    precioParticular: 3500,
    stockGranelKg: 0,
    stockBandejas: 2, // Alerta stock bajo!
    grsPorBandeja: 377,
    ingredientes: "Espinaca, queso cremoso, rebozador.",
    alergenos: "CONTIENE LECHE Y TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 205,
    codigo: "205",
    nombre: "MEDALLON DE MERLUZA BANDEJA X 4",
    tipo: "Bandeja",
    pesoGrs: 400,
    costo: 2000,
    precioComercio: 3000,
    precioParticular: 3200,
    stockGranelKg: 0,
    stockBandejas: 32,
    grsPorBandeja: 400,
    ingredientes: "Filet de merluza fresca, rebozador.",
    alergenos: "CONTIENE PESCADO Y TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 206,
    codigo: "206",
    nombre: "MEDALLON DE POLLO BANDEJA X 4",
    tipo: "Bandeja",
    pesoGrs: 400,
    costo: 2632,
    precioComercio: 3800,
    precioParticular: 4000,
    stockGranelKg: 0,
    stockBandejas: 25,
    grsPorBandeja: 400,
    ingredientes: "Carne de pollo seleccionada, rebozador crujiente.",
    alergenos: "CONTIENE TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 207,
    codigo: "207",
    nombre: "MEDALLONES DE POLLO, ESPINACA Y QUESO BANDEJA X 4",
    tipo: "Bandeja",
    pesoGrs: 400,
    costo: 3020,
    precioComercio: 4200,
    precioParticular: 4500,
    stockGranelKg: 0,
    stockBandejas: 15,
    grsPorBandeja: 400,
    ingredientes: "Pollo procesado, espinaca, mozzarella, rebozador panko.",
    alergenos: "CONTIENE LECHE Y TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 208,
    codigo: "208",
    nombre: "MILANESA DE SOJA BANDEJA X 4",
    tipo: "Bandeja",
    pesoGrs: 440,
    costo: 2680,
    precioComercio: 3800,
    precioParticular: 4000,
    stockGranelKg: 0,
    stockBandejas: 20,
    grsPorBandeja: 440,
    ingredientes: "Harina de soja, rebozador especial.",
    alergenos: "CONTIENE SOJA Y TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 209,
    codigo: "209",
    nombre: "NUGGETS BANDEJA X 16",
    tipo: "Bandeja",
    pesoGrs: 360,
    costo: 3018,
    precioComercio: 4500,
    precioParticular: 4600,
    stockGranelKg: 0,
    stockBandejas: 35,
    grsPorBandeja: 360,
    ingredientes: "Pollo procesado, rebozador panko.",
    alergenos: "CONTIENE TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 213,
    codigo: "213",
    nombre: "PATITAS DE POLLO BANDEJA X 22",
    tipo: "Bandeja",
    pesoGrs: 400,
    costo: 2632,
    precioComercio: 3800,
    precioParticular: 4000,
    stockGranelKg: 0,
    stockBandejas: 40,
    grsPorBandeja: 400,
    ingredientes: "Pollo molido, rebozador panko.",
    alergenos: "CONTIENE TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 214,
    codigo: "214",
    nombre: "AROS DE CEBOLLA BANDEJA X 18",
    tipo: "Bandeja",
    pesoGrs: 380,
    costo: 3464,
    precioComercio: 5000,
    precioParticular: 5300,
    stockGranelKg: 0,
    stockBandejas: 18,
    grsPorBandeja: 380,
    ingredientes: "Aros de cebolla fresca, rebozador especial.",
    alergenos: "CONTIENE TRIGO.",
    conservacion: "-18°C (Freezer)"
  },
  {
    id: 215,
    codigo: "215",
    nombre: "HAMBURGUESAS VEGGIE BANDEJA X 4",
    tipo: "Bandeja",
    pesoGrs: 400,
    costo: 5440,
    precioComercio: 8000,
    precioParticular: 8300,
    stockGranelKg: 0,
    stockBandejas: 14,
    grsPorBandeja: 400,
    ingredientes: "Lentejas, avena y vegetales procesados.",
    alergenos: "CONTIENE AVENA Y TRIGO.",
    conservacion: "-18°C (Freezer)"
  }
];

export const initialRawMaterials: RawMaterial[] = [
  {
    id: 1,
    nombre: "Mozzarella Barra",
    proveedor: "Artico / San Ignacio",
    marca: "La Tonadita",
    presentacion: "Horma x 4 Kg",
    costo: 34000
  },
  {
    id: 2,
    nombre: "Rebozador Panko",
    proveedor: "Grangys",
    marca: "Panko Gold",
    presentacion: "Bolsa x 10 Kg",
    costo: 22000
  },
  {
    id: 3,
    nombre: "Huevo Entero N°1",
    proveedor: "Avícola Sur",
    marca: "Granja Campo",
    presentacion: "Cajón 30 Docenas",
    costo: 54000
  },
  {
    id: 4,
    nombre: "Harina de Trigo 000",
    proveedor: "Molinos Cañuelas",
    marca: "Favorita",
    presentacion: "Bolsa x 25 Kg",
    costo: 16250
  },
  {
    id: 5,
    nombre: "Carne de Pollo deshuesada",
    proveedor: "Frigorífico Avellaneda",
    marca: "Granja Tres Arroyos",
    presentacion: "Caja x 20 Kg",
    costo: 90000
  },
  {
    id: 6,
    nombre: "Filet de Merluza s/espina",
    proveedor: "Distribuidora del Mar",
    marca: "Puerto Mar",
    presentacion: "Caja x 10 Kg",
    costo: 42000
  },
  {
    id: 7,
    nombre: "Espinaca Fresca Picada",
    proveedor: "Mercado Central",
    marca: "Huerta Directa",
    presentacion: "Cajón x 10 Kg",
    costo: 12000
  },
  {
    id: 8,
    nombre: "Bolsa Polietileno Termosellable",
    proveedor: "Envases del Sur",
    marca: "FlexoPack 95x62",
    presentacion: "Pack x 1000 u.",
    costo: 120000
  },
  {
    id: 9,
    nombre: "Hoja A4 Rótulos Autoadhesivos",
    proveedor: "Ledesma / Grafex",
    marca: "Apli A4",
    presentacion: "Pack x 100 Hojas",
    costo: 28000
  }
];

export const initialClients: Client[] = [
  {
    id: 1,
    nombre: "Adriana Kiosko",
    canal: "Comercio",
    telefono: "1164096233",
    direccion: "Rondeau 1000",
    saldo: 12500,
    historial: [
      {
        id: "tx-101",
        fecha: "2026-07-15",
        concepto: "Pedido Bandejas Muzzarella x 2",
        debe: 13000,
        haber: 0,
        saldo: 13000
      },
      {
        id: "tx-102",
        fecha: "2026-07-18",
        concepto: "Pago Efectivo",
        debe: 0,
        haber: 500,
        saldo: 12500
      },
      {
        id: "tx-104",
        fecha: "2026-07-21",
        concepto: "[ANULADO] Reserva Cancelada - OP-00104",
        debe: 0,
        haber: 0,
        saldo: 12500
      }
    ]
  },
  {
    id: 2,
    nombre: "Barbara Padilla",
    canal: "Particular",
    telefono: "1130647946",
    direccion: "Boulevard Buenos Aires 254",
    saldo: 0,
    historial: []
  },
  {
    id: 3,
    nombre: "Claudia Eirin",
    canal: "Particular",
    telefono: "1161746860",
    direccion: "Malvinas y Fair",
    saldo: 4000,
    historial: [
      {
        id: "tx-103",
        fecha: "2026-07-20",
        concepto: "Medallón Pollo Bandeja x 1",
        debe: 4000,
        haber: 0,
        saldo: 4000
      }
    ]
  },
  {
    id: 4,
    nombre: "Claudia Riveron",
    canal: "Particular",
    telefono: "1160560635",
    direccion: "Rondeau 1125",
    saldo: 0,
    historial: []
  },
  {
    id: 5,
    nombre: "Claudio Puentecito",
    canal: "Comercio",
    telefono: "1149865757",
    direccion: "Dardo Rocha 556",
    saldo: 18400,
    historial: [
      {
        id: "tx-104",
        fecha: "2026-07-10",
        concepto: "Pedido Surtido Congelados",
        debe: 18400,
        haber: 0,
        saldo: 18400
      }
    ]
  },
  {
    id: 6,
    nombre: "Elsa Alvarenga",
    canal: "Particular",
    telefono: "1128564028",
    direccion: "Sardi 420",
    saldo: 0,
    historial: []
  }
];

export const initialMovements: Movement[] = [
  {
    id: 1,
    fecha: "2026-07-22",
    tipo: "Entrada Stock",
    item: "Bastoncitos de Mozzarella Bandeja x 16",
    cantidad: 30,
    clienteProveedor: "Elaboración Propia"
  },
  {
    id: 2,
    fecha: "2026-07-21",
    tipo: "Salida Preventa",
    item: "Medallón de Merluza Bandeja x 4",
    cantidad: 5,
    clienteProveedor: "Claudia Eirin"
  },
  {
    id: 3,
    fecha: "2026-07-20",
    tipo: "Fraccionamiento",
    item: "Mozzarella Kg -> Bandejas",
    cantidad: 10,
    clienteProveedor: "Elaboración Interna"
  }
];

export const initialSuppliers: Supplier[] = [
  {
    id: 1,
    nombre: "Grangys / Ártico",
    contacto: "Juan Perez",
    telefono: "1144556677",
    email: "ventas@grangys.com.ar",
    direccion: "Av. Crovara 1200, La Matanza",
    cuit: "30-71122334-9",
    rubro: "Rebozadores y Congelados",
    saldo: 45000,
    historial: [
      {
        id: "sup-101",
        fecha: "2026-07-12",
        concepto: "Compra Panko Gold x 20 Kg",
        debe: 45000,
        haber: 0,
        saldo: 45000
      }
    ]
  },
  {
    id: 2,
    nombre: "Molinos Cañuelas",
    contacto: "Agustín R.",
    telefono: "1155667788",
    email: "pedidos@molinoscanuelas.com",
    direccion: "Ruta 3 Km 60, Cañuelas",
    cuit: "30-50001234-5",
    rubro: "Harinas y Derivados",
    saldo: 0,
    historial: []
  },
  {
    id: 3,
    nombre: "Envases del Sur",
    contacto: "Mariana L.",
    telefono: "1122334455",
    email: "envasesdelsur@gmail.com",
    direccion: "Mitre 450, Quilmes",
    cuit: "30-68991122-3",
    rubro: "Bolsas y Packaging",
    saldo: 120000,
    historial: [
      {
        id: "sup-102",
        fecha: "2026-07-18",
        concepto: "Bolsas Polietileno Pack x 1000",
        debe: 120000,
        haber: 0,
        saldo: 120000
      }
    ]
  }
];

export const initialSystemConfig: AppSystemConfig = {
  codeRules: [
    { categoria: '1XX - Granel (Kg)', min: 100, max: 199, modo: 'rango' },
    { categoria: '2XX - Bandeja', min: 200, max: 299, modo: 'rango' },
    { categoria: 'Marketing', min: 300, max: 399, modo: 'rango' },
    { categoria: 'Insumo', min: 400, max: 499, modo: 'rango' },
    { categoria: 'Otros', min: 500, max: 999, modo: 'rango' }
  ],
  productCategories: [
    { id: 'cat-1xx', nombre: '1XX - Granel (Kg)', tipo: 'Productos', activo: true, mermaPct: 2.0 },
    { id: 'cat-2xx', nombre: '2XX - Bandeja', tipo: 'Productos', activo: true, mermaPct: 3.5 },
    { id: 'cat-insumo', nombre: 'Insumo', tipo: 'Materia Prima', activo: true, mermaPct: 0.0 },
    { id: 'cat-mkt', nombre: 'Marketing', tipo: 'Otro', activo: true, mermaPct: 0.0 },
    { id: 'cat-otros', nombre: 'Otros', tipo: 'Otro', activo: true, mermaPct: 0.0 }
  ],
  overheadTypes: ['Transporte y Flete', 'Mano de Obra Directa', 'Energía y Gas', 'Packaging Adicional', 'Mermas y Mantenimiento'],
  googleDriveFolderId: '',
  autoBackupEnabled: true,
  mermaDefaultPct: 3.5,
  diasAlertaDesactualizacionCosto: 30,
  margenComercioSugerido: 35,
  margenParticularSugerido: 50
};

export const initialRecipes: Recipe[] = [
  {
    id: 1,
    productoId: 201,
    productoNombre: "BASTONCITOS DE MOZZARELLA BANDEJA X 16",
    insumoId: 1,
    insumoNombre: "Mozzarella Barra",
    gramosRequeridos: 433,
    insumos: [
      { insumoId: 101, insumoNombre: "BASTONCITOS DE MOZZARELLA X KG.", gramosOCantidad: 433, unidad: 'grs' },
      { insumoId: 8, insumoNombre: "Bolsa Polietileno Termosellable", gramosOCantidad: 1, unidad: 'u' },
      { insumoId: 9, insumoNombre: "Hoja A4 Rótulo Autoadhesivo", gramosOCantidad: 0.125, unidad: 'u' }
    ],
    costoEstimadoBandeja: 4903,
  },
  {
    id: 2,
    productoId: 202,
    productoNombre: "BOCADITOS DE CALABAZA Y MUZARELLA BANDEJA X 12",
    insumoId: 102,
    insumoNombre: "BOCADITOS DE CALABAZA Y MUZARELLA X KG.",
    gramosRequeridos: 377,
    insumos: [
      { insumoId: 102, insumoNombre: "BOCADITOS DE CALABAZA Y MUZARELLA X KG.", gramosOCantidad: 377, unidad: 'grs' },
      { insumoId: 8, insumoNombre: "Bolsa Polietileno Termosellable", gramosOCantidad: 1, unidad: 'u' },
      { insumoId: 9, insumoNombre: "Hoja A4 Rótulo Autoadhesivo", gramosOCantidad: 0.125, unidad: 'u' }
    ],
    costoEstimadoBandeja: 2455,
  },
  {
    id: 3,
    productoId: 203,
    productoNombre: "BOCADITOS DE ESPINACA BANDEJA X 12",
    insumoId: 103,
    insumoNombre: "BOCADITOS DE ESPINACA X KG.",
    gramosRequeridos: 377,
    insumos: [
      { insumoId: 103, insumoNombre: "BOCADITOS DE ESPINACA X KG.", gramosOCantidad: 377, unidad: 'grs' },
      { insumoId: 8, insumoNombre: "Bolsa Polietileno Termosellable", gramosOCantidad: 1, unidad: 'u' },
      { insumoId: 9, insumoNombre: "Hoja A4 Rótulo Autoadhesivo", gramosOCantidad: 0.125, unidad: 'u' }
    ],
    costoEstimadoBandeja: 2190,
  },
  {
    id: 4,
    productoId: 205,
    productoNombre: "MEDALLON DE MERLUZA BANDEJA X 4",
    insumoId: 105,
    insumoNombre: "MEDALLON DE MERLUZA X KG.",
    gramosRequeridos: 400,
    insumos: [
      { insumoId: 105, insumoNombre: "MEDALLON DE MERLUZA X KG.", gramosOCantidad: 400, unidad: 'grs' },
      { insumoId: 8, insumoNombre: "Bolsa Polietileno Termosellable", gramosOCantidad: 1, unidad: 'u' },
      { insumoId: 9, insumoNombre: "Hoja A4 Rótulo Autoadhesivo", gramosOCantidad: 0.125, unidad: 'u' }
    ],
    costoEstimadoBandeja: 2000,
  },
  {
    id: 5,
    productoId: 209,
    productoNombre: "NUGGETS BANDEJA X 16",
    insumoId: 109,
    insumoNombre: "NUGGETS X KG.",
    gramosRequeridos: 360,
    insumos: [
      { insumoId: 109, insumoNombre: "NUGGETS X KG.", gramosOCantidad: 360, unidad: 'grs' },
      { insumoId: 8, insumoNombre: "Bolsa Polietileno Termosellable", gramosOCantidad: 1, unidad: 'u' },
      { insumoId: 9, insumoNombre: "Hoja A4 Rótulo Autoadhesivo", gramosOCantidad: 0.125, unidad: 'u' }
    ],
    costoEstimadoBandeja: 3018,
  }
];
