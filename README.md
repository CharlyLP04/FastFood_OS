# 🍔 A La Burger OS 

> Sistema operativo de gestión gastronómica, comandas, inventario y punto de venta en tiempo real para A La Burger.

---

## 🔑 Credenciales de Prueba (Demo Accounts)

Para explorar la plataforma según los distintos roles de trabajo del restaurante:

| Rol | Usuario | Contraseña | Permisos y Accesos |
| :--- | :--- | :--- | :--- |
| 👑 **Administrador** | `admin` | `admin123` | Acceso completo (Dashboard, Inventario, Productos, Usuarios, Movimientos) |
| 🧑‍🍳 **Cocina / KDS** | `cocina` | `cocina123` | Pantalla KDS en tiempo real para preparación y despacho de comandas |
| 📝 **Mesero** | `mesero` | `mesero123` | Aplicación móvil/pos para toma de pedidos por mesa o mostrador |
| 💰 **Cajero** | `cajero` | `cajero123` | Cobro de cuentas, arqueo de caja y emisión de tickets |

> 💡 **Nota de reinicio de credenciales**: Si deseas restablecer las cuentas de prueba por defecto en la base de datos, ejecuta:
> ```bash
> cd server
> node reset-admin-user.js
> ```

---

## 🚀 ¿Qué problema resuelve?

**A La Burger OS** digitaliza la operación completa de la hamburguesería: desde que el mesero toma el pedido en mesa hasta la cola de preparación en cocina, cobro en caja y descuento automático de insumos en inventario.

---

## ✨ Funcionalidades Principales

- 🧾 **Toma de comandas en tiempo real**: Selección rápida de platillos, adiciones y mesa.
- 🍳 **KDS (Kitchen Display System)**: Pantalla de cocina con estados ("Nuevo", "Preparando", "Listo").
- 📦 **Control de Inventario y Mermas**: Descuento automático de materia prima y registro de mermas.
- 📊 **Dashboard Ejecutivo por Periodos**: Analítica interactiva (Hoy, 7 Días, 30 Días) con tendencia de ventas y top platillos.
- 🔔 **Centro de Notificaciones Neón**: Alertas inmediatas de stock bajo y actualización de pedidos.
- 🔐 **Autenticación Fuerte & Roles**: Control de acceso granular (Administrador, Cocina, Mesero, Cajero).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | React 18 + Vite + Vanilla CSS / Tailwind (Glassmorphism UI) |
| **Backend** | Node.js + Express + Middlewares de Seguridad |
| **Base de datos** | PostgreSQL (Neon.tech con SSL) |
| **Autenticación** | JWT en Cookies httpOnly seguras |
| **Iconografía y Fuentes** | Lucide Vector SVGs + Google Fonts (Poppins / Inter) |

---

## 📁 Estructura del Proyecto

```text
alaburger-os/
├── client/              # Frontend React + Vite
│   ├── src/
│   │   ├── components/  # Componentes UI (Toast, Skeleton, Layout, Icon)
│   │   ├── pages/       # Vistas (Dashboard, Inventario, Productos, KDS, Caja, Mesero)
│   │   ├── services/    # Cliente de API centralizado
│   │   └── utils/       # Auth helpers y formateadores
├── server/              # Backend Node.js + Express
│   ├── src/
│   │   ├── config/      # DB Connection, Helmet, CORS, Env Validation
│   │   ├── controllers/ # Lógica de negocio (auth, dashboard, inventory, etc.)
│   │   ├── middleware/  # Admin, Auth y CheckRole
│   │   └── routes/      # Endpoints REST
│   └── reset-admin-user.js # Script de inicialización de credenciales de prueba
└── README.md
```

---

## ⚙️ Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/CharlyLP04/alaburger-os.git
cd alaburger-os
```

### 2. Instalar dependencias

**Backend:**
```bash
cd server
npm install
npm start
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

---

## 👥 Equipo de Desarrollo

| Nombre | Rol |
| :--- | :--- |
| **Olaya Gutiérrez Carlos** | Tech Lead / Full Stack Engineer |
| **Castañeda Sánchez Dana Lizbeth** | Product Owner |
| **Montalvo Osorio Alexis** | Product Engineer |
| **Flores Osorio Jarumi Guadalupe** | QA / Delivery |
| **Reyes Torres Manelic Alitzel** | Growth Lead |

---

## 📌 Tablero de Avances

[Ver tablero de GitHub Issues →](https://github.com/CharlyLP04/alaburger-os/issues)
