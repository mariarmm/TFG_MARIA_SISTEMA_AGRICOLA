const express = require('express');
const router = express.Router();

// Importa el controlador
const AutenticacionControlador = require('../controladores/autenticacion.controlador');

//Ruta para activar la cuenta
router.post("/activar-cuenta", AutenticacionControlador.activarCuenta);

//Ruta para el login de usuarios
router.post('/login', AutenticacionControlador.login);

//Exporta el router
module.exports = router;