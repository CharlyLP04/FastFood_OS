const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verificarToken } = require('../middleware/auth');
const { verificarRol } = require('../middleware/checkRole');

// All user routes require authentication and admin privileges
router.use(verificarToken, verificarRol('administrador'));

router.get('/', userController.getUsers);
router.get('/roles', userController.getRoles);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.patch('/:id/status', userController.toggleUserStatus);
router.delete('/:id', userController.deleteUser);

module.exports = router;
