const express = require('express');
const router = express.Router();

//Importa el controlador
const NotificacionesControlador = require('../controladores/notificaciones.controlador');

// Importa el middleware
const {verificarRol, verificarToken} = require('../middleware/usuarios.middleware');

//Definición de rutas

//Ruta para crear una notificación
router.post('/', verificarToken, verificarRol(["encargado"]), NotificacionesControlador.registrarNotificacion);

//Ruta para obtener las notificaciones
router.get('/:id', verificarToken, verificarRol(["trabajador"]), NotificacionesControlador.obtenerNotificacionesUsuario);

//Ruta para marcar como leída una notificación
router.patch('/:id/leida', verificarToken, verificarRol(["trabajador"]), NotificacionesControlador.marcarLeida)

//Exporta el router
module.exports = router;
