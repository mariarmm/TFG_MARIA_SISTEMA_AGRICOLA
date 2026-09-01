
const NotificacionesModelo = require("../modelos/notificaciones.modelo");
const modeloTokenNotificaciones = require('../modelos/tokens_notificaciones.modelos');

const admin = require("./firebase.servicio");

class NotificacionesServicio {
    
    // Instancia de Socket.IO
    static #io = null;

    // Inyecta la instancia de Socket.IO en el servicio
    static setSocket(ioInstancia) {
        this.#io = ioInstancia;
    }

    //Método para enviar una notificación a un usuario
    static async enviarNotificacion(id_usuario, mensaje) {

        //Guarda en bd la notificación
        const notificacion = await NotificacionesModelo.crearNotificacion(id_usuario, mensaje);

        //Emite en tiempo real por socket
        if (this.#io) {
            this.#io
                .to(`usuario_${id_usuario}`)
                .emit("notificacion", notificacion);
        }

        //Envia notificación push al movil
        try {
            const tokens = await modeloTokenNotificaciones.obtenerTokensUsuario(id_usuario);

            if (tokens.length > 0) {
                
                //Manda la notificación a todos los dispositivos en los que tenga la sesión iniciada
                const respuesta = await admin.messaging().sendEachForMulticast({
                    tokens: tokens.map(t => t.token),
                    notification: {
                        title: "Nueva notificación",
                        body: mensaje
                    },
                    data: {
                        tipo: "notificacion",
                        id_usuario: String(id_usuario)
                    }
                });

                // Si algún token es inválido, se borra de la BD
                for (let i = 0; i < respuesta.responses.length; i++) {
                    const r = respuesta.responses[i];

                    if (!r.success) {
                        const codigo = r.error?.code;

                        if (
                            codigo === "messaging/registration-token-not-registered" ||
                            codigo === "messaging/invalid-registration-token"
                        ) {
                            await modeloTokenNotificaciones.borrarToken(id_usuario, tokens[i].token);
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Error enviando push notification:", err.message);
        }
        

        return notificacion;
    };

    //Método para enviar evento de actualización de tareas a un usuario
    static async enviarActualizarTareas(id_usuario) {
    
        if (this.#io) {
            this.#io
                .to(`usuario_${id_usuario}`)
                .emit("tareas_actualizadas");
        }
    }
}

module.exports = NotificacionesServicio;