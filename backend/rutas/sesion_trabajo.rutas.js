const express = require('express');
const router = express.Router();

// Importa el controlador
const { obtenerSesionActiva, iniciarSesionTrabajo } = require('../controladores/sesion_trabajo.controlador');

//  Importa el middleware
const {verificarRol, verificarToken} = require('../middleware/usuarios.middleware');


//Ruta para obtener la sesión activa de un trabajador
router.get("/activa", verificarToken, verificarRol(["encargado", "trabajador"]), obtenerSesionActiva);

//Ruta para iniciar una nueva sesión de trabajo
router.post("/iniciar", verificarToken, verificarRol(["trabajador"]), iniciarSesionTrabajo);

//Exporta el router
module.exports = router;