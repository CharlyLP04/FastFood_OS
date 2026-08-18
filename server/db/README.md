# 🗄️ A La Burger OS — Base de Datos PostgreSQL

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Estado](https://img.shields.io/badge/Estado-Estable-brightgreen?style=for-the-badge)
![Versión](https://img.shields.io/badge/Versión-1.0.0-orange?style=for-the-badge)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue?style=for-the-badge)

> Esquema relacional completo para la gestión de pedidos, inventario, usuarios y ventas de **A La Burger** — diseñado para escalar a múltiples sucursales.

---

## 📁 Archivos

| Archivo | Descripción |
|---|---|
| [`schema.sql`](./schema.sql) | Script DDL completo: tablas, índices, triggers y seed data |
| [`README.md`](./README.md) | Documentación del esquema |

---

## 🏗️ Diagrama de Entidades

![Diagrama de Entidades — A La Burger OS](./Diagrama%20de%20Entidades.png)

---

## 📋 Tablas del Sistema

### 👥 Usuarios y Acceso

| Tabla | Descripción |
|---|---|
| `roles` | Perfiles de acceso del sistema: administrador, gerente, cajero, mesero |
| `usuarios` | Personal del restaurante. Contraseña almacenada con hash **bcrypt** |

### 🍔 Catálogo y Recetas

| Tabla | Descripción |
|---|---|
| `categorias` | Agrupación de productos: Hamburguesas, Bebidas, Complementos, Postres |
| `productos` | Catálogo completo con precio, imagen y disponibilidad |
| `ingredientes` | Insumos base con unidad de medida (kg, piezas, litros) |
| `producto_ingredientes` | Receta: ingredientes y cantidades requeridas por producto |

### 📦 Inventario

| Tabla | Descripción |
|---|---|
| `inventario` | Stock actual y stock mínimo por ingrediente. Genera alertas de reabasto |

### 🧾 Operación y Ventas

| Tabla | Descripción |
|---|---|
| `mesas` | Mesas físicas del restaurante (disponible / ocupada / reservada) |
| `pedidos` | Órdenes generadas: local o para llevar, con estado de cocina |
| `detalle_pedido` | Líneas de cada pedido con precio histórico y subtotal **generado automáticamente** |
| `ventas` | Ticket cerrado con subtotal, IVA, descuento y método de pago |

---

## ⚙️ Características Técnicas

| Característica | Detalle |
|---|---|
| **Motor** | PostgreSQL 16+ |
| **UUIDs** | Extensión `pgcrypto` para `gen_random_uuid()` |
| **Timestamps** | `created_at` / `updated_at` en todas las tablas |
| **Auto-update** | Trigger `actualizar_updated_at()` en cada tabla |
| **Columna generada** | `subtotal` en `detalle_pedido` (calculado como `cantidad × precio_unitario`) |
| **Índices** | 10 índices en columnas de alta consulta (email, estado, mesa_id, etc.) |
| **Integridad** | Claves foráneas con `ON DELETE RESTRICT / CASCADE / SET NULL` según la entidad |

---

## 🚀 Cómo ejecutar

### Prerrequisitos

- PostgreSQL 14 o superior corriendo
- Variable `DB_URL` configurada en `server/.env` (ver `server/.env.example`)

### Ejecutar el schema

```bash
# Usando psql con la variable de entorno
psql $DB_URL -f server/db/schema.sql

# O con parámetros explícitos
psql -h localhost -U tu_usuario -d fastfood_db -f server/db/schema.sql
```

> El script es **idempotente**: usa `CREATE TABLE IF NOT EXISTS` y `ON CONFLICT DO NOTHING`, por lo que puede ejecutarse múltiples veces sin errores.

---

## 🌱 Datos Semilla Incluidos

El script incluye datos de prueba listos para desarrollo:

| Entidad | Cantidad | Detalle |
|---|---|---|
| Roles | 4 | administrador, gerente, cajero, mesero |
| Usuarios | 3 | admin, mesero, cajero con contraseñas hasheadas |
| Categorías | 4 | Hamburguesas 🍔, Bebidas 🥤, Complementos 🍟, Postres 🍦 |
| Productos | 5 | Classic Burger, Double Smash, BBQ Crispy, Papas Clásicas, Refresco |
| Ingredientes | 8 | Pan brioche, carne de res, queso cheddar, lechuga, tomate... |
| Mesas | 5 | Capacidades de 2 a 6 personas |

### Credenciales de prueba

| Usuario | Email | Contraseña |
|---|---|---|
| Administrador | `admin@fastfood.com` | `admin123` |
| Mesero | `mesero@fastfood.com` | `mesero123` |
| Cajero | `cajero@fastfood.com` | `cajero123` |

> ⚠️ **Importante:** Cambia estos hashes antes de pasar a producción.

---

## 📌 Criterios de Aceptación — Issue #36

- [x] Sentencias DDL para las entidades **sucursales** (mesas), **usuarios**, **pedidos** e **ingredientes**
- [x] Código almacenado en `server/db/schema.sql` dentro del repositorio
