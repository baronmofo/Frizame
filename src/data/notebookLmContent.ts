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

### 2. Arquitectura de Datos y Rangos de Código
El sistema organiza los códigos de producto en rangos prefijados para facilitar la identificación y segmentación:
- **"1XX - Granel (Kg)" (Rango 100 - 199):** Productos comercializados a granel por kilos.
- **"2XX - Bandejas" (Rango 200 - 299):** Productos fraccionados y envasados en bandejas de gramos específicos.
- **"3XX - Marketing y Difusión" (Rango 300 - 399):** Materiales impresos, folletos, banners y recursos de difusión comercial.
- **"4XX - Insumos y Materias Primas" (Rango 400 - 499):** Materias primas de proveedores y packaging.
- **"500 - 999":** Rangos libres para categorías adicionales configurables.

---

### 3. Lógica Híbrida de Merma, Persistencia Automática, Seguridad y Permisos
- **Lógica Híbrida de Merma (Diferenciación por Solapa):**
  - **En Fraccionamiento (Solapa 4-2):** El campo de "% Merma Operativa" carga por defecto el porcentaje 'mermaPct' configurado para la categoría destino (ej. 3.5% para Bandeja 2XX), pero permanece **editable por el operador** para registrar imprevistos o mermas excepcionales (rotura de producto, pérdidas de manipulación).
  - **En Desglose de Costos (Solapa 5-1):** El campo de "% Merma Fija (Categoría)" es strictly **Read-Only (Solo Lectura)**. Recupera y muestra obligatoriamente el 'mermaPct' oficial asignado a la categoría en la configuración del sistema, garantizando que el cálculo de precio de costo, precio sugerido y márgenes de ganancia no sufran alteración o manipulación manual.
- **Fórmula de Costo Unitario de Bandeja (2XX):**
  $$\\text{Costo MP} = \\sum (\\text{Cantidad Insumo (g)} \\times \\text{Costo/g})$$
  $$\\text{Costo con Merma Fija} = \\text{Costo MP} \\times \\left(1 + \\frac{\\%\\text{Merma Categoría}}{100}\\right)$$
  $$\\text{Sobrecostos Fijos} = \\text{Flete} + \\text{Mano de Obra Directa} + \\text{Packaging} + \\text{Energía/Gas}$$
  $$\\text{Costo Unitario Final Bandeja} = \\text{Costo con Merma Fija} + \\text{Sobrecostos Fijos}$$

- **Persistencia Automática en Google Drive y Respaldo ZIP Auditoría:**
  - En la pestaña **6. Configuración**, subpestaña **4. Base de Datos y Sistema**, se define el **Google Drive Folder ID**.
  - Tras cada evento crítico de **Venta** o **Fraccionamiento**, el sistema genera automáticamente un paquete de respaldo comprimido en formato **.ZIP** con la nomenclatura:
    frizame_backup_YYYYMMDD_HHMM.zip
  - El archivo ZIP incluye todos los estados del sistema: products.json, clients.json, settings.json, history.json, movements.json, rawMaterials.json, orders.json, suppliers.json.

- **Seguridad, Control de Acceso y Restricciones del Rol Vendedor:**
  - **Seguridad de Restablecimiento:** Para ejecutar la función **Restablecer Datos Iniciales de Fábrica** en la Solapa 6-4, el sistema requiere ingresar y validar obligatoriamente la **Contraseña de Administrador** (ej: frizame2026). Se deniega el acceso si la clave ingresada no es válida.
  - **Ocultamiento de Contraseñas y Filtrado de Administradores para Vendedores:** Los usuarios con rol **Vendedor** no pueden visualizar las contraseñas de los usuarios (mascaradas con puntos ocultos estáticos sin botón de desocultado). Asimismo, los usuarios de rol superior (**Administrador**) son filtrados automáticamente de la tabla de gestión de usuarios cuando un Vendedor accede a la configuración, evitando que este modifique, elimine o altere permisos de las cuentas administradoras.
  - **Segmentación de Subpestañas:** Para el rol Vendedor, el módulo de Configuración habilita únicamente las subpestañas autorizadas (*Usuarios y Permisos* y *Colorimetría y Temas*), ocultando el acceso a *Categorías*, *Parámetros*, *Base de Datos* y *Cuaderno NotebookLM*, reservadas en exclusiva para el rol Administrador.

---

### 4. Estructura de Historial Auditable (history.json)
Cada evento de Venta, Fraccionamiento, Cobro o Ajuste se registra en history.json con ID único, timestamp, usuario responsable y desglose de impacto en stock y finanzas:

{
  "id": "hist-1722026000000",
  "timestamp": "2026-07-26T19:00:00.000Z",
  "tipoEvento": "Fraccionamiento",
  "usuarioResponsable": "Administrador",
  "impactoStock": [
    {
      "itemId": "101",
      "itemType": "Product",
      "codigo": "101",
      "nombre": "BASTONCITOS MOZZARELLA X KG",
      "tipoStock": "GranelKg",
      "stockAnterior": 50,
      "stockNuevo": 40,
      "deltaStock": -10,
      "unidad": "Kg"
    },
    {
      "itemId": "201",
      "itemType": "Product",
      "codigo": "201",
      "nombre": "BASTONCITOS MOZZARELLA BANDEJA",
      "tipoStock": "Bandejas",
      "stockAnterior": 0,
      "stockNuevo": 24,
      "deltaStock": 24,
      "unidad": "Bandejas"
    }
  ],
  "impactoFinanciero": {
    "montoTotal": 0
  },
  "detalles": "Fraccionamiento: BASTONCITOS MOZZARELLA (-10 Kg) ➔ BASTONCITOS MOZZARELLA BANDEJA (+24 Band.) [Merma Categoría Teórica: 3.5% | Merma Real Operativa: 5.0%]"
}

---

### 5. Manual de Operaciones
1. **Formatos de Impresión por Categoría:**
   - **Productos:** Rótulos A4 (3x3 — 9 u), Etiqueta Individual (1 u), Stickers (5x6 — 30 u).
   - **Materia Prima:** Rótulos A4 (3x3 — 9 u), Etiqueta Individual (1 u).
   - **Otro / Marketing:** A4 Apaisada, A4 Vertical, Legal Apaisada, Legal Vertical.
2. **Control de Lotes y Vencimiento Automático:**
   - Formato de Lote: L2026-XXX.
   - Cálculo automático de fecha de vencimiento según política de conservación a -18°C.
3. **Sistema de Autenticación, Auditoría de Sesión y Control de Roles Consolidados:**
   - **Inicio de Sesión Unificado:** Acceso protegido mediante validación de correo electrónico y contraseña. La pantalla de login preserva la privacidad del sistema sin exponer credenciales ni listas públicas de usuarios.
   - **Cierre de Sesión Seguro:** El botón **"Salir"** en el encabezado destruye el token de sesión activo y redirige automáticamente al usuario a la pantalla de login.
   - **Consolidación de Roles Activos:** El sistema consolida los roles de operación en **Administrador** (Acceso Total y Configuración Global) y **Vendedor** (Gestión Comercial, Clientes y Preventas).
   - **Edición Protegida de Usuarios (Subsolapa 6-3 / 3):**
     - El campo de **Correo Electrónico (Email)** es **Inmutable (Solo Lectura)** para asegurar la continuidad de la auditoría.
     - Un usuario con rol Vendedor solo puede crear o editar usuarios de rol Vendedor; la asignación del rol Administrador está deshabilitada.
     - Las contraseñas para los Vendedores permanecen totalmente ocultas (enmascaradas en modo solo lectura), y los usuarios Administradores no se muestran en su listado.
4. **Reseteo de Cuentas Corrientes e Historiales Comercial / Proveedores:**
   - Todas las cuentas corrientes de **Clientes** y **Proveedores** están inicializadas con **saldo cero ($0.00)** y con su historial de movimientos/transacciones totalmente vaciado ('historial: []').
   - Se han eliminado las preventas anteriores (órdenes OP) y salidas de preventa para ofrecer un punto de inicio contable limpio.

---

### 6. Configuraciones Avanzadas
- **Matriz de Permisos por Rol Consolidado:**
  - **Administrador:** Acceso ilimitado a todas las funciones, mantenimiento de base de datos, parámetros de sobrecostos, reglas de código, categorías, exportación de respaldos .ZIP y visibilidad de claves de usuarios.
  - **Vendedor:** Acceso comercial a preventas, clientes, facturación y gestión restringida de usuarios (sin acceso a claves de terceros ni usuarios Administradores, y sin acceso a configuraciones críticas del sistema).
- **Control de Inmutabilidad de Identidad:** La dirección de correo electrónico del usuario no se puede alterar una vez registrado.
- **Cuentas Corrientes en Cero:** Sincronización limpia de saldos e historiales comerciales para todos los clientes y proveedores.
- **Respaldos ZIP Auditable:** Descarga e importación en 1 clic de archivos frizame_backup_YYYYMMDD_HHMM.zip con estado completo de la base de datos y logs de usuario.
`;

