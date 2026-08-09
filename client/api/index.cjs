const path = require('path');

// Cargar .env del server antes de cualquier require
require('dotenv').config({ path: path.join(__dirname, '../../server/.env') });

const app = require('../../server/index');

module.exports = app;
