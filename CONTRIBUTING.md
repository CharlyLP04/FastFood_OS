# 🤝 Guía de Contribución — Dulce & Orden

Antes de hacer cualquier cambio al proyecto, lee esta guía completa.
El flujo de trabajo es obligatorio para todos los integrantes.

---

## 🚫 Reglas que no se negocian

- ❌ Nadie hace commit directo a `main`
- ❌ No se hace merge sin revisión de al menos un compañero
- ❌ No se sube un PR sin issue vinculado
- ❌ No se aceptan commits con mensajes vagos (`cambios`, `fix`, `ya quedó`)

---

## ✅ Flujo obligatorio
Tomar un issue del tablero
Crear una rama desde main con el prefijo correcto
Hacer commits descriptivos
Abrir un Pull Request vinculado al issue
Solicitar revisión de un compañero
Merge solo después de aprobación


---

## 🌿 Nomenclatura de ramas

Usa siempre uno de estos prefijos:

| Prefijo | Cuándo usarlo | Ejemplo |
|---------|--------------|---------|
| `feature/` | Nueva funcionalidad | `feature/panel-cocina` |
| `fix/` | Corrección de bug | `fix/error-calculo-total` |
| `docs/` | Documentación | `docs/github-flow` |
| `chore/` | Configuración o setup | `chore/setup-eslint` |
| `test/` | Pruebas | `test/validacion-pedidos` |

---

## 📝 Formato de commits

Usa el prefijo correspondiente al tipo de cambio:
feat: descripción corta del cambio
fix: descripción del bug corregido
docs: qué documentación se agregó
chore: qué configuración se modificó
test: qué prueba se añadió

**Ejemplos correctos:**
feat: add order creation endpoint
fix: correct total price calculation
docs: add API documentation
chore: configure eslint and prettier
test: add unit tests for order service

---

## 🔀 Cómo abrir un Pull Request

Tu PR debe incluir obligatoriamente:

1. **Título claro** — qué hace este PR
2. **Descripción** — qué hiciste y por qué
3. **Issue relacionado** — escribe `Closes #número`
4. **Evidencia** — captura, video o link funcional
5. **Reviewer** — asigna a un compañero

---

## 👥 Responsables por área

| Área | Responsable |
|------|-------------|
| Backend y arquitectura | Tech Lead |
| Backlog y producto | Product Owner |
| DevOps y CI/CD | Tech Lead |
| Features y UI | Product Engineer |
| Testing y releases | QA |
| Analytics y growth | Growth Lead |

---

## 📋 Issues

Antes de crear un issue asegúrate de incluir:

- Descripción clara de la tarea
- Responsable asignado
- Fecha límite
- Criterios de aceptación
- Relación con el MVP

---

> 💡 Si tienes dudas, consulta primero con el Tech Lead
> o revisa [`docs/github-flow.md`](docs/github-flow.md)
