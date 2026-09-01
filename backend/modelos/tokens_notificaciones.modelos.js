const pool = require('../bd');

class TokenNotificacionesModelo {
    
    // Método para crear un token de notificación
    static async crearToken(id_usuario, token) {
        const resultado = await pool.query(
            `
            INSERT INTO tokens_notificaciones (id_usuario, token)
            VALUES ($1, $2)
            ON CONFLICT (token)
            DO UPDATE SET id_usuario = EXCLUDED.id_usuario
            RETURNING *
            `,
            [id_usuario, token]
        );

        return resultado.rows[0];
    }

    // Método para obtener todos los tokens de notificación de un usuario
    static async obtenerTokensUsuario(id_usuario) {
        const resultado = await pool.query(
            `SELECT token FROM tokens_notificaciones WHERE id_usuario = $1`,
            [id_usuario]
        );

        return resultado.rows;
    }

    // Método para borrar un token de notificación
    static async borrarToken(id_usuario, token) {
        const resultado = await pool.query(
            `DELETE FROM tokens_notificaciones WHERE id_usuario=$1 AND token = $2 RETURNING *`,
            [id_usuario, token]
        );

        return resultado.rows[0];
    }
}
    
module.exports = TokenNotificacionesModelo;