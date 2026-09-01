const express = require('express');
const router = express.Router();

// Importa el controlador
const controlador = require('../controladores/tokens_notificaciones.controlador');

//  Importa el middleware
const {verificarRol, verificarToken} = require('../middleware/usuarios.middleware');


router.post('/', verificarToken, verificarRol(["encargado", "trabajador"]), controlador.registrarToken);

router.delete('/:token', verificarToken, verificarRol(["encargado", "trabajador"]), controlador.eliminarToken);

//Exporta el router
module.exports = router;