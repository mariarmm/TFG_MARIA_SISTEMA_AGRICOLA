const express = require('express');
const router = express.Router();

// Importa el controlador
const FichajeControlador = require('../controladores/fichaje.controlador');

//  Importa el middleware
const {verificarRol, verificarToken} = require('../middleware/usuarios.middleware');

//Definición de rutas:
// Registrar fichaje
router.post('/', verificarToken, verificarRol(["trabajador"]), FichajeControlador.registrarFichaje);

//Finalizar fichaje
router.post('/finalizar', verificarToken, verificarRol(["trabajador"]), FichajeControlador.finalizarFichaje);

//Obtener fichaje
router.get("/", verificarToken, verificarRol(["trabajador", "encargado"]), FichajeControlador.obtenerFichaje);

module.exports = router;