const express = require('express');
const router = express.Router();

// Importa el controlador
const MaquinasControlador = require('../controladores/maquinas.controlador');

//  Importa el middleware
const {verificarRol, verificarToken} = require('../middleware/usuarios.middleware');

// Definición de rutas:

//Ruta para el registro de maquinas
router.post('/', verificarToken, verificarRol(["encargado"]), MaquinasControlador.registrarMaquina);

//Ruta para eliminar una maquina
router.delete('/:id', verificarToken, verificarRol(["encargado"]), MaquinasControlador.eliminarMaquina);

// Obtener maquinas (con filtros)
router.get('/', verificarToken, verificarRol(["encargado"]), MaquinasControlador.listarMaquinas);

//Ruta para modificar una maquina
router.patch('/:id', verificarToken, verificarRol(["encargado"]), MaquinasControlador.modificarMaquina);

//Exporta el router
module.exports = router;