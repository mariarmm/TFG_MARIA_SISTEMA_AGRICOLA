const express = require("express");
const router = express.Router();
const controlador = require("../controladores/ubicacion.controlador");

// Importa el middleware
const {verificarRol, verificarToken} = require('../middleware/usuarios.middleware');

router.post("/", verificarToken, verificarRol(["encargado", "trabajador"]), controlador.actualizarUbicacion);

router.get("/", verificarToken, verificarRol(["encargado"]), controlador.obtenerUbicaciones);

router.patch("/", verificarToken, verificarRol(["encargado", "trabajador"]), controlador.actualizarUbicacion);

module.exports = router;