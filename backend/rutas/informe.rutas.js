const express = require("express");
const router = express.Router();

const InformeControlador = require("../controladores/informe.controlador.js");

//  Importa el middleware
const {verificarRol, verificarToken} = require('../middleware/usuarios.middleware');

router.get("/", verificarToken, verificarRol(["encargado"]), InformeControlador.obtenerInformeSemanal);

router.patch("/observacion", verificarToken, verificarRol(["encargado"]), InformeControlador.actualizarObservacion);

module.exports = router;