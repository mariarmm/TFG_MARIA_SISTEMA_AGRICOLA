//Importa el servicio de ubicaciones y el modelo
const servicioUbicacion = require("../servicios/ubicacion.servicio");
const FichajeModelo = require("../modelos/fichaje.modelo");


class UbicacionControlador {

    //Controlador para actualizar la ubicación de un trabajador
    static async actualizarUbicacion(req, res) {
        const { lat, lon } = req.body;
        const usuario = req.usuario;

        try{
            
            const activo = await FichajeModelo.fichajeActivo(usuario.id);
            console.log("FICHAJE ACTIVO: ", activo);

            if(!activo){
                return res.status(403).json({
                    error: "El trabajador no tiene jornada activa"
                });
            }

            //Validación de datos
            if (!lat || !lon) {
                return res.status(400).json({ error: "Faltan datos de ubicación" });
            }

            //Construye la ubicación 
            const ubicacion = await servicioUbicacion.actualizarUbicacion({
                id_trabajador: usuario.id,
                lat,
                lon
            });

            //Devuelve la ubicación actualizada
            res.status(200).json(ubicacion);
        }
        catch(err){
            console.error(err);

            res.status(500).json({error: "Error servidor"});
        }
    };

    // Controlador para obtener todas las ubicaciones actuales
    static async obtenerUbicaciones(req, res) {

        const usuario = req.usuario;

        if (!req.usuario) {
            return res.status(401).json({ error: "No autenticado" });
        }

        const ubicaciones = await servicioUbicacion.obtenerUbicacionesPorEncargado(usuario.id);

        res.json(ubicaciones);
    };

}

module.exports = UbicacionControlador;