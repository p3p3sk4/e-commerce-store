-- ============================================================
-- Esquema de base de datos: Tienda en línea (ropa, bolsas, accesorios)
-- PostgreSQL
-- ============================================================

-- ---------- USUARIOS ----------
CREATE TYPE user_role AS ENUM ('cliente', 'admin');

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(255),
    phone           VARCHAR(20),
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role    NOT NULL DEFAULT 'cliente',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE, -- "eliminar cuenta" = FALSE, nunca DELETE físico
    deleted_at      TIMESTAMP,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Únicos solo entre cuentas ACTIVAS (login será por email o phone + password)
CREATE UNIQUE INDEX idx_users_email_active ON users(email) WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_users_phone_active ON users(phone) WHERE is_active = TRUE;

-- ---------- DIRECCIONES GUARDADAS (para reusar; la orden guarda su PROPIA copia, ver más abajo) ----------
CREATE TABLE user_addresses (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label           VARCHAR(50), -- ej. 'Casa', 'Trabajo'
    recipient_name  VARCHAR(150) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    street          VARCHAR(255) NOT NULL,
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    zip_code        VARCHAR(10) NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------- CATEGORÍAS Y MARCAS (para los filtros) ----------
CREATE TABLE categories (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE brands (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE
);

-- ---------- PRODUCTOS (el precio YA NO vive aquí, vive por variante) ----------
CREATE TABLE products (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    category_id     INTEGER REFERENCES categories(id),
    brand_id        INTEGER REFERENCES brands(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE, -- para "quitar" un producto sin borrar su historial
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_name ON products USING GIN (to_tsvector('spanish', name)); -- búsqueda por nombre

-- ---------- IMÁGENES DEL PRODUCTO (varias por producto, con orden) ----------
CREATE TABLE product_images (
    id              SERIAL PRIMARY KEY,
    product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url       VARCHAR(500) NOT NULL,
    position        INTEGER NOT NULL DEFAULT 0 -- 1=frontal, 2=trasera, 3=detalle, 4=modelo, etc.
);

-- ---------- VARIANTES POR TALLA (precio, inventario real y reserva viven aquí) ----------
CREATE TABLE product_variants (
    id                  SERIAL PRIMARY KEY,
    product_id          INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size                VARCHAR(20) NOT NULL,   -- ej. 'S', 'M', 'L', 'única', o color: 'Negra', 'Roja'
    sku                 VARCHAR(50) UNIQUE,
    price               NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    stock_quantity      INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0), -- inventario REAL, físico
    reserved_quantity   INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0), -- apartado por órdenes no finalizadas
    is_active           BOOLEAN NOT NULL DEFAULT TRUE, -- para descontinuar una talla específica
    CHECK (reserved_quantity <= stock_quantity),
    UNIQUE (product_id, size)
);

-- ---------- CANASTA (no afecta inventario ni reserva) ----------
CREATE TABLE cart_items (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variant_id      INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    added_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, variant_id)
);

-- ---------- ÓRDENES (registro contable/fiscal, inmutable una vez creada) ----------
CREATE TYPE payment_method AS ENUM ('transferencia', 'efectivo');
-- pendiente_pago: transferencia creada, esperando comprobante (ventana de 10 min)
-- apartado: efectivo reservado, sin límite de tiempo, esperando al administrador
-- completado: pago verificado y producto entregado -> aquí se descuenta stock_quantity de verdad
-- cancelado: venció el tiempo o se canceló -> se libera la reserva, stock_quantity nunca se tocó
CREATE TYPE order_status AS ENUM ('pendiente_pago', 'apartado', 'completado', 'cancelado');

CREATE TABLE orders (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- nunca se borra un usuario con órdenes
    order_number        VARCHAR(30) NOT NULL UNIQUE,
    payment_method      payment_method NOT NULL,
    payment_reference   VARCHAR(100), -- folio de transferencia (NULL hasta que se sube el comprobante; efectivo no aplica)
    payment_proof_url   VARCHAR(500), -- captura/foto del comprobante subida por el cliente (transferencia); efectivo no aplica
    status              order_status NOT NULL,
    total               NUMERIC(10,2) NOT NULL DEFAULT 0, -- se calcula solo, vía trigger (ver abajo)
    expires_at          TIMESTAMP, -- solo aplica a transferencia (creación + 10 min); NULL en efectivo
    -- Copia congelada de la dirección al momento de la compra (nunca referencia user_addresses en vivo)
    shipping_recipient_name VARCHAR(150) NOT NULL,
    shipping_phone          VARCHAR(20) NOT NULL,
    shipping_street         VARCHAR(255) NOT NULL,
    shipping_city           VARCHAR(100) NOT NULL,
    shipping_state          VARCHAR(100) NOT NULL,
    shipping_zip_code       VARCHAR(10) NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    -- Efectivo nunca tiene folio ni comprobante (no aplica); transferencia puede tenerlos NULL
    -- mientras el cliente aún no sube su comprobante.
    CONSTRAINT chk_cash_has_no_payment_proof CHECK (
        payment_method = 'transferencia' OR (payment_reference IS NULL AND payment_proof_url IS NULL)
    )
);

CREATE UNIQUE INDEX idx_orders_payment_reference ON orders(payment_reference) WHERE payment_reference IS NOT NULL;

CREATE TABLE order_items (
    id              SERIAL PRIMARY KEY,
    order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id      INTEGER NOT NULL REFERENCES product_variants(id),
    product_name    VARCHAR(150) NOT NULL, -- congelado al momento de la compra (se llena solo, ver trigger)
    variant_size    VARCHAR(20) NOT NULL,  -- congelado al momento de la compra
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(10,2) NOT NULL -- precio de la variante, congelado al momento de la compra
);

-- ---------- HISTORIAL DE MOVIMIENTOS DE INVENTARIO (solo cambios REALES a stock_quantity) ----------
CREATE TYPE movement_type AS ENUM ('venta', 'reabastecimiento', 'ajuste');

CREATE TABLE inventory_movements (
    id              SERIAL PRIMARY KEY,
    variant_id      INTEGER NOT NULL REFERENCES product_variants(id),
    change_amount   INTEGER NOT NULL, -- negativo en venta, positivo en reabastecimiento/ajuste
    type            movement_type NOT NULL,
    order_id        INTEGER REFERENCES orders(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS: reserva -> confirmación/cancelación, y auditoría
-- ============================================================

-- 1) BEFORE INSERT en order_items: valida disponibilidad (stock_quantity - reserved_quantity)
--    y APARTA la cantidad (reserved_quantity), sin tocar todavía el inventario real.
--    También va sumando el total real de la orden.
CREATE OR REPLACE FUNCTION fn_reserve_order_item() RETURNS TRIGGER AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE product_variants
    SET reserved_quantity = reserved_quantity + NEW.quantity
    WHERE id = NEW.variant_id
      AND (stock_quantity - reserved_quantity) >= NEW.quantity;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    IF rows_updated = 0 THEN
        RAISE EXCEPTION 'Disponibilidad insuficiente para la variante %', NEW.variant_id;
    END IF;

    -- Congela nombre del producto y talla/color al momento de la compra
    SELECT p.name, pv.size
    INTO NEW.product_name, NEW.variant_size
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.id = NEW.variant_id;

    UPDATE orders
    SET total = total + (NEW.quantity * NEW.unit_price)
    WHERE id = NEW.order_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reserve_order_item
BEFORE INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION fn_reserve_order_item();

-- 2) order_items es INMUTABLE: se corrige cancelando/completando la orden entera, no editando líneas.
CREATE OR REPLACE FUNCTION fn_prevent_order_items_modification() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'order_items es inmutable: cancela o completa la orden via orders.status';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_order_items_update
BEFORE UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_order_items_modification();

-- 3) No se puede cambiar el estado de una orden que ya llegó a un estado final.
CREATE OR REPLACE FUNCTION fn_validate_order_status_transition() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('completado', 'cancelado') AND NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'No se puede cambiar el estado de una orden que ya está %', OLD.status;
    END IF;

    IF NEW.status = 'completado' AND NEW.payment_method = 'transferencia' AND NEW.payment_proof_url IS NULL THEN
        RAISE EXCEPTION 'No se puede completar una orden por transferencia sin comprobante de pago (payment_proof_url)';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_order_status_transition
BEFORE UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_validate_order_status_transition();

-- 4) Al COMPLETAR una orden: recién aquí se descuenta el inventario real y se libera la reserva.
CREATE OR REPLACE FUNCTION fn_finalize_stock_on_complete() RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    IF NEW.status = 'completado' AND OLD.status <> 'completado' THEN
        FOR item IN SELECT variant_id, quantity FROM order_items WHERE order_id = NEW.id LOOP
            UPDATE product_variants
            SET stock_quantity = stock_quantity - item.quantity,
                reserved_quantity = reserved_quantity - item.quantity
            WHERE id = item.variant_id;

            INSERT INTO inventory_movements (variant_id, change_amount, type, order_id)
            VALUES (item.variant_id, -item.quantity, 'venta', NEW.id);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_finalize_stock_on_complete
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_finalize_stock_on_complete();

-- 5) Al CANCELAR una orden (venció el tiempo, o el admin cancela un apartado): solo libera la reserva.
--    stock_quantity nunca se tocó porque nunca salió del inventario real, así que no hay nada que "devolver".
CREATE OR REPLACE FUNCTION fn_release_reservation_on_cancel() RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    IF NEW.status = 'cancelado' AND OLD.status <> 'cancelado' THEN
        FOR item IN SELECT variant_id, quantity FROM order_items WHERE order_id = NEW.id LOOP
            UPDATE product_variants
            SET reserved_quantity = reserved_quantity - item.quantity
            WHERE id = item.variant_id;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_release_reservation_on_cancel
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_release_reservation_on_cancel();

-- 6) Cualquier cambio manual a stock_quantity que NO venga del trigger de completar orden
--    (ej. admin editando directo en pgAdmin/DBeaver, o reabasteciendo) se registra como 'ajuste'.
CREATE OR REPLACE FUNCTION fn_log_manual_stock_change() RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() = 1 THEN
        INSERT INTO inventory_movements (variant_id, change_amount, type, order_id)
        VALUES (NEW.id, NEW.stock_quantity - OLD.stock_quantity, 'ajuste', NULL);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_manual_stock_change
AFTER UPDATE OF stock_quantity ON product_variants
FOR EACH ROW
WHEN (OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity)
EXECUTE FUNCTION fn_log_manual_stock_change();

-- ============================================================
-- ÍNDICES DE RENDIMIENTO (consultas frecuentes: historial por usuario,
-- líneas de una orden, variantes de un producto, auditoría de inventario)
-- ============================================================
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_inventory_variant ON inventory_movements(variant_id);
CREATE INDEX idx_inventory_order ON inventory_movements(order_id);
