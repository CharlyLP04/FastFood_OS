/**
 * validateEnv.js — Validación de variables de entorno al arranque del servidor
 *
 * HU-4: El servidor debe fallar de forma explícita y clara si faltan variables
 * críticas, en lugar de fallar silenciosamente en runtime con errores crípticos
 * (e.g. "invalid signature" porque JWT_SECRET es undefined, o "ECONNREFUSED"
 * porque DB_URL es undefined).
 *
 * Llamar a validateEnv() es la PRIMERA línea de index.js, antes de cualquier
 * require() de rutas o middleware que dependa de estas variables.
 *
 * Uso:
 *   const validateEnv = require('./src/config/validateEnv');
 *   validateEnv(); // lanza y mata el proceso si falta algo
 */

/**
 * Definición de variables requeridas.
 * Cada entrada puede tener:
 *   - name        {string}   Nombre de la variable de entorno
 *   - description {string}   Para qué sirve (aparece en el mensaje de error)
 *   - validate    {Function} Validación adicional opcional; devuelve string de error o null
 *   - onlyIn      {string[]} Si se especifica, solo se valida en esos NODE_ENVs
 */
const REQUIRED_VARS = [
  {
    name: 'JWT_SECRET',
    description: 'Clave secreta para firmar y verificar tokens JWT',
    validate: (val) => {
      if (val.length < 32) {
        return `JWT_SECRET debe tener al menos 32 caracteres (actual: ${val.length}). ` +
          'Genera una segura con: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"';
      }
      if (val === 'una_clave_secreta_super_segura_para_firmar_tokens_12345' ||
          val === 'tu_clave_secreta_muy_segura_aqui' ||
          val === 'secret_key_temporal') {
        return 'JWT_SECRET contiene un valor de ejemplo/placeholder. Usa un secreto real y aleatorio.';
      }
      return null;
    },
  },
  {
    name: 'DB_URL',
    description: 'URL de conexión a la base de datos PostgreSQL',
    validate: (val) => {
      if (!val.startsWith('postgresql://') && !val.startsWith('postgres://')) {
        return 'DB_URL debe comenzar con "postgresql://" o "postgres://"';
      }
      return null;
    },
  },
  {
    name: 'ALLOWED_ORIGINS',
    description: 'Lista de orígenes permitidos por CORS (separados por coma)',
    optional: true,
    validate: (val) => {
      if (!val) return null;
      const origins = val.split(',').map((o) => o.trim()).filter(Boolean);
      const invalid = origins.filter((o) => !o.startsWith('http://') && !o.startsWith('https://'));
      if (invalid.length > 0) {
        return `Los siguientes orígenes no tienen protocolo (http/https): ${invalid.join(', ')}`;
      }
      return null;
    },
  },
  {
    name: 'STRIPE_SECRET_KEY',
    description: 'Clave secreta de Stripe para pagos',
    optional: true,
    validate: (val) => {
      if (!val) return null;
      if (!val.startsWith('sk_')) {
        return 'STRIPE_SECRET_KEY debe comenzar con "sk_test_" (pruebas) o "sk_live_" (producción)';
      }
      return null;
    },
  },
];

/**
 * validateEnv()
 * Valida todas las variables críticas. Si alguna falla, imprime un mensaje
 * claro en consola y termina el proceso con código 1.
 *
 * @throws {process.exit(1)} Si falta o es inválida alguna variable requerida
 */
function validateEnv() {
  const env = process.env.NODE_ENV || 'development';
  const errors = [];

  for (const varDef of REQUIRED_VARS) {
    // Saltar si esta variable solo aplica a ciertos entornos
    if (varDef.onlyIn && !varDef.onlyIn.includes(env)) {
      continue;
    }

    const value = process.env[varDef.name];

    if (!value || value.trim() === '') {
      if (varDef.optional) {
        console.warn(`  ⚠️ [validateEnv] Variable opcional ${varDef.name} no está configurada (${varDef.description})`);
        continue;
      }
      errors.push(`  ✗ ${varDef.name} — falta o está vacía (${varDef.description})`);
      continue;
    }

    // Validación adicional si está definida
    if (varDef.validate) {
      const validationError = varDef.validate(value.trim());
      if (validationError) {
        if (varDef.optional) {
          console.warn(`  ⚠️ [validateEnv] ${varDef.name} — ${validationError}`);
        } else {
          errors.push(`  ✗ ${varDef.name} — ${validationError}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error('\n');
    console.error('╔══════════════════════════════════════════════════════════════╗');
    console.error('║   🚨 ERROR: Variables de entorno faltantes o inválidas       ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
    console.error(`\nEntorno: ${env}`);
    console.error('\nProblemas encontrados:');
    errors.forEach((e) => console.error(e));
    console.error('\n▶ Copia server/.env.example a server/.env y completa los valores.');
    console.error('▶ En Render/Vercel, configura estas variables en el dashboard.');
    console.error('\n');
    process.exit(1);
  }

  if (env !== 'test') {
    console.log(`✅ [validateEnv] Variables de entorno validadas correctamente (${env})`);
  }
}

module.exports = validateEnv;
