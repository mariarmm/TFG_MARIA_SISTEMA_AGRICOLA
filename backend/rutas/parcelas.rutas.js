const express = require('express');
const router = express.Router();

// Importa el controlador
const ParcelasControlador = require('../controladores/parcelas.controlador');

// Importa el middleware
const {verificarRol, verificarToken} = require('../middleware/usuarios.middleware');

//Definición de rutas:
// Crear parcela
router.post('/', verificarToken, verificarRol(["encargado"]), ParcelasControlador.registrarParcela);

//Modificar parcela
router.patch('/:id', verificarToken, verificarRol(["encargado"]), ParcelasControlador.modificarParcela);

//Eliminar parcela
router.delete('/:id', verificarToken, verificarRol(["encargado"]), ParcelasControlador.eliminarParcela);

// Obtener parcelas
router.get('/', verificarToken, verificarRol(["encargado"]), ParcelasControlador.listarParcelas);

//Exporta el router
module.exports = router;