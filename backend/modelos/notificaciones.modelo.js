const pool = require('../bd');

class NotificacionesModelo {

    //Método para crear una notificación
    //Devuelve la notificación creada
    static async crearNotificacion(id_usuario, mensaje) {
        const resultado = await pool.query(
            "INSERT INTO notificaciones(mensaje, fecha, id_usuario) VALUES ($1, NOW(), $2) RETURNING *",
            [mensaje, id_usuario]
        );

        return resultado.rows[0];
    }

    //Método para obtener las notificaciones de un usuario
    static async obtenerNotificacionesPorIdUsuario(id_usuario) {
        const resultado = await pool.query(
            "SELECT * FROM notificaciones WHERE id_usuario = $1 ORDER BY fecha DESC",
            [id_usuario]
        );

        return resultado.rows;
    }

    //Método para obtener una notificación por su id
    static async obtenerNotificacionPorId(id_notificacion) {
        const resultado = await pool.query(
            "SELECT * FROM notificaciones WHERE id = $1",
            [id_notificacion]
        );

        return resultado.rows[0];
    }

    static async actualizarLeida(id_notificacion) {
        const resultado = await pool.query(
            "UPDATE notificaciones SET leida = TRUE WHERE id = $1 RETURNING *",
            [id_notificacion]
        );

        return resultado.rows[0];
    }

}

module.exports = NotificacionesModelo;