const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { manejarErrorInterno } = require('../utils/errorHandler');
const { generarAccessToken, generarRefreshToken } = require('../utils/jwt');

// ─────────────────────────────────────────────────────────────────────────────
// HU-3: Constantes para prevención de timing attack + enumeración de usuarios
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hash dummy de costo 10 — iguala el tiempo de respuesta cuando el usuario
 * no existe al de cuando existe pero la contraseña es incorrecta.
 * ⚠️ COST FACTOR: sync con userController.js genSalt(10). Actualizar si cambia.
 */
const BCRYPT_COST = 10;
const DUMMY_HASH = bcrypt.hashSync('__dummy_alaburger_guard__', BCRYPT_COST);

/** Respuesta unificada — mismo body para cualquier fallo de autenticación. */
const CREDENCIALES_INVALIDAS = {
  error: 'Credenciales inválidas',
  mensaje: 'Usuario o contraseña incorrectos.',
};

// ─────────────────────────────────────────────────────────────────────────────
// HU-5: Opciones de cookie reutilizables
// secure: true → solo HTTPS (Render sirve siempre HTTPS en producción)
// sameSite: 'none' → necesario para cross-origin Vercel ↔ Render
// ─────────────────────────────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,        // en dev permite HTTP para facilitar pruebas locales
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 30 * 60 * 1000,     // 30 minutos — sync con jwt.js expiresIn: '30m'
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 15 * 24 * 60 * 60 * 1000, // 15 días
  path: '/api/auth/refresh',  // La cookie solo viaja en este endpoint específico
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * 🔐 HU-5: Inicio de sesión — tokens en httpOnly cookies, NO en el body
 * HU-3: respuesta idéntica (tiempo + cuerpo) para usuario inexistente
 *       y contraseña incorrecta — previene enumeración de usuarios.
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Datos incompletos',
        mensaje: 'Usuario y contraseña son obligatorios.',
      });
    }

    const resultado = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.username, u.password_hash, u.activo, r.nombre AS rol
       FROM usuarios u
       INNER JOIN roles r ON r.id = u.rol_id
       WHERE u.username = $1`,
      [username.toLowerCase().trim()]
    );

    const usuario = resultado.rows[0] ?? null;

    // ── HU-3: bcrypt corre SIEMPRE para igualar timing ────────────────────────
    const hashAComparar = usuario ? usuario.password_hash : DUMMY_HASH;
    const passwordValida = await bcrypt.compare(password, hashAComparar);

    if (!usuario || !passwordValida || !usuario.activo) {
      return res.status(401).json(CREDENCIALES_INVALIDAS);
    }

    // ── Generación de tokens ──────────────────────────────────────────────────
    const accessToken  = generarAccessToken(usuario);
    const refreshToken = generarRefreshToken(usuario);

    // Almacenar hash del refreshToken en BD (HU-02)
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 días

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [usuario.id, tokenHash, expiresAt]
    );

    // ── HU-5: Setear tokens en httpOnly cookies — NO en el body ──────────────
    res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

    // Solo se devuelve el objeto usuario — el JWT nunca viaja en el body
    return res.status(200).json({
      usuario: {
        id: usuario.id,
        nombre: `${usuario.nombre} ${usuario.apellido}`.trim(),
        username: usuario.username,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    return manejarErrorInterno(error, res, 'login');
  }
};

/**
 * 👤 HU-5: Obtener usuario actual desde la cookie
 * GET /api/auth/me — usado por AuthContext al montar la app para saber si hay sesión
 */
const me = async (req, res) => {
  try {
    // req.usuario lo setea verificarToken desde la cookie
    const { sub: userId } = req.usuario;

    const resultado = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.username, u.activo, r.nombre AS rol
       FROM usuarios u
       INNER JOIN roles r ON r.id = u.rol_id
       WHERE u.id = $1 AND u.activo = true`,
      [userId]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado o desactivado.' });
    }

    const usuario = resultado.rows[0];
    return res.status(200).json({
      usuario: {
        id: usuario.id,
        nombre: `${usuario.nombre} ${usuario.apellido}`.trim(),
        username: usuario.username,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    return manejarErrorInterno(error, res, 'me');
  }
};

/**
 * 🔄 HU-5: Renovación de Access Token — lee refresh_token desde cookie
 * Endpoint: POST /api/auth/refresh
 */
const refreshSession = async (req, res) => {
  try {
    // HU-5: leer desde cookie (no desde body)
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token requerido.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Refresh token inválido o expirado. Inicie sesión de nuevo.' });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const resultadoToken = await pool.query(
      `SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash]
    );

    const tokenDb = resultadoToken.rows[0];

    if (!tokenDb || new Date() > new Date(tokenDb.expires_at)) {
      return res.status(401).json({ error: 'Refresh token inválido o expirado. Inicie sesión de nuevo.' });
    }

    const resultadoUsuario = await pool.query(
      `SELECT u.id, r.nombre AS rol
       FROM usuarios u
       INNER JOIN roles r ON r.id = u.rol_id
       WHERE u.id = $1 AND u.activo = true`,
      [decoded.sub]
    );

    const usuario = resultadoUsuario.rows[0];
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }

    const nuevoAccessToken = generarAccessToken(usuario);

    // HU-5: emite el nuevo access token en cookie — no en el body
    res.cookie('access_token', nuevoAccessToken, ACCESS_COOKIE_OPTIONS);

    return res.status(200).json({ ok: true });
  } catch (error) {
    return manejarErrorInterno(error, res, 'refreshSession');
  }
};

/**
 * 🚪 HU-5: Cierre de sesión — limpia ambas cookies httpOnly
 * CRÍTICO: clearCookie debe usar las mismas opciones (path, sameSite, secure)
 * con las que se crearon las cookies; de lo contrario el navegador no las borra.
 */
const logout = async (req, res) => {
  try {
    // Revocar refresh tokens activos en BD si hay usuario identificado
    const usuarioId = req.usuario?.sub ?? req.usuario?.id ?? null;
    if (usuarioId) {
      await pool.query(
        `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
        [usuarioId]
      );
    }

    // Limpiar ambas cookies con exactamente las mismas opciones con las que se crearon
    res.clearCookie('access_token', {
      httpOnly: ACCESS_COOKIE_OPTIONS.httpOnly,
      secure: ACCESS_COOKIE_OPTIONS.secure,
      sameSite: ACCESS_COOKIE_OPTIONS.sameSite,
      // path por defecto '/' — igual que cuando se creó
    });
    res.clearCookie('refresh_token', {
      httpOnly: REFRESH_COOKIE_OPTIONS.httpOnly,
      secure: REFRESH_COOKIE_OPTIONS.secure,
      sameSite: REFRESH_COOKIE_OPTIONS.sameSite,
      path: REFRESH_COOKIE_OPTIONS.path, // CRÍTICO: mismo path restringido
    });

    return res.status(200).json({ mensaje: 'Sesión cerrada exitosamente.' });
  } catch (error) {
    return manejarErrorInterno(error, res, 'logout');
  }
};

module.exports = { login, me, logout, refreshSession };