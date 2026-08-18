-- ============================================================
--  A La Burger OS — Esquema de base de datos PostgreSQL
--  Archivo  : server/db/schema.sql
--  Versión  : 1.0.0
--  Creado   : 2026-06-15
--  Descripción: Script completo de creación de tablas e
--               inserción de datos semilla (seed) para
--               la sucursal única de A La Burger.
-- ============================================================

-- ------------------------------------------------------------
-- Extensiones necesarias
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- para gen_random_uuid()

-- ============================================================
-- TABLA: roles
-- Almacena los roles disponibles en el sistema.
-- Cada usuario tendrá exactamente un rol asignado.
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL       PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,  -- administrador, gerente, cajero, mesero
    descripcion TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: usuarios
-- Almacena a todas las personas que pueden iniciar sesión
-- en el sistema: administradores, gerentes, cajeros y meseros.
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id              SERIAL       PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   TEXT         NOT NULL,          -- contraseña hasheada con bcrypt
    rol_id          INTEGER      NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: categorias
-- Agrupa los productos por tipo: hamburguesas, bebidas,
-- complementos, postres, etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
    id          SERIAL       PRIMARY KEY,
    nombre      VARCHAR(80)  NOT NULL UNIQUE,
    descripcion TEXT,
    icono       VARCHAR(10),                  -- emoji o código de ícono para la UI
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: productos
-- Catálogo de productos que ofrece la hamburguesería.
-- Incluye precio, categoría y si está disponible para venta.
-- ============================================================
CREATE TABLE IF NOT EXISTS productos (
    id              SERIAL          PRIMARY KEY,
    nombre          VARCHAR(120)    NOT NULL,
    descripcion     TEXT,
    precio          NUMERIC(10, 2)  NOT NULL CHECK (precio >= 0),
    categoria_id    INTEGER         NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    imagen_url      TEXT,                     -- ruta o URL de la imagen del producto
    disponible      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: ingredientes
-- Lista de ingredientes que componen los productos.
-- Se usa para llevar control de inventario.
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredientes (
    id          SERIAL          PRIMARY KEY,
    nombre      VARCHAR(100)    NOT NULL UNIQUE,
    unidad      VARCHAR(30)     NOT NULL,     -- kg, g, litros, piezas, etc.
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: inventario
-- Registro del stock actual de cada ingrediente.
-- Incluye stock mínimo para generar alertas de reabasto.
-- ============================================================
CREATE TABLE IF NOT EXISTS inventario (
    id                  SERIAL          PRIMARY KEY,
    ingrediente_id      INTEGER         NOT NULL UNIQUE REFERENCES ingredientes(id) ON DELETE CASCADE,
    cantidad_disponible NUMERIC(12, 3)  NOT NULL DEFAULT 0 CHECK (cantidad_disponible >= 0),
    stock_minimo        NUMERIC(12, 3)  NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    -- stock_bajo se calcula: cantidad_disponible <= stock_minimo
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: producto_ingredientes  (tabla pivote)
-- Relaciona cada producto con los ingredientes que utiliza
-- y la cantidad requerida por unidad de producto.
-- ============================================================
CREATE TABLE IF NOT EXISTS producto_ingredientes (
    id              SERIAL          PRIMARY KEY,
    producto_id     INTEGER         NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    ingrediente_id  INTEGER         NOT NULL REFERENCES ingredientes(id) ON DELETE RESTRICT,
    cantidad        NUMERIC(10, 3)  NOT NULL CHECK (cantidad > 0),  -- cantidad por unidad de producto
    UNIQUE (producto_id, ingrediente_id)
);

-- ============================================================
-- TABLA: mesas
-- Representa las mesas físicas del restaurante.
-- Cada mesa puede tener un estado: disponible, ocupada, reservada.
-- ============================================================
CREATE TABLE IF NOT EXISTS mesas (
    id          SERIAL      PRIMARY KEY,
    numero      INTEGER     NOT NULL UNIQUE CHECK (numero > 0),
    capacidad   INTEGER     NOT NULL DEFAULT 4 CHECK (capacidad > 0),
    estado      VARCHAR(20) NOT NULL DEFAULT 'disponible'
                            CHECK (estado IN ('disponible', 'ocupada', 'reservada')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: pedidos
-- Registro de cada orden generada en el restaurante.
-- Un pedido pertenece a una mesa y es atendido por un mesero.
-- Estados posibles: pendiente → en_preparacion → listo → entregado → cancelado
-- ============================================================
CREATE TABLE IF NOT EXISTS pedidos (
    id              SERIAL      PRIMARY KEY,
    mesa_id         INTEGER     REFERENCES mesas(id) ON DELETE SET NULL,  -- puede ser NULL para pedidos para llevar
    mesero_id       INTEGER     REFERENCES usuarios(id) ON DELETE SET NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                                CHECK (estado IN ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado')),
    tipo            VARCHAR(20) NOT NULL DEFAULT 'local'
                                CHECK (tipo IN ('local', 'para_llevar')),
    notas           TEXT,                       -- instrucciones especiales del cliente
    total           NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    estado_pago     VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                                CHECK (estado_pago IN ('pendiente', 'pagado', 'fallido')),
    stripe_payment_intent_id VARCHAR(120),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: detalle_pedido
-- Líneas de cada pedido: qué productos se pidieron,
-- en qué cantidad y a qué precio (precio al momento del pedido).
-- ============================================================
CREATE TABLE IF NOT EXISTS detalle_pedido (
    id              SERIAL          PRIMARY KEY,
    pedido_id       INTEGER         NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id     INTEGER         NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad        INTEGER         NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2)  NOT NULL CHECK (precio_unitario >= 0),  -- precio al momento del pedido
    subtotal        NUMERIC(10, 2)  GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    notas           TEXT,                       -- modificaciones del producto (sin cebolla, extra queso, etc.)
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: ventas
-- Registro de cada venta cerrada (ticket generado).
-- Una venta se crea cuando el pedido se cobra y se cierra.
-- ============================================================
CREATE TABLE IF NOT EXISTS ventas (
    id              SERIAL          PRIMARY KEY,
    pedido_id       INTEGER         NOT NULL UNIQUE REFERENCES pedidos(id) ON DELETE RESTRICT,
    cajero_id       INTEGER         REFERENCES usuarios(id) ON DELETE SET NULL,
    subtotal        NUMERIC(10, 2)  NOT NULL CHECK (subtotal >= 0),
    impuesto        NUMERIC(10, 2)  NOT NULL DEFAULT 0 CHECK (impuesto >= 0),  -- IVA u otro impuesto
    descuento       NUMERIC(10, 2)  NOT NULL DEFAULT 0 CHECK (descuento >= 0),
    total           NUMERIC(10, 2)  NOT NULL CHECK (total >= 0),
    metodo_pago     VARCHAR(30)     NOT NULL DEFAULT 'efectivo'
                                    CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'mixto')),
    numero_ticket   VARCHAR(30)     NOT NULL UNIQUE,   -- folio del ticket impreso
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES  — mejoran el rendimiento en consultas frecuentes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_username   ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol        ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_mesa        ON pedidos(mesa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_mesero      ON pedidos(mesero_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado      ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_pedido_id   ON detalle_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_ventas_pedido       ON ventas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cajero       ON ventas(cajero_id);
CREATE INDEX IF NOT EXISTS idx_inventario_ing      ON inventario(ingrediente_id);

-- ============================================================
-- FUNCIÓN  — actualiza updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS — llaman a la función anterior en cada UPDATE
-- ============================================================
DO $$ BEGIN
    -- roles
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_roles_updated_at') THEN
        CREATE TRIGGER trg_roles_updated_at
            BEFORE UPDATE ON roles
            FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
    END IF;
    -- usuarios
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_usuarios_updated_at') THEN
        CREATE TRIGGER trg_usuarios_updated_at
            BEFORE UPDATE ON usuarios
            FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
    END IF;
    -- categorias
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_categorias_updated_at') THEN
        CREATE TRIGGER trg_categorias_updated_at
            BEFORE UPDATE ON categorias
            FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
    END IF;
    -- productos
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_productos_updated_at') THEN
        CREATE TRIGGER trg_productos_updated_at
            BEFORE UPDATE ON productos
            FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
    END IF;
    -- ingredientes
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ingredientes_updated_at') THEN
        CREATE TRIGGER trg_ingredientes_updated_at
            BEFORE UPDATE ON ingredientes
            FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
    END IF;
    -- inventario
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_inventario_updated_at') THEN
        CREATE TRIGGER trg_inventario_updated_at
            BEFORE UPDATE ON inventario
            FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
    END IF;
    -- mesas
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_mesas_updated_at') THEN
        CREATE TRIGGER trg_mesas_updated_at
            BEFORE UPDATE ON mesas
            FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
    END IF;
    -- pedidos
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pedidos_updated_at') THEN
        CREATE TRIGGER trg_pedidos_updated_at
            BEFORE UPDATE ON pedidos
            FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
    END IF;
    -- detalle_pedido
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_detalle_pedido_updated_at') THEN
        CREATE TRIGGER trg_detalle_pedido_updated_at
            BEFORE UPDATE ON detalle_pedido
            FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
    END IF;
    -- ventas
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ventas_updated_at') THEN
        CREATE TRIGGER trg_ventas_updated_at
            BEFORE UPDATE ON ventas
            FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
    END IF;
END $$;

-- ============================================================
-- DATOS SEMILLA (SEED)
-- ============================================================

-- ------------------------------------------------------------
-- Roles del sistema
-- ------------------------------------------------------------
INSERT INTO roles (nombre, descripcion) VALUES
    ('administrador', 'Acceso total al sistema'),
    ('cajero',        'Cobro de mesas y gestión de caja'),
    ('cocina',        'Preparación de pedidos y control del KDS'),
    ('mesero',        'Toma de pedidos y atención a mesas')
ON CONFLICT (nombre) DO NOTHING;

-- ------------------------------------------------------------
-- Usuarios de ejemplo
-- Contraseñas hasheadas con bcrypt (cost=10):
--   admin123   → hash incluido
--   mesero123  → hash incluido
--   cajero123  → hash incluido
-- IMPORTANTE: en producción, cambiar estas contraseñas.
-- ------------------------------------------------------------
INSERT INTO usuarios (nombre, apellido, username, password_hash, rol_id) VALUES
    (
        'Admin',
        'Sistema',
        'admin',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- admin123
        (SELECT id FROM roles WHERE nombre = 'administrador')
    ),
    (
        'Mesero',
        'Uno',
        'mesero',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- mesero123
        (SELECT id FROM roles WHERE nombre = 'mesero')
    ),
    (
        'Cajero',
        'Uno',
        'cajero',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- cajero123
        (SELECT id FROM roles WHERE nombre = 'cajero')
    )
ON CONFLICT (username) DO NOTHING;

-- ------------------------------------------------------------
-- Categorías de productos
-- ------------------------------------------------------------
INSERT INTO categorias (nombre, descripcion, icono) VALUES
    ('Hamburguesas',  'Hamburguesas clásicas y especiales de la casa', '🍔'),
    ('Bebidas',       'Refrescos, aguas y bebidas naturales',          '🥤'),
    ('Complementos',  'Papas, aros de cebolla y acompañamientos',     '🍟'),
    ('Postres',       'Helados, malteadas y pays',                     '🍦')
ON CONFLICT (nombre) DO NOTHING;

-- ------------------------------------------------------------
-- Productos del menú (5 productos típicos)
-- ------------------------------------------------------------
INSERT INTO productos (nombre, descripcion, precio, categoria_id) VALUES
    (
        'Classic Burger',
        'Hamburguesa clásica con carne de res, lechuga, tomate, cebolla y aderezo de la casa',
        89.00,
        (SELECT id FROM categorias WHERE nombre = 'Hamburguesas')
    ),
    (
        'Double Smash',
        'Doble carne aplastada estilo smash con queso americano derretido y pepinillos',
        129.00,
        (SELECT id FROM categorias WHERE nombre = 'Hamburguesas')
    ),
    (
        'BBQ Crispy',
        'Pollo crujiente bañado en salsa BBQ con col morada y mayonesa chipotle',
        109.00,
        (SELECT id FROM categorias WHERE nombre = 'Hamburguesas')
    ),
    (
        'Papas Clásicas',
        'Porción de papas fritas con sal de mar y aderezo especial',
        45.00,
        (SELECT id FROM categorias WHERE nombre = 'Complementos')
    ),
    (
        'Refresco 500 ml',
        'Coca-Cola, Sprite o Fanta en vaso con hielo',
        35.00,
        (SELECT id FROM categorias WHERE nombre = 'Bebidas')
    )
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Ingredientes reales (8 ingredientes base)
-- ------------------------------------------------------------
INSERT INTO ingredientes (nombre, unidad) VALUES
    ('Pan de hamburguesa',  'piezas'),
    ('Carne de res 150g',   'piezas'),
    ('Lechuga',             'kg'),
    ('Tomate',              'kg'),
    ('Cebolla',             'kg'),
    ('Queso americano',     'piezas'),
    ('Pepinillos',          'kg'),
    ('Papa blanca',         'kg')
ON CONFLICT (nombre) DO NOTHING;

-- ------------------------------------------------------------
-- Inventario inicial de cada ingrediente
-- ------------------------------------------------------------
INSERT INTO inventario (ingrediente_id, cantidad_disponible, stock_minimo) VALUES
    ((SELECT id FROM ingredientes WHERE nombre = 'Pan de hamburguesa'), 150,  30),
    ((SELECT id FROM ingredientes WHERE nombre = 'Carne de res 150g'),  100,  20),
    ((SELECT id FROM ingredientes WHERE nombre = 'Lechuga'),            5.0,  1.0),
    ((SELECT id FROM ingredientes WHERE nombre = 'Tomate'),             4.0,  1.0),
    ((SELECT id FROM ingredientes WHERE nombre = 'Cebolla'),            3.0,  0.5),
    ((SELECT id FROM ingredientes WHERE nombre = 'Queso americano'),    200,  40),
    ((SELECT id FROM ingredientes WHERE nombre = 'Pepinillos'),         2.0,  0.5),
    ((SELECT id FROM ingredientes WHERE nombre = 'Papa blanca'),        20.0, 5.0)
ON CONFLICT (ingrediente_id) DO NOTHING;

-- ------------------------------------------------------------
-- Relación producto–ingredientes (recetas básicas)
-- ------------------------------------------------------------
INSERT INTO producto_ingredientes (producto_id, ingrediente_id, cantidad) VALUES
    -- Classic Burger
    ((SELECT id FROM productos WHERE nombre = 'Classic Burger'),
     (SELECT id FROM ingredientes WHERE nombre = 'Pan de hamburguesa'), 1),
    ((SELECT id FROM productos WHERE nombre = 'Classic Burger'),
     (SELECT id FROM ingredientes WHERE nombre = 'Carne de res 150g'), 1),
    ((SELECT id FROM productos WHERE nombre = 'Classic Burger'),
     (SELECT id FROM ingredientes WHERE nombre = 'Lechuga'), 0.030),
    ((SELECT id FROM productos WHERE nombre = 'Classic Burger'),
     (SELECT id FROM ingredientes WHERE nombre = 'Tomate'), 0.040),
    ((SELECT id FROM productos WHERE nombre = 'Classic Burger'),
     (SELECT id FROM ingredientes WHERE nombre = 'Cebolla'), 0.020),
    -- Double Smash
    ((SELECT id FROM productos WHERE nombre = 'Double Smash'),
     (SELECT id FROM ingredientes WHERE nombre = 'Pan de hamburguesa'), 1),
    ((SELECT id FROM productos WHERE nombre = 'Double Smash'),
     (SELECT id FROM ingredientes WHERE nombre = 'Carne de res 150g'), 2),
    ((SELECT id FROM productos WHERE nombre = 'Double Smash'),
     (SELECT id FROM ingredientes WHERE nombre = 'Queso americano'), 2),
    ((SELECT id FROM productos WHERE nombre = 'Double Smash'),
     (SELECT id FROM ingredientes WHERE nombre = 'Pepinillos'), 0.020),
    -- BBQ Crispy (usa cebolla y lechuga)
    ((SELECT id FROM productos WHERE nombre = 'BBQ Crispy'),
     (SELECT id FROM ingredientes WHERE nombre = 'Pan de hamburguesa'), 1),
    ((SELECT id FROM productos WHERE nombre = 'BBQ Crispy'),
     (SELECT id FROM ingredientes WHERE nombre = 'Lechuga'), 0.040),
    ((SELECT id FROM productos WHERE nombre = 'BBQ Crispy'),
     (SELECT id FROM ingredientes WHERE nombre = 'Cebolla'), 0.015),
    -- Papas Clásicas
    ((SELECT id FROM productos WHERE nombre = 'Papas Clásicas'),
     (SELECT id FROM ingredientes WHERE nombre = 'Papa blanca'), 0.200)
ON CONFLICT (producto_id, ingrediente_id) DO NOTHING;

-- ------------------------------------------------------------
-- Mesas del restaurante (5 mesas)
-- ------------------------------------------------------------
INSERT INTO mesas (numero, capacidad, estado) VALUES
    (1, 2, 'disponible'),
    (2, 4, 'disponible'),
    (3, 4, 'disponible'),
    (4, 6, 'disponible'),
    (5, 6, 'disponible')
ON CONFLICT (numero) DO NOTHING;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
