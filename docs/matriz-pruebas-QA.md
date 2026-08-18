# Matriz de Pruebas QA — FastFood OS
**Responsable:** QA
**Rol:** QA
**Fecha:** 12/07/2026
**Rama:** feat/backend-auth-orders

---

## HU-05 — Validación de formulario de login

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Resultado obtenido | Estado |
|----|---------------|--------------|-------|-------------------|-------------------|--------|
| TC-01 | Campos vacíos | App corriendo en localhost:5173 | 1. Ir a /login 2. Dejar campos vacíos 3. Clic en "Iniciar Sesión" | Muestra "Completa este campo" y bloquea el submit | Muestra "Completa este campo" en campo correo | ✅ PASÓ |
| TC-02 | Email sin formato válido | App corriendo en localhost:5173 | 1. Ir a /login 2. Escribir "adminsinArroba" en correo 3. Clic en "Iniciar Sesión" | Muestra error de formato de email y bloquea el submit | Muestra 'Incluye un signo "@"' y bloquea el submit |  PASÓ |
| TC-03 | Contraseña vacía con email válido | App corriendo en localhost:5173 | 1. Ir a /login 2. Escribir "admin@fastfood.com" 3. Dejar contraseña vacía 4. Clic en "Iniciar Sesión" | Muestra "Completa este campo" en contraseña | Muestra "Completa este campo" en contraseña |  PASÓ |
| TC-04 | Credenciales inválidas | Backend + BD corriendo | 1. Ir a /login 2. Escribir email y contraseña incorrectos 3. Clic en "Iniciar Sesión" | Responde 401 con mensaje de error sin especificar qué campo falló | Pendiente — BD no disponible al momento de la prueba |  PENDIENTE |
| TC-05 | Credenciales válidas | Backend + BD corriendo | 1. Ir a /login 2. Escribir "admin@fastfood.com" y "password" 3. Clic en "Iniciar Sesión" | Responde 200 con JWT y objeto usuario sin password_hash | Pendiente — BD no disponible al momento de la prueba |  PENDIENTE |

---

## HU-02 — Cierre de sesión seguro

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Resultado obtenido | Estado |
|----|---------------|--------------|-------|-------------------|-------------------|--------|
| TC-06 | Logout limpia el localStorage | Sesión activa con token | 1. Iniciar sesión 2. Presionar "Cerrar sesión" 3. Abrir DevTools → Application → LocalStorage | localStorage no debe tener token ni datos de usuario | Pendiente — requiere login funcional |  PENDIENTE |
| TC-07 | Logout redirige a /login | Sesión activa | 1. Iniciar sesión 2. Presionar "Cerrar sesión" | Redirige a /login automáticamente | Pendiente — requiere login funcional |  PENDIENTE |
| TC-08 | Token anterior da 401 tras logout | Sesión activa con token copiado | 1. Copiar token del login 2. Hacer logout 3. Usar token en Thunder Client en ruta protegida | Responde 401 Unauthorized | Pendiente — requiere login funcional |  PENDIENTE |
| TC-09 | Botón atrás no regresa al dashboard | Sesión cerrada | 1. Hacer logout 2. Presionar botón atrás del navegador | Permanece en /login o redirige a /login | Pendiente — requiere login funcional |  PENDIENTE |

---

## HU-QA-02 — Protección de rutas

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Resultado obtenido | Estado |
|----|---------------|--------------|-------|-------------------|-------------------|--------|
| TC-10 | Acceso a /dashboard sin login | Sin sesión activa | 1. Abrir navegador 2. Ir a localhost:5173/dashboard | Redirige a /login | Redirige a /login | PASÓ |
| TC-11 | Acceso a /cocina sin login | Sin sesión activa | 1. Abrir navegador 2. Ir a localhost:5173/cocina | Redirige a /login | Redirige a /login | PASÓ |
| TC-12 | Acceso a /mesero sin login | Sin sesión activa | 1. Abrir navegador 2. Ir a localhost:5173/mesero | Redirige a /login | Redirige a /login |  PASÓ |
| TC-13 | Acceso a /pedidos sin login | Sin sesión activa | 1. Abrir navegador 2. Ir a localhost:5173/pedidos | Redirige a /login | Redirige a /login |  PASÓ |

---

## HU-QA-01 — Prueba de endpoints de autenticación (Thunder Client)

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Resultado obtenido | Estado |
|----|---------------|--------------|-------|-------------------|-------------------|--------|
| TC-14 | POST /api/auth/login con credenciales válidas | Backend + BD corriendo | 1. Abrir Thunder Client 2. POST localhost:3000/api/auth/login 3. Body: { email, password } | 200 + token JWT | Pendiente — BD no disponible al momento de la prueba |  PENDIENTE |
| TC-15 | POST /api/auth/login con credenciales inválidas | Backend + BD corriendo | 1. POST localhost:3000/api/auth/login 2. Body con password incorrecta | 401 Unauthorized | Pendiente — BD no disponible al momento de la prueba |  PENDIENTE |
| TC-16 | POST /api/auth/logout con token válido | Token obtenido del login | 1. POST localhost:3000/api/auth/logout 2. Header: Authorization Bearer token | 200 sesión cerrada | Pendiente — endpoint no implementado aún en authController.js |  PENDIENTE |

---

## Bugs encontrados

| ID | Descripción | Severidad | HU relacionada | Estado |
|----|-------------|-----------|---------------|--------|
| BUG-01 | Endpoint POST /api/auth/logout no implementado en authController.js — solo existe función login |  Alta | HU-02 | Reportado al equipo |
| BUG-02 | BD Supabase no accesible desde servidor local — error ENOTFOUND al intentar login |  Media | HU-05, HU-QA-01 | Reportado — pendiente resolución |

---

## Notas
- Las pruebas TC-04 al TC-16 quedan pendientes por falta de conexión a BD al momento de ejecutar las pruebas.
- Se verificó que el componente `ProtectedRoute.jsx` funciona correctamente en el frontend.
- Se verificó que `clearAuth()` en `auth.js` elimina token y usuario del localStorage.
- El endpoint de logout **no existe** aún en el backend (solo existe `login` en `authController.js`).
