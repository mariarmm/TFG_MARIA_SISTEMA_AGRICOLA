
const NotificacionesModelo = require("../modelos/notificaciones.modelo");
const NotificacionesServicio = require("../servicios/notificaciones.servicio");


class NotificacionesControlador {

    //Controlador para registrar una notificación
    static async registrarNotificacion(req, res) {

        const {mensaje, id_usuario} = req.body;

        if(!mensaje || !id_usuario){
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        }

        try {

            const notificacion = await NotificacionesServicio.enviarNotificacion(id_usuario, mensaje);

            // Respuesta exitosa, devuelve la notificacion
            res.status(201).json(notificacion);
        }
        catch (err){

            // Mensaje de error
            console.error("Error en el proceso de crear una notificación:", err.message);
            res.status(500).json({error: "Error en el servidor"});
        }

    };

    //Controlador para obtener las notificaciones de un usuario
    static async obtenerNotificacionesUsuario(req, res) {

        const id_usuario = req.params.id;
        const usuario = req.usuario;

        if(!id_usuario){
            return res.status(400).json({ error: "Falta indicar el id del usuario" });
        }

        if(usuario.rol==="trabajador" && usuario.id!=id_usuario){
            return res.status(403).json({ error: "No tienes permiso para acceder a las notificaciones de otro usuario." });
        }
        

        try{
            const notificaciones = await NotificacionesModelo.obtenerNotificacionesPorIdUsuario(id_usuario);

            // Respuesta exitosa, devuelve las notificaciones
            res.status(200).json(notificaciones);
        }
        catch (err){

            // Mensaje de error
            console.error("Error en el proceso de obtener las notificaciones:", err.message);
            res.status(500).json({error: "Error en el servidor"});
        }

    }

    //Controlador para marcar una notificación como leída
    static async marcarLeida(req, res) {

        const id_notificacion = req.params.id;
        const usuario = req.usuario;

        if(!id_notificacion){
            return res.status(400).json({ error: "Falta indicar el id de la notificación" });
        }

        try{

            //Comprueba que exista la notificación
            const notificacion = await NotificacionesModelo.obtenerNotificacionPorId(id_notificacion);
            if(!notificacion){
                return res.status(404).json({ error: "No se ha encontrado la notificación." });
            }

            //Comprueba que el usuario que la quiere marcar como leída sea el usuario asociado a la notificación (usuario al que está dirigida la notificación)
            if(usuario.id != notificacion.id_usuario){
                return res.status(403).json({ error: "No tienes permiso para realizar esta acción." });
            }

            //Marca como leida la notificación
            const notificacionLeida = await NotificacionesModelo.actualizarLeida(id_notificacion);

            // Respuesta exitosa, devuelve la notificacion
            res.status(200).json(notificacionLeida);
        }
        catch (err){

            // Mensaje de error
            console.error("Error en el proceso de marcar como leida la notificación:", err.message);
            res.status(500).json({error: "Error en el servidor"});
        }
    }
}

module.exports = NotificacionesControlador;