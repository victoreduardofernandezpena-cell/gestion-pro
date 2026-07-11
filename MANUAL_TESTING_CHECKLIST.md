# Manual Testing Checklist - Beta Real

Usa este checklist en un entorno controlado con una base de datos de prueba o piloto. Marca cada punto por empresa y por rol cuando aplique.

## Reglas generales de beta

- [ ] No aparece ninguna pantalla en blanco al navegar por los modulos.
- [ ] No aparece texto `undefined`, `NaN` ni mensajes tecnicos confusos.
- [ ] Los errores muestran mensajes claros para el usuario.
- [ ] Las tablas, formularios, modales y graficos cargan con pocos datos y con cero datos.
- [ ] Los listados con muchos registros permiten navegar sin cargar todo de golpe cuando hay paginacion disponible.
- [ ] Las acciones sensibles quedan registradas en auditoria cuando aplica.

## Login, sesion y logout

- [ ] Ver opcion Crear negocio cuando `VITE_DISABLE_PUBLIC_REGISTER=false`.
- [ ] Ocultar Crear negocio cuando `VITE_DISABLE_PUBLIC_REGISTER=true`.
- [ ] Crear negocio desde cero con nombre, admin, email y contrasena.
- [ ] Confirmar que el usuario no escribe codigo de compania en el registro.
- [ ] Confirmar que el sistema muestra codigo generado tipo `MI-TIENDA-1234`.
- [ ] Copiar codigo generado desde la pantalla de exito.
- [ ] Volver a login con el codigo generado.
- [ ] Login con credenciales validas.
- [ ] Login con email no registrado.
- [ ] Login con password incorrecto.
- [ ] Login con codigo de compania invalido.
- [ ] Login con usuario inactivo muestra mensaje claro.
- [ ] Login con compania inactiva muestra mensaje claro.
- [ ] Rate limit de login funciona cuando `DISABLE_LOGIN_RATE_LIMIT=false`.
- [ ] Logout limpia token, usuario y empresa locales.
- [ ] Sesion expirada o token invalido limpia datos locales y redirige a login.
- [ ] Usuario con cambio obligatorio de contrasena solo puede entrar al flujo de cambio.

## Multiempresa

- [ ] Cada login exige codigo de compania.
- [ ] Crear un negocio llamado Realengo y otro llamado DASA sin depender del seed.
- [ ] Confirmar que cada negocio inicia sin clientes, productos, facturas ni compras demo.
- [ ] Confirmar que cada negocio recibe almacen principal y caja principal si esos modulos estan activos.
- [ ] El mismo usuario puede entrar solo a empresas asignadas.
- [ ] Usuario admin de negocio A no puede entrar al codigo de negocio B si no esta asignado.
- [ ] El rol se respeta por empresa.
- [ ] Clientes, productos, facturas, compras, reportes, configuracion y fidelizacion no cruzan datos entre empresas.
- [ ] Logos, RNC, numeracion y textos de documentos son propios de cada empresa.
- [ ] Configuracion > Empresa muestra codigo de compania solo lectura y permite copiarlo.

## Dashboard

- [ ] Dashboard carga para admin.
- [ ] Dashboard carga para ventas.
- [ ] Dashboard carga para almacen.
- [ ] Dashboard carga para contabilidad.
- [ ] Los indicadores se filtran por rol.
- [ ] Los filtros Hoy, Semana, Mes, Trimestre, Ano y Personalizado funcionan.
- [ ] Graficos y listas no fallan con cero datos.
- [ ] Alertas se muestran solo para datos permitidos por rol.
- [ ] No se ven totales de modulos no autorizados.

## Clientes

- [ ] Ventas puede entrar a Clientes.
- [ ] Admin puede entrar a Clientes.
- [ ] Almacen y contabilidad ven Unauthorized si entran por URL directa.
- [ ] Crear cliente con datos validos segun permisos disponibles.
- [ ] Editar cliente existente segun permisos disponibles.
- [ ] Validar email invalido.
- [ ] Validar duplicados de RNC o identificacion si aplica.
- [ ] Buscar o filtrar clientes.
- [ ] Paginacion de clientes conserva la busqueda al cambiar de pagina.

## Productos

- [ ] Ventas puede consultar productos.
- [ ] Almacen puede gestionar productos.
- [ ] Admin puede gestionar productos.
- [ ] Crear producto con precio y costo validos.
- [ ] Bloquear montos negativos.
- [ ] Validar codigo duplicado con mensaje claro.
- [ ] Editar producto.
- [ ] Eliminar o inactivar producto segun reglas actuales.
- [ ] La tabla responde bien en movil.

## Inventario

- [ ] Almacen puede entrar a Inventario.
- [ ] Ventas y contabilidad ven Unauthorized si entran por URL directa.
- [ ] Registrar entrada de inventario.
- [ ] Registrar salida con stock suficiente.
- [ ] Bloquear salida con stock insuficiente.
- [ ] Registrar ajuste con motivo.
- [ ] Ver historial de movimientos.
- [ ] Filtros por producto/almacen funcionan.
- [ ] Busqueda y paginacion de inventario no mezclan productos de otra empresa.

## Almacenes

- [ ] Almacen puede entrar a Almacenes.
- [ ] Crear almacen.
- [ ] Editar almacen.
- [ ] Activar o desactivar almacen.
- [ ] Validar duplicados con mensaje claro.

## Marcas

- [ ] Almacen puede entrar a Marcas.
- [ ] Crear marca.
- [ ] Editar marca.
- [ ] Activar o desactivar marca.
- [ ] Validar duplicados con mensaje claro.

## Facturacion

- [ ] Ventas puede crear factura.
- [ ] Contabilidad puede consultar facturas.
- [ ] Admin puede consultar y gestionar facturas.
- [ ] Crear factura con cliente y productos validos.
- [ ] La factura descuenta inventario.
- [ ] Validar stock insuficiente.
- [ ] Cancelar factura y devolver inventario segun reglas actuales.
- [ ] Ver detalle de factura.
- [ ] Estado cambia correctamente entre pendiente, parcial, pagada y cancelada.

## Pagos de facturas

- [ ] Registrar pago simple en efectivo.
- [ ] Registrar pago simple por banco/transferencia.
- [ ] Registrar pago parcial.
- [ ] Registrar pago completo.
- [ ] Registrar pago multiple con varios metodos.
- [ ] Bloquear monto cero o negativo.
- [ ] Bloquear pago mayor al balance pendiente.
- [ ] Actualizar balance, estado de factura, banco/caja y cuentas por cobrar.
- [ ] Movimiento de banco o caja generado por pago conserva documento origen y numero de factura.

## PDF de factura

- [ ] Descargar PDF desde detalle de factura.
- [ ] PDF abre sin error.
- [ ] PDF muestra empresa, RNC, direccion, telefono, cliente, productos, impuestos, total y balance.
- [ ] PDF usa logo de la empresa cuando esta configurado.
- [ ] PDF no muestra datos de otra empresa.

## Compras

- [ ] Contabilidad puede entrar a Compras.
- [ ] Almacen y ventas ven Unauthorized si entran por URL directa.
- [ ] Crear proveedor.
- [ ] Crear compra con productos validos.
- [ ] La compra aumenta inventario.
- [ ] Registrar pago parcial.
- [ ] Registrar pago completo.
- [ ] Cancelar compra y revertir inventario segun reglas actuales.
- [ ] Descargar PDF de compra si esta disponible.

## Cuentas por cobrar

- [ ] Ver facturas pendientes y parciales.
- [ ] Abrir factura desde acciones.
- [ ] Registrar pago desde detalle.
- [ ] Confirmar actualizacion de balance y estado.
- [ ] Filtros muestran datos correctos.

## Cuentas por pagar

- [ ] Contabilidad puede ver cuentas por pagar.
- [ ] Almacen y ventas ven Unauthorized si entran por URL directa.
- [ ] Ver compras pendientes y parciales.
- [ ] Abrir compra desde acciones.
- [ ] Registrar pago desde detalle.
- [ ] Confirmar actualizacion de balance y estado.

## Banco

- [ ] Contabilidad puede entrar a Banco.
- [ ] Crear cuenta bancaria.
- [ ] Registrar deposito.
- [ ] Registrar retiro.
- [ ] Registrar transferencia.
- [ ] Bloquear montos invalidos.
- [ ] Validar balances despues de pagos, gastos y transferencias.
- [ ] Movimientos automaticos muestran origen de pago, gasto o transferencia cuando aplica.

## Caja chica

- [ ] Contabilidad puede entrar a Caja chica.
- [ ] Crear caja.
- [ ] Registrar entrada.
- [ ] Registrar salida.
- [ ] Bloquear salida mayor al balance.
- [ ] Validar balances despues de pagos y gastos.
- [ ] Movimientos automaticos muestran origen de pago o gasto cuando aplica.

## Gastos

- [ ] Contabilidad puede entrar a Gastos.
- [ ] Registrar gasto desde banco.
- [ ] Registrar gasto desde caja chica.
- [ ] Registrar gasto desde otra fuente.
- [ ] Bloquear montos en cero o negativos.
- [ ] Filtros por fecha/categoria funcionan.
- [ ] Gasto pagado desde banco o caja conserva origen financiero en el movimiento relacionado.

## Reportes

- [ ] Contabilidad puede entrar a Reportes.
- [ ] Ventas y almacen ven Unauthorized si entran por URL directa.
- [ ] Reporte de ventas carga y filtra.
- [ ] Reporte de compras carga y filtra.
- [ ] Reporte de inventario carga y filtra.
- [ ] Reportes de cuentas por cobrar y por pagar cargan.
- [ ] Reportes de banco, caja chica, gastos y contabilidad cargan.
- [ ] Exportar CSV/Excel cuando aplique.
- [ ] Exportar o imprimir PDF cuando aplique.
- [ ] No aparecen totales `NaN` con cero datos.

## Seguridad, usuarios y auditoria

- [ ] Admin puede crear usuario.
- [ ] Admin puede cambiar rol.
- [ ] Admin puede inactivar usuario.
- [ ] No se puede desactivar el ultimo admin activo de la compania.
- [ ] Reset de contrasena obliga cambio al proximo login.
- [ ] Admin ve auditoria.
- [ ] Ventas, almacen y contabilidad no ven Seguridad ni Auditoria.
- [ ] Acceso directo a rutas sin permiso muestra Unauthorized.
- [ ] API devuelve 401 sin token, 403 sin permiso y 404 en rutas inexistentes.
- [ ] Registro publico queda bloqueado cuando `DISABLE_PUBLIC_REGISTER=true`.

## Configuracion

- [ ] Admin puede editar datos de empresa.
- [ ] Admin puede configurar impuestos.
- [ ] Admin puede configurar numeracion.
- [ ] Admin puede configurar categorias.
- [ ] Admin puede configurar textos de documentos.
- [ ] Cambios no afectan otra empresa.

## Fidelizacion

- [ ] Ventas puede entrar a Fidelizacion.
- [ ] Contabilidad y almacen ven Unauthorized si entran por URL directa.
- [ ] Ver resumen de fidelizacion.
- [ ] Consultar cuenta de fidelidad de cliente.
- [ ] Ver movimientos de puntos/credito.
- [ ] Redimir credito segun reglas actuales.
- [ ] Validar balances ganado, redimido y disponible.
- [ ] Admin puede configurar fidelizacion.

## Modo claro/oscuro

- [ ] Cambiar entre tema claro y oscuro.
- [ ] Confirmar persistencia tras recargar.
- [ ] Revisar contraste en sidebar, navbar, tarjetas, tablas, formularios y modales.
- [ ] Graficos se leen correctamente en ambos temas.

## Responsive

- [ ] Login funciona en movil.
- [ ] Sidebar movil abre y cierra.
- [ ] Dashboard funciona en movil, tablet y escritorio.
- [ ] Tablas hacen scroll horizontal sin romper layout.
- [ ] Modales y formularios caben en pantallas pequenas.
- [ ] Botones y textos no se montan unos sobre otros.

## Cierre de beta

- [ ] Ejecutar build frontend.
- [ ] Verificar backend con health check.
- [ ] Verificar estado de migraciones Prisma.
- [ ] Revisar permisos finales por rol.
- [ ] Crear backup antes de pruebas con datos reales.
- [ ] Probar restauracion en ambiente aparte.
