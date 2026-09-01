const express = require('express');
const router = express.Router();

// Importa el controlador
const TareasControlador = require('../controladores/tareas.controlador');

// Importa el middleware
const {verificarRol, verificarToken} = require('../middleware/usuarios.middleware');

//Definición de rutas:
// Crear tarea
router.post('/', verificarToken, verificarRol(["encargado"]), TareasControlador.registrarTarea);

//Eliminar una tarea
router.delete('/:id', verificarToken, verificarRol(["encargado"]), TareasControlador.eliminarTarea);

// Obtener tareas (con filtros)
router.get('/', verificarToken, verificarRol(["trabajador", "encargado"]), TareasControlador.listarTareas);

// Actualizar estado de tarea
router.patch('/:id/estado', verificarToken, verificarRol(["trabajador", "encargado"]), TareasControlador.actualizaEstado);

//Modificar tarea
router.patch('/:id', verificarToken, verificarRol(["encargado"]), TareasControlador.modificarTarea);

//Exporta el router
module.exports = router;