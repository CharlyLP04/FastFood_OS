const pool = require('../config/db');
const { manejarErrorInterno } = require('../utils/errorHandler');

const obtenerInventario = async (req, res) => {
  try {
    const { stock_bajo } = req.query;

    let queryText = `
      SELECT i.id, ing.id AS ingrediente_id, ing.nombre, i.cantidad_disponible AS cantidad_actual,
             ing.unidad, i.stock_minimo, i.updated_at AS ultima_actualizacion
      FROM inventario i
      INNER JOIN ingredientes ing ON ing.id = i.ingrediente_id
    `;

    const queryParams = [];

    if (stock_bajo === 'true') {
      queryText += ' WHERE i.cantidad_disponible <= i.stock_minimo';
    }

    queryText += ' ORDER BY ing.nombre ASC';

    const resultado = await pool.query(queryText, queryParams);

    const data = resultado.rows.map((row) => ({
      id: row.id,
      ingrediente_id: row.ingrediente_id,
      nombre: row.nombre,
      cantidad_actual: Number(row.cantidad_actual),
      unidad: row.unidad,
      stock_minimo: Number(row.stock_minimo),
      ultima_actualizacion: row.ultima_actualizacion,
    }));

    return res.status(200).json({ data, total: data.length });
  } catch (error) {
    console.error('Error al obtener el inventario:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: error.message,
    });
  }
};

const crearIngrediente = async (req, res) => {
  const client = await pool.connect();
  try {
    const { nombre, cantidad_actual, unidad, stock_minimo } = req.body;

    // 1. Validaciones de presencia y tipo
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({
        error: 'Datos inválidos',
        mensaje: 'El nombre es obligatorio y debe ser un texto válido.',
      });
    }

    const cantidadActualNum = Number(cantidad_actual);
    if (isNaN(cantidadActualNum) || cantidadActualNum < 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        mensaje: 'La cantidad actual es obligatoria y debe ser un número no menor a 0.',
      });
    }

    const stockMinimoNum = Number(stock_minimo);
    if (isNaN(stockMinimoNum) || stockMinimoNum < 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        mensaje: 'El stock mínimo es obligatorio y debe ser un número no menor a 0.',
      });
    }

    const unidadesValidas = ['kg', 'g', 'l', 'ml', 'pza', 'pz', 'pieza', 'piezas', 'unidad', 'unidades', 'caja', 'paquete', 'botella', 'lata', 'porcion', 'porciones'];
    if (!unidad || typeof unidad !== 'string' || !unidadesValidas.includes(unidad.toLowerCase())) {
      return res.status(400).json({
        error: 'Datos inválidos',
        mensaje: `La unidad es obligatoria y debe ser una de las siguientes: ${unidadesValidas.join(', ')}.`,
      });
    }

    // 2. Verificar duplicados (insensible a mayúsculas/minúsculas)
    const ingredienteExistente = await pool.query(
      'SELECT id FROM ingredientes WHERE LOWER(nombre) = LOWER($1)',
      [nombre.trim()]
    );

    if (ingredienteExistente.rows.length > 0) {
      return res.status(409).json({
        error: 'El ingrediente ya existe',
        mensaje: 'Ya existe un ingrediente registrado con ese nombre.',
      });
    }

    // 3. Ejecutar transacción
    await client.query('BEGIN');

    // Insertar en ingredientes
    const resIngrediente = await client.query(
      `INSERT INTO ingredientes (nombre, unidad)
       VALUES ($1, $2)
       RETURNING id, nombre, unidad`,
      [nombre.trim(), unidad.toLowerCase()]
    );

    const nuevoIngrediente = resIngrediente.rows[0];

    // Insertar en inventario
    const resInventario = await client.query(
      `INSERT INTO inventario (ingrediente_id, cantidad_disponible, stock_minimo)
       VALUES ($1, $2, $3)
       RETURNING cantidad_disponible, stock_minimo`,
      [nuevoIngrediente.id, cantidadActualNum, stockMinimoNum]
    );

    const nuevoInventario = resInventario.rows[0];

    await client.query('COMMIT');

    // 4. Formatear y enviar respuesta
    const stockBajo = cantidadActualNum <= stockMinimoNum;

    return res.status(201).json({
      id: nuevoIngrediente.id,
      nombre: nuevoIngrediente.nombre,
      cantidad_actual: Number(nuevoInventario.cantidad_disponible),
      unidad: nuevoIngrediente.unidad,
      stock_minimo: Number(nuevoInventario.stock_minimo),
      stock_bajo: stockBajo,
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear el ingrediente:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: error.message,
    });
  } finally {
    client.release();
  }
};

const editarIngrediente = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const { nombre, unidad, stock_minimo, cantidad_actual, cantidad_disponible } = req.body;

    // 1. Validar que no intenten editar cantidad_actual o cantidad_disponible
    if (cantidad_actual !== undefined || cantidad_disponible !== undefined) {
      return res.status(400).json({
        error: 'Campo no editable',
        mensaje: 'La cantidad se modifica solo mediante movimientos de inventario (entradas/salidas/mermas).',
      });
    }

    // 2. Verificar que el registro de inventario exista
    const resInventarioExist = await pool.query(
      'SELECT ingrediente_id, cantidad_disponible, stock_minimo FROM inventario WHERE id = $1',
      [id]
    );

    if (resInventarioExist.rows.length === 0) {
      return res.status(404).json({
        error: 'No encontrado',
        mensaje: 'El ingrediente de inventario especificado no existe.',
      });
    }

    const currentInv = resInventarioExist.rows[0];
    const ingredienteId = currentInv.ingrediente_id;

    // 3. Validaciones de tipos de datos parciales
    if (nombre !== undefined && (typeof nombre !== 'string' || nombre.trim() === '')) {
      return res.status(400).json({
        error: 'Datos inválidos',
        mensaje: 'El nombre debe ser un texto válido no vacío.',
      });
    }

    const unidadesValidas = ['kg', 'g', 'l', 'ml', 'pza'];
    if (unidad !== undefined && (typeof unidad !== 'string' || !unidadesValidas.includes(unidad.toLowerCase()))) {
      return res.status(400).json({
        error: 'Datos inválidos',
        mensaje: `La unidad debe ser una de las siguientes: ${unidadesValidas.join(', ')}.`,
      });
    }

    if (stock_minimo !== undefined) {
      const stockMinimoNum = Number(stock_minimo);
      if (isNaN(stockMinimoNum) || stockMinimoNum < 0) {
        return res.status(400).json({
          error: 'Datos inválidos',
          mensaje: 'El stock mínimo debe ser un número no menor a 0.',
        });
      }
    }

    // 4. Si cambia el nombre, verificar que no esté duplicado con otro ID
    if (nombre !== undefined) {
      const resDuplicado = await pool.query(
        'SELECT id FROM ingredientes WHERE LOWER(nombre) = LOWER($1) AND id <> $2',
        [nombre.trim(), ingredienteId]
      );
      if (resDuplicado.rows.length > 0) {
        return res.status(409).json({
          error: 'El ingrediente ya existe',
          mensaje: 'Ya existe otro ingrediente registrado con ese nombre.',
        });
      }
    }

    // 5. Ejecutar la transacción
    await client.query('BEGIN');

    // Actualizar ingredientes
    if (nombre !== undefined || unidad !== undefined) {
      await client.query(
        `UPDATE ingredientes
         SET nombre = COALESCE($1, nombre),
             unidad = COALESCE($2, unidad),
             updated_at = NOW()
         WHERE id = $3`,
        [
          nombre !== undefined ? nombre.trim() : null,
          unidad !== undefined ? unidad.toLowerCase() : null,
          ingredienteId
        ]
      );
    }

    // Actualizar inventario
    if (stock_minimo !== undefined) {
      await client.query(
        `UPDATE inventario
         SET stock_minimo = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [Number(stock_minimo), id]
      );
    }

    // Obtener resultado final
    const resFinal = await client.query(
      `SELECT i.id, ing.nombre, i.cantidad_disponible AS cantidad_actual,
              ing.unidad, i.stock_minimo, i.updated_at AS ultima_actualizacion
       FROM inventario i
       INNER JOIN ingredientes ing ON ing.id = i.ingrediente_id
       WHERE i.id = $1`,
      [id]
    );

    await client.query('COMMIT');

    const row = resFinal.rows[0];
    const stockBajo = Number(row.cantidad_actual) <= Number(row.stock_minimo);

    return res.status(200).json({
      id: row.id,
      nombre: row.nombre,
      cantidad_actual: Number(row.cantidad_actual),
      unidad: row.unidad,
      stock_minimo: Number(row.stock_minimo),
      stock_bajo: stockBajo,
      ultima_actualizacion: row.ultima_actualizacion,
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al editar el ingrediente:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: error.message,
    });
  } finally {
    client.release();
  }
};

const registrarEntrada = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const { cantidad, proveedor, costo_unitario, fecha } = req.body;

    // 1. Validar que la cantidad sea un número > 0
    const cantidadNum = Number(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        mensaje: 'La cantidad debe ser un número mayor a 0.',
      });
    }

    // Validar costo_unitario opcional
    if (costo_unitario !== undefined && costo_unitario !== null) {
      const costoNum = Number(costo_unitario);
      if (isNaN(costoNum) || costoNum < 0) {
        return res.status(400).json({
          error: 'Datos inválidos',
          mensaje: 'El costo unitario debe ser un número no menor a 0.',
        });
      }
    }

    // 2. Verificar que el ingrediente de inventario exista
    const resInventarioExist = await pool.query(
      'SELECT ingrediente_id FROM inventario WHERE id = $1',
      [id]
    );

    if (resInventarioExist.rows.length === 0) {
      return res.status(404).json({
        error: 'No encontrado',
        mensaje: 'El ingrediente de inventario especificado no existe.',
      });
    }

    const ingredienteId = resInventarioExist.rows[0].ingrediente_id;

    // 3. Transacción para actualizar stock e insertar movimiento
    await client.query('BEGIN');

    // a) Actualizar cantidad en inventario
    const resUpdate = await client.query(
      `UPDATE inventario
       SET cantidad_disponible = cantidad_disponible + $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING cantidad_disponible, stock_minimo`,
      [cantidadNum, id]
    );

    const updatedInv = resUpdate.rows[0];

    // b) Insertar movimiento en movimientos_inventario
    const resMovimiento = await client.query(
      `INSERT INTO movimientos_inventario (ingrediente_id, tipo, cantidad, referencia, costo_unitario, usuario_id, fecha)
       VALUES ($1, 'entrada', $2, $3, $4, $5, COALESCE($6, NOW()))
       RETURNING id, tipo, cantidad, referencia, costo_unitario, fecha`,
      [
        ingredienteId,
        cantidadNum,
        proveedor ? proveedor.trim() : null,
        costo_unitario !== undefined && costo_unitario !== null ? Number(costo_unitario) : null,
        req.usuario.sub,
        fecha || null
      ]
    );

    const newMov = resMovimiento.rows[0];

    await client.query('COMMIT');

    const stockBajo = Number(updatedInv.cantidad_disponible) <= Number(updatedInv.stock_minimo);

    return res.status(200).json({
      cantidad_actual: Number(updatedInv.cantidad_disponible),
      stock_bajo: stockBajo,
      movimiento: {
        id: newMov.id,
        tipo: newMov.tipo,
        cantidad: Number(newMov.cantidad),
        referencia: newMov.referencia,
        costo_unitario: newMov.costo_unitario ? Number(newMov.costo_unitario) : null,
        fecha: newMov.fecha
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al registrar entrada de inventario:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: error.message,
    });
  } finally {
    client.release();
  }
};

const obtenerResumenStockBajo = async (req, res) => {
  try {
    const queryText = `
      SELECT i.id, ing.nombre, i.cantidad_disponible AS cantidad_actual, i.stock_minimo, ing.unidad,
             CASE WHEN i.stock_minimo = 0 THEN NULL ELSE (i.cantidad_disponible::numeric / i.stock_minimo::numeric) END AS criticidad
      FROM inventario i
      INNER JOIN ingredientes ing ON ing.id = i.ingrediente_id
      WHERE i.cantidad_disponible <= i.stock_minimo
      ORDER BY (CASE WHEN i.stock_minimo = 0 THEN 0 ELSE (i.cantidad_disponible::numeric / i.stock_minimo::numeric) END) ASC
    `;

    const resultado = await pool.query(queryText);

    const data = resultado.rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      cantidad_actual: Number(row.cantidad_actual),
      stock_minimo: Number(row.stock_minimo),
      unidad: row.unidad,
      criticidad: row.criticidad !== null ? Number(row.criticidad) : null,
    }));

    return res.status(200).json({ data, total: data.length });
  } catch (error) {
    console.error('Error al obtener resumen de stock bajo:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: error.message,
    });
  }
};

const obtenerMovimientos = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, fecha_desde, fecha_hasta } = req.query;

    const resInventario = await pool.query(
      'SELECT ingrediente_id FROM inventario WHERE id = $1',
      [id]
    );

    if (resInventario.rows.length === 0) {
      const err = new Error('El ingrediente de inventario especificado no existe.');
      err.status = 404;
      err.name = 'No encontrado';
      throw err;
    }

    const ingredienteId = resInventario.rows[0].ingrediente_id;

    let queryText = `
      SELECT id, tipo, cantidad, motivo, referencia, costo_unitario, usuario_id, fecha, created_at
      FROM movimientos_inventario
      WHERE ingrediente_id = $1
    `;
    const queryParams = [ingredienteId];
    let paramCount = 2;

    if (tipo) {
      queryText += ` AND tipo = $${paramCount}`;
      queryParams.push(tipo.toLowerCase());
      paramCount++;
    }

    if (fecha_desde) {
      queryText += ` AND fecha >= $${paramCount}`;
      queryParams.push(fecha_desde);
      paramCount++;
    }

    if (fecha_hasta) {
      queryText += ` AND fecha <= $${paramCount}`;
      queryParams.push(fecha_hasta);
      paramCount++;
    }

    queryText += ' ORDER BY fecha DESC NULLS LAST, created_at DESC';

    const resultado = await pool.query(queryText, queryParams);

    const data = resultado.rows.map((row) => ({
      id: row.id,
      tipo: row.tipo,
      cantidad: Number(row.cantidad),
      motivo: row.motivo,
      referencia: row.referencia,
      costo_unitario: row.costo_unitario ? Number(row.costo_unitario) : null,
      usuario_id: row.usuario_id,
      fecha: row.fecha,
      created_at: row.created_at,
    }));

    return res.status(200).json({ data, total: data.length });
  } catch (error) {
    return manejarErrorInterno(error, res, 'obtener movimientos');
  }
};

const obtenerTodosLosMovimientos = async (req, res) => {
  try {
    const { tipo, fecha_desde, fecha_hasta } = req.query;

    let queryText = `
      SELECT m.id, m.tipo, m.cantidad, m.motivo, m.referencia, m.costo_unitario, m.usuario_id, m.fecha, m.created_at,
             ing.nombre as ingrediente_nombre
      FROM movimientos_inventario m
      INNER JOIN ingredientes ing ON ing.id = m.ingrediente_id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 1;

    if (tipo) {
      queryText += ` AND m.tipo = $${paramCount}`;
      queryParams.push(tipo.toLowerCase());
      paramCount++;
    }

    if (fecha_desde) {
      queryText += ` AND m.fecha >= $${paramCount}`;
      queryParams.push(fecha_desde);
      paramCount++;
    }

    if (fecha_hasta) {
      queryText += ` AND m.fecha <= $${paramCount}`;
      queryParams.push(fecha_hasta);
      paramCount++;
    }

    queryText += ' ORDER BY m.fecha DESC NULLS LAST, m.created_at DESC';

    const resultado = await pool.query(queryText, queryParams);

    const data = resultado.rows.map((row) => ({
      id: row.id,
      tipo: row.tipo,
      cantidad: Number(row.cantidad),
      motivo: row.motivo,
      referencia: row.referencia,
      costo_unitario: row.costo_unitario ? Number(row.costo_unitario) : null,
      usuario_id: row.usuario_id,
      fecha: row.fecha,
      created_at: row.created_at,
      ingrediente_nombre: row.ingrediente_nombre,
    }));

    return res.status(200).json({ data, total: data.length });
  } catch (error) {
    return manejarErrorInterno(error, res, 'obtener todos los movimientos');
  }
};

const registrarMerma = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const { cantidad, motivo } = req.body;

    const cantidadNum = Number(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      const err = new Error('La cantidad debe ser un número mayor a 0.');
      err.status = 400;
      err.name = 'Datos inválidos';
      throw err;
    }

    if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
      const err = new Error('El motivo es obligatorio para registrar una merma.');
      err.status = 400;
      err.name = 'Datos inválidos';
      throw err;
    }

    await client.query('BEGIN');

    const resInventario = await client.query(
      'SELECT ingrediente_id, cantidad_disponible, stock_minimo FROM inventario WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (resInventario.rows.length === 0) {
      const err = new Error('El ingrediente de inventario especificado no existe.');
      err.status = 404;
      err.name = 'No encontrado';
      throw err;
    }

    const currentInv = resInventario.rows[0];

    if (cantidadNum > Number(currentInv.cantidad_disponible)) {
      const err = new Error('Cantidad excede el stock disponible');
      err.status = 400;
      err.name = 'Stock insuficiente';
      throw err;
    }

    const resUpdate = await client.query(
      `UPDATE inventario
       SET cantidad_disponible = cantidad_disponible - $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING cantidad_disponible, stock_minimo`,
      [cantidadNum, id]
    );

    const updatedInv = resUpdate.rows[0];

    const resMovimiento = await client.query(
      `INSERT INTO movimientos_inventario (ingrediente_id, tipo, cantidad, motivo, usuario_id, fecha)
       VALUES ($1, 'merma', $2, $3, $4, NOW())
       RETURNING id, tipo, cantidad, motivo, fecha`,
      [
        currentInv.ingrediente_id,
        cantidadNum,
        motivo.trim(),
        req.usuario.sub
      ]
    );

    await client.query('COMMIT');

    const stockBajo = Number(updatedInv.cantidad_disponible) <= Number(updatedInv.stock_minimo);

    return res.status(200).json({
      cantidad_actual: Number(updatedInv.cantidad_disponible),
      stock_bajo: stockBajo,
      movimiento: {
        id: resMovimiento.rows[0].id,
        tipo: resMovimiento.rows[0].tipo,
        cantidad: Number(resMovimiento.rows[0].cantidad),
        motivo: resMovimiento.rows[0].motivo,
        fecha: resMovimiento.rows[0].fecha
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    return manejarErrorInterno(error, res, 'registrar merma');
  } finally {
    client.release();
  }
};

module.exports = { obtenerInventario, crearIngrediente, editarIngrediente, registrarEntrada, obtenerResumenStockBajo, obtenerMovimientos, obtenerTodosLosMovimientos, registrarMerma };
