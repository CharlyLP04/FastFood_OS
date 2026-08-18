const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { manejarErrorInterno } = require('../utils/errorHandler');

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.username, u.activo, u.created_at, r.nombre AS rol, r.id AS rol_id
       FROM usuarios u
       INNER JOIN roles r ON r.id = u.rol_id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    manejarErrorInterno(error, res, 'obtener usuarios');
  }
};

const getRoles = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, descripcion FROM roles ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    manejarErrorInterno(error, res, 'obtener roles');
  }
};

const createUser = async (req, res) => {
  try {
    const { nombre, apellido, username, password, rol_id } = req.body;

    if (!nombre || !apellido || !username || !password || !rol_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, username, password_hash, rol_id, activo)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, nombre, apellido, username, activo`,
      [nombre, apellido, username.toLowerCase().trim(), password_hash, rol_id]
    );

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado.' });
    }
    manejarErrorInterno(error, res, 'crear usuario');
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, username, rol_id, password } = req.body;

    if (!nombre || !apellido || !username || !rol_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos.' });
    }

    if (id === '1' && parseInt(rol_id, 10) !== 1) {
      return res.status(403).json({ error: 'No se pueden modificar los permisos del administrador principal.' });
    }

    let result;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      result = await pool.query(
        `UPDATE usuarios 
         SET nombre = $1, apellido = $2, username = $3, rol_id = $4, password_hash = $5, updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [nombre, apellido, username.toLowerCase().trim(), rol_id, password_hash, id]
      );
    } else {
      result = await pool.query(
        `UPDATE usuarios 
         SET nombre = $1, apellido = $2, username = $3, rol_id = $4, updated_at = NOW()
         WHERE id = $5 RETURNING *`,
        [nombre, apellido, username.toLowerCase().trim(), rol_id, id]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json({ mensaje: 'Usuario actualizado exitosamente' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado por otro usuario.' });
    }
    manejarErrorInterno(error, res, 'actualizar usuario');
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === '1') {
      return res.status(403).json({ error: 'No se puede desactivar al administrador principal.' });
    }
    
    const result = await pool.query(
      `UPDATE usuarios SET activo = NOT activo, updated_at = NOW() WHERE id = $1 RETURNING activo`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json({
      mensaje: result.rows[0].activo ? 'Usuario activado exitosamente' : 'Usuario desactivado exitosamente',
      activo: result.rows[0].activo
    });
  } catch (error) {
    manejarErrorInterno(error, res, 'cambiar estado del usuario');
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === '1') {
      return res.status(403).json({ error: 'No se puede eliminar al administrador principal.' });
    }
    
    const result = await pool.query(
      `DELETE FROM usuarios WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json({ mensaje: 'Usuario eliminado permanentemente' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ error: 'No se puede eliminar porque este usuario está asociado a órdenes u otros registros históricos.' });
    }
    manejarErrorInterno(error, res, 'eliminar usuario');
  }
};

module.exports = {
  getUsers,
  getRoles,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser
};
