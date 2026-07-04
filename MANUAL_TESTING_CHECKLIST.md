# Manual Testing Checklist

## Login

- [ ] Login con credenciales validas.
- [ ] Login con password incorrecto.
- [ ] Login con email no registrado.
- [ ] Bloqueo por rate limit tras varios intentos fallidos cuando `DISABLE_LOGIN_RATE_LIMIT=false`.
- [ ] Logout limpia sesion local.

## Multiempresa

- [ ] Login usando codigo de compania valido.
- [ ] Probar login del mismo admin en dos codigos de compania diferentes.
- [ ] Confirmar que cada usuario solo ve companias asignadas.
- [ ] Cambiar de compania si el flujo esta disponible.
- [ ] Confirmar que clientes, productos, facturas, compras, reportes y configuracion no cruzan datos entre empresas.
- [ ] Confirmar que roles por compania se respetan.

## Dashboard avanzado

- [ ] Carga indicadores principales segun rol.
- [ ] Cambiar filtro a Hoy, Semana, Mes, Trimestre, Ano y Personalizado.
- [ ] Ver graficos principales sin `NaN` ni `undefined`.
- [ ] Revisar alertas, actividad reciente y listas top.
- [ ] Responde en vista movil.
- [ ] No muestra errores con datos vacios.

## Tema claro/oscuro

- [ ] Cambiar entre tema claro y oscuro.
- [ ] Confirmar persistencia del tema tras recargar.
- [ ] Revisar tablas, formularios, tarjetas, graficos y modales en ambos temas.
- [ ] Confirmar contraste legible en sidebar, navbar y botones.

## Clientes

- [ ] Crear cliente con datos validos.
- [ ] Validar email invalido.
- [ ] Editar cliente existente.
- [ ] Buscar o filtrar cliente.
- [ ] Evitar duplicados de RNC si aplica.

## Productos

- [ ] Crear producto con precio y costo validos.
- [ ] Bloquear montos negativos.
- [ ] Editar producto.
- [ ] Validar codigo duplicado.
- [ ] Revisar responsive de tabla.

## Inventario

- [ ] Registrar entrada.
- [ ] Registrar salida con stock suficiente.
- [ ] Bloquear stock negativo.
- [ ] Ver historial de movimientos.

## Facturacion

- [ ] Crear factura y descontar inventario.
- [ ] Registrar pago parcial.
- [ ] Registrar pago completo.
- [ ] Cancelar factura y devolver inventario.
- [ ] Descargar o imprimir PDF.
- [ ] Confirmar que el PDF usa datos reales de empresa y logo si existe.

## Compras

- [ ] Crear compra y aumentar inventario.
- [ ] Registrar pago parcial.
- [ ] Registrar pago completo.
- [ ] Cancelar compra y descontar inventario.
- [ ] Descargar o imprimir PDF.

## Cuentas por cobrar

- [ ] Ver facturas pendientes y parciales.
- [ ] Abrir factura desde acciones.
- [ ] Registrar pago desde detalle.
- [ ] Confirmar actualizacion de balance y estado.

## Cuentas por pagar

- [ ] Ver compras pendientes y parciales.
- [ ] Abrir compra desde acciones.
- [ ] Registrar pago desde detalle.
- [ ] Confirmar actualizacion de balance y estado.

## Banco

- [ ] Crear cuenta bancaria.
- [ ] Registrar deposito.
- [ ] Registrar retiro.
- [ ] Registrar transferencia.
- [ ] Validar balances.

## Caja chica

- [ ] Crear caja.
- [ ] Registrar entrada.
- [ ] Registrar salida.
- [ ] Validar balances.

## Gastos

- [ ] Registrar gasto desde banco.
- [ ] Registrar gasto desde caja chica.
- [ ] Registrar gasto desde otra fuente.
- [ ] Bloquear montos en cero o negativos.

## Contabilidad

- [ ] Crear cuenta contable.
- [ ] Crear asiento balanceado.
- [ ] Bloquear asiento con debito distinto a credito.
- [ ] Ver detalle de asiento.
- [ ] Revisar reportes contables.

## Reportes

- [ ] Filtrar reporte de ventas.
- [ ] Filtrar reporte de compras.
- [ ] Filtrar reportes de inventario, gastos, banco, caja chica, cuentas por cobrar y cuentas por pagar.
- [ ] Exportar CSV.
- [ ] Exportar PDF.
- [ ] Imprimir reporte.

## Fidelizacion

- [ ] Ver resumen de fidelizacion.
- [ ] Crear o consultar cuenta de fidelidad de cliente.
- [ ] Ver movimientos de puntos/credito.
- [ ] Confirmar balances ganado, redimido y disponible.
- [ ] Ver detalle de cuenta de fidelidad.
- [ ] Validar configuracion de fidelizacion.
- [ ] Confirmar que ventas autorizadas ven solo lo permitido.

## Finanzas

- [ ] Entrar a Finanzas como admin.
- [ ] Entrar a Finanzas como contabilidad.
- [ ] Confirmar que ventas y almacen no acceden.
- [ ] Cambiar filtros de periodo.
- [ ] Ver ventas, gastos, ganancia, efectivo disponible y posicion neta.
- [ ] Ver cuentas por cobrar y cuentas por pagar.
- [ ] Ver flujo de caja, rentabilidad por producto, top clientes y aging.
- [ ] Ver alertas financieras y proyecciones.
- [ ] Confirmar que no hay `NaN` ni `undefined`.

## Impuestos

- [ ] Entrar a Impuestos como admin.
- [ ] Entrar a Impuestos como contabilidad.
- [ ] Confirmar que ventas y almacen no acceden.
- [ ] Cambiar filtros de periodo.
- [ ] Ver ITBIS cobrado, ITBIS pagado, estimado a pagar o saldo a favor.
- [ ] Ver facturas, compras y gastos del periodo.
- [ ] Ver grafico mensual y alertas fiscales.
- [ ] Usar boton Imprimir.
- [ ] Abrir/Pagar facturas o compras parciales desde acciones.
- [ ] Confirmar que no hay `NaN` ni `undefined`.

## Recursos Humanos

- [ ] Entrar a Recursos Humanos como admin.
- [ ] Confirmar que contabilidad no accede a Recursos Humanos.
- [ ] Confirmar que ventas y almacen no acceden.
- [ ] Crear departamento.
- [ ] Crear puesto.
- [ ] Crear empleado.
- [ ] Editar empleado.
- [ ] Cambiar estado de empleado.
- [ ] Registrar asistencia.
- [ ] Editar asistencia.
- [ ] Crear nomina.
- [ ] Aprobar nomina.
- [ ] Pagar nomina.
- [ ] Registrar pago individual a empleado.
- [ ] Ver detalle de empleado.
- [ ] Ver reporte de nomina.
- [ ] Ver reporte de asistencia.
- [ ] Confirmar que no hay `NaN` ni `undefined`.

## Seguridad

- [ ] Crear usuario.
- [ ] Cambiar rol.
- [ ] Inactivar usuario.
- [ ] Validar que usuario no admin no vea modulos admin.
- [ ] Validar permisos de admin, ventas, almacen y contabilidad.
- [ ] Revisar logs de auditoria.

## Configuracion

- [ ] Editar datos de empresa.
- [ ] Configurar impuestos.
- [ ] Configurar numeracion.
- [ ] Configurar categorias.
- [ ] Configurar textos de documentos.

## Logo empresarial y uploads

- [ ] Cargar logo empresarial si la configuracion lo permite.
- [ ] Confirmar vista previa del logo.
- [ ] Confirmar que facturas/PDFs usan el logo correcto.
- [ ] Confirmar que el logo no se comparte entre empresas.
- [ ] Confirmar que `backend/uploads` conserva archivos tras reiniciar la app.

## Backups

- [ ] Entrar a Sistema como admin.
- [ ] Ver estado del sistema.
- [ ] Crear backup.
- [ ] Descargar backup.
- [ ] Eliminar backup con confirmacion.
- [ ] Intentar restaurar y confirmar que exige `RESTAURAR`.
- [ ] Confirmar que la restauracion automatica queda deshabilitada.
- [ ] Probar restauracion manual en ambiente de prueba.

## Piloto con cliente real

- [ ] Crear dos empresas limpias con codigos distintos.
- [ ] Crear admin real y completar cambio obligatorio de contrasena.
- [ ] Configurar logo, RNC, direccion, telefono y numeracion por empresa.
- [ ] Crear cuentas bancarias y cajas reales antes de registrar cobros o pagos.
- [ ] Registrar ventas, compras, gastos y pagos reales de bajo riesgo.
- [ ] Revisar finanzas e impuestos por cada empresa.
- [ ] Confirmar que el cliente no ve datos de otra empresa.
