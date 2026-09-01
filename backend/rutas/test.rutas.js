const express = require("express");

const { limpiarEstadoTrabajador } = require("../pruebas_unitarias/auxiliar");

const router = express.Router();

router.post("/reset-trabajador", async (req, res) => {

    try {

        const { idTrabajador } = req.body;

        await limpiarEstadoTrabajador(idTrabajador);

        res.sendStatus(204);

    } catch (err) {

        console.error(err);
        res.status(500).json({
            error: "Error al limpiar el estado del trabajador"
        });
    }

});

module.exports = router;