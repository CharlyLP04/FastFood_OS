const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const dbUrl = process.env.DB_URL || 'postgresql://neondb_owner:npg_1U7IBdhLgFSR@ep-muddy-paper-au5qplrv.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require';

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function resetUsers() {
  try {
    console.log('⚡ Conectando a la base de datos PostgreSQL...');
    await client.connect();

    console.log('🧹 Limpiando tokens de refresco antiguos...');
    await client.query('DELETE FROM refresh_tokens;');

    const hashAdmin = await bcrypt.hash('admin123', 10);
    const hashMesero = await bcrypt.hash('mesero123', 10);
    const hashCocina = await bcrypt.hash('cocina123', 10);
    const hashCajero = await bcrypt.hash('cajero123', 10);

    const testUsers = [
      { nombre: 'Admin', apellido: 'General', username: 'admin', passHash: hashAdmin, rol: 'administrador' },
      { nombre: 'Mesero', apellido: 'Principal', username: 'mesero', passHash: hashMesero, rol: 'mesero' },
      { nombre: 'Cocinero', apellido: 'Jefe', username: 'cocina', passHash: hashCocina, rol: 'cocina' },
      { nombre: 'Cajero', apellido: 'Turno', username: 'cajero', passHash: hashCajero, rol: 'cajero' },
    ];

    console.log('🔍 Verificando roles en la base de datos...');
    const allRoles = await client.query('SELECT * FROM roles;');
    console.log('Roles existentes:', allRoles.rows);

    // Asegurar que existan los roles básicos
    const rolesNecesarios = ['administrador', 'mesero', 'cocina', 'cajero'];
    for (const rName of rolesNecesarios) {
      const existe = allRoles.rows.some((row) => row.nombre.toLowerCase() === rName);
      if (!existe) {
        await client.query('INSERT INTO roles (nombre) VALUES ($1);', [rName]);
        console.log(` ➕ Rol '${rName}' creado`);
      }
    }

    for (const u of testUsers) {
      // Obtener ID de rol
      const resRol = await client.query('SELECT id FROM roles WHERE LOWER(nombre) = $1', [u.rol]);
      if (resRol.rows.length === 0) {
        console.warn(`⚠️ Rol ${u.rol} no encontrado, omitiendo ${u.username}`);
        continue;
      }
      const rolId = resRol.rows[0].id;

      // Upsert usuario
      const resUser = await client.query('SELECT id FROM usuarios WHERE username = $1', [u.username]);
      if (resUser.rows.length > 0) {
        await client.query(
          `UPDATE usuarios 
           SET password_hash = $1, activo = true, nombre = $2, apellido = $3, rol_id = $4
           WHERE username = $5`,
          [u.passHash, u.nombre, u.apellido, rolId, u.username]
        );
        console.log(` ✅ Usuario '${u.username}' actualizado (password reseteada)`);
      } else {
        await client.query(
          `INSERT INTO usuarios (nombre, apellido, username, password_hash, rol_id, activo)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [u.nombre, u.apellido, u.username, u.passHash, rolId]
        );
        console.log(` ✅ Usuario '${u.username}' creado exitosamente`);
      }
    }

    console.log('\n🎉 ¡USUARIOS DE PRUEBA LISTOS!');
    console.log('────────────────────────────────────────────────────────');
    console.log(' 👑 Admin:    usuario: admin    | contraseña: admin123');
    console.log(' 🍽️ Mesero:   usuario: mesero   | contraseña: mesero123');
    console.log(' 👨‍🍳 Cocina:   usuario: cocina   | contraseña: cocina123');
    console.log(' 💵 Cajero:   usuario: cajero   | contraseña: cajero123');
    console.log('────────────────────────────────────────────────────────');

  } catch (err) {
    console.error('❌ Error al resetear usuarios:', err);
  } finally {
    await client.end();
  }
}

resetUsers();
