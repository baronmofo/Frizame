export const notebookLmMarkdown = `# DOCUMENTO TÉCNICO Y CUADERNO DE CONOCIMIENTO PARA NOTEBOOKLM
## Sistema de Gestión Integral - Frizame (Congelados Premium)

### Rol y Perspectiva del Asistente
Actúa como un Arquitecto de Software y Consultor de Negocios Senior experto en el ecosistema de Frizame - Congelados Premium. Este documento sirve como base de conocimiento consolidada para un cuaderno de NotebookLM.

---

### 1. Instrucciones del Sistema (System Instructions)
- **Reglas de Comportamiento:** Asistir con máxima precisión técnica, rigor matemático y enfoque en trazabilidad alimentaria y salud financiera del negocio.
- **Tono y Estilo:** Estructurado, profesional, ejecutivo y claro. Sin tecnicismos innecesarios pero con exactitud en las definiciones operativas.
- **Restricciones Clave:**
  - Los campos **peso, fecha de vencimiento y número de lote** corresponden exclusivamente a **rótulos y stickers de trazabilidad**. Se omiten automáticamente en impresiones de categoría publicitaria o marketing (A4 e Individual).
  - Toda modificación importante en la arquitectura, datos o reglas de negocio debe verse reflejada inmediatamente en este Cuaderno de Conocimiento.
  - La integridad de datos entre materias primas (1XX) y productos terminados (2XX) debe conservarse mediante registros auditables de fraccionamiento y el archivo de historial auditor (history.json).

---

### 2. Arquitectura de Navegación y Estructura de Solapas
El encabezado y menú principal se organiza de forma responsiva sin scrollbar horizontal:
1. **Inicio:** Panel general ejecutivo con verificación del tiempo transcurrido desde la última comparación contra Firebase Firestore.
2. **Ventas (Icono $ / Billete):** Registro de preventas, salidas de stock y movimientos comerciales.
3. **Clientes:** Gestión de cartera de clientes, cuentas corrientes y cobranzas.
4. **Productos (Icono Cajas Apiladas):** Catálogo de productos 1XX/2XX, fraccionamiento y control de stock.
5. **Costos (Anteriormente Proveedores):** Gestión de proveedores, costos de insumos, materias primas y sobrecostos fijos.
6. **Imprimir:** Generador e impresora de rótulos, stickers de trazabilidad y materiales publicitarios.
7. **Configuración (Icono Rueda/Engranaje):** Administración de usuarios, roles, parámetros, Google Drive backup y temario visual.

---

### 3. Arquitectura de Datos y Rangos de Código
El sistema organiza los códigos de producto en rangos prefijados para facilitar la identificación y segmentación:
- **"1XX - Granel (Kg)" (Rango 100 - 199):** Productos comercializados a granel por kilos.
- **"2XX - Bandejas" (Rango 200 - 299):** Productos fraccionados y envasados en bandejas de gramos específicos.
- **"3XX - Marketing y Difusión" (Rango 300 - 399):** Materiales impresos, folletos, banners y recursos de difusión comercial.
- **"4XX - Insumos y Materias Primas" (Rango 400 - 499):** Materias primas de proveedores y packaging.
- **"500 - 999":** Rangos libres para categorías adicionales configurables.

---

### 4. Lógica de Preventa, Control de Stock, Reserva y Sobredemanda
- **Modal Cargar Pedido de Preventa Multi-Producto:**
  - **Validación de Stock Insuficiente:** Si la cantidad de cualquier producto agregado al carrito supera las existencias físicas disponibles en depósito, el sistema despliega un banner de advertencia con el desglose (Solicitado vs. Disponible) y inhabilita (grisa) el botón **"Confirmar Venta y Generar OP"**.
  - **Guardar y Reservar Mercadería (Reservado):** Permite registrar el pedido en caso de sobre-demanda o falta de stock físico. El pedido queda en estado *RESERVA* y el producto registra un saldo reservado (-X*).
  - **Visualización de Alertas de Stock Reservado (-X*) en Inicio:** El Tablero de Inicio (Dashboard) destaca en la botonera superior de KPIs la tarjeta de **Preventas Registradas** y la sección de **Alertas de Stock** con anillos ámbar y badges explicativos "Alertas de Stock Reservado (-X*)".
  - **Trazabilidad Contable y Auditoría:** Al cancelar o modificar reservas en Cta. Cte., el saldo contable solo se afecta si la venta estaba en estado *Confirmado*. Las reservas canceladas liberan el stock de forma transparente sin generar registros de crédito ficticios en el estado de cuenta del cliente.

---

### 5. Logotipo Oficial, Datos de la Empresa y Recuperación
- **Datos de la Empresa & Logotipo Oficial:** El contenedor en Configuración administra Razón Social, RNE, RNPA, Dirección, Teléfono, WhatsApp, Instagram (@...) y Facebook (@...). Permite subir la imagen oficial de logotipo (JPG, PNG, EPS). Esta imagen se propaga en todo el sistema (membretes, favicon, comprobantes y reportes).
- **Persistencia en Google Drive & Respaldo JSON/ZIP:** Sincronización automática de copias de seguridad en Google Drive y restauración con modal de confirmación previa antes de sobreescribir datos.
- **Resiliencia y Error Boundaries:** Protección frente a errores de renderizado en cualquier subcomponente o modal mediante límites de captura de errores con botón de recuperación automática.

---

### 6. Manual de Operaciones y Producción
1. **Verificación de Sincronización en Inicio:** El temporizador calcula los segundos/minutos transcurridos desde el último cotejo contra Firebase.
2. **Cobro QR MP:** Disponible para cualquier cliente seleccionado incluso cuando el saldo pendiente es 0 (para recargas o pagos adelantados).
3. **Formatos de Impresión por Categoría:** Rótulos A4 (3x3 — 9 u), Etiqueta Individual (1 u), Stickers (5x6 — 30 u).
`;

