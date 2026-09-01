const express = require('express');
const router = express.Router();

// Importa el controlador
const UsuariosControlador = require("../controladores/usuarios.controlador");


//  Importa el middleware
const {verificarRol, verificarToken} = require('../middleware/usuarios.middleware');


// Definición de rutas:
//Ruta para el registro de usuarios
    //si accede el encargado solo puede registrar trabajadores vinculados a él
router.post('/', verificarToken, verificarRol(["encargado"]), UsuariosControlador.registrarUsuario);


// router.patch("/contrasenia", verificarToken, verificarRol(["trabajador", "encargado"]), actualizarContraseña);

//Ruta para modificar usuario
router.patch('/:id', verificarToken, verificarRol(["encargado"]), UsuariosControlador.modificarUsuario);


//Ruta para eliminar usuarios
    //si accede el encargado comprueba que el id del trabajador que quiere borrar esté asociado a él
router.delete('/:id', verificarToken, verificarRol(["encargado"]), UsuariosControlador.eliminarUsuario);


//Ruta para listar todos los trabajadores
    //si accede el admin devuelve todos los trabajadores registrados en el sistema
    //si accede el encargado devuelve todos los trabajadores asociados a él
router.get('/', verificarToken, verificarRol(["encargado"]), UsuariosControlador.listarUsuarios);


//Exporta el router
module.exports = router;