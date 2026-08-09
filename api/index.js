const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const app = require('../server/index');

module.exports = app;
