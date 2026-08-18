# ACT-5 – QA (Quality Assurance)

## Integrante

**Autor**  
Rol: QA / Delivery

---

# Objetivo

Definir cómo se verificará la calidad del sistema A La Burger OS para asegurar el correcto funcionamiento de sus módulos principales.

---

# Plan de Pruebas

## Login

- Inicio de sesión correcto.
- Contraseña incorrecta.
- Usuario inexistente.

## Pedidos

- Crear pedido.
- Editar pedido.
- Cancelar pedido.

## Inventario

- Actualización automática de stock.
- Validación de stock insuficiente.

## Ventas

- Registro correcto de venta.
- Generación de ticket.

## Dashboard

- Visualización de ventas.
- Visualización de productos más vendidos.
- Visualización de métricas por sucursal.

---

# Casos de Prueba

| ID | Caso de Prueba | Resultado Esperado |
|----|---------------|-------------------|
| CP-01 | Login correcto | Acceso permitido |
| CP-02 | Contraseña incorrecta | Mostrar mensaje de error |
| CP-03 | Crear pedido | Pedido guardado correctamente |
| CP-04 | Editar pedido | Pedido actualizado |
| CP-05 | Cancelar pedido | Pedido cancelado |
| CP-06 | Actualización de inventario | Stock actualizado automáticamente |
| CP-07 | Stock insuficiente | Mostrar alerta de inventario |
| CP-08 | Registrar venta | Venta almacenada correctamente |
| CP-09 | Generar ticket | Ticket generado correctamente |
| CP-10 | Consultar dashboard | Información mostrada correctamente |

---

# Estrategia de Validación

## Login

- Verificar acceso con credenciales válidas.
- Verificar rechazo con credenciales incorrectas.

## Pedidos

- Validar creación, edición y cancelación de pedidos.
- Verificar almacenamiento correcto de la información.

## Inventario

- Verificar actualización automática después de cada venta.
- Comprobar alertas de stock bajo.

## Ventas

- Validar registro correcto de ventas.
- Verificar generación automática de tickets.

## Dashboard

- Validar visualización de métricas.
- Verificar actualización de datos en tiempo real.

---

# Conclusión

La implementación de este plan de pruebas permitirá detectar errores de manera temprana y garantizar la calidad, confiabilidad y correcto funcionamiento de A La Burger OS antes de su despliegue.