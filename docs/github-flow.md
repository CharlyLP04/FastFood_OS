# 🔀 GitHub Flow — Dulce & Orden

Este documento explica el flujo de trabajo oficial del equipo.
Seguirlo es obligatorio. Si no está en el repositorio, no existe.

---

## ¿Por qué usamos GitHub Flow?

- Protege la rama `main` (versión estable del producto)
- Hace visible el trabajo individual de cada integrante
- Conecta cada tarea con su código real
- Deja historial verificable para evaluación

---

## 🔁 El flujo paso a paso

### 1️⃣ Toma un issue del tablero

Antes de escribir una sola línea de código, debe existir un issue
que describa qué vas a hacer y por qué.

### 2️⃣ Crea tu rama desde main

```bash
git checkout main
git pull origin main
git checkout -b feature/nombre-descriptivo
```

El nombre debe explicar qué estás haciendo sin abrir el código.

### 3️⃣ Haz commits mientras trabajas

```bash
git add .
git commit -m "feat: descripción clara del cambio"
```

Haz commits frecuentes. Cada commit es evidencia de trabajo real.

### 4️⃣ Sube tu rama a GitHub

```bash
git push origin feature/nombre-descriptivo
```

### 5️⃣ Abre un Pull Request

- Título claro de qué hace el PR
- Descripción de qué hiciste y por qué
- Escribe `Closes #número` para vincular el issue
- Agrega captura, video o link como evidencia
- Asigna un compañero como reviewer

### 6️⃣ Revisión de compañero

El reviewer debe:
- Leer el código
- Dejar al menos un comentario
- Aprobar o solicitar cambios

### 7️⃣ Merge a main

Solo después de aprobación. Lo hace el Tech Lead o el autor
una vez aprobado.

---

## 🌿 Prefijos de ramas

| Prefijo | Uso | Ejemplo |
|---------|-----|---------|
| `feature/` | Nueva funcionalidad | `feature/login-usuario` |
| `fix/` | Corrección de error | `fix/calculo-total-pedido` |
| `docs/` | Documentación | `docs/github-flow` |
| `chore/` | Configuración | `chore/setup-base-datos` |
| `test/` | Pruebas | `test/validacion-formulario` |

---

## ✍️ Formato de commits
feat: agrega endpoint de creación de pedidos
fix: corrige cálculo del total en la orden
docs: agrega documentación del flujo de trabajo
chore: configura eslint y prettier
test: agrega pruebas unitarias del servicio de pedidos

---

## ❌ Lo que nunca debes hacer

```bash
# MAL — trabajo directo en main
git checkout main
git add .
git commit -m "cambios"
git push

# BIEN — siempre desde una rama
git checkout -b feature/mi-funcionalidad
```

---

## 📋 Checklist antes de abrir un PR

- [ ] Mi rama tiene prefijo correcto
- [ ] Mis commits tienen mensajes descriptivos en español
- [ ] El PR tiene título claro
- [ ] Escribí `Closes #número` en la descripción
- [ ] Adjunté evidencia (captura o link)
- [ ] Asigné a un compañero como reviewer
- [ ] No hice cambios directo en main

---

> 🔧 Dudas técnicas → Tech Lead
> 📋 Dudas de producto → Product Owner
