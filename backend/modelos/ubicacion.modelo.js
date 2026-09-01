//Importa la conexión a la base de datos
const pool = require("../bd");


class UbicacionModelo {

    //Inserta o actualiza la última actualización de un trabajador
    static async upsertUbicacion({ id_trabajador, lat, lon }) {
        return pool.query(
            `
            INSERT INTO ubicaciones (id_trabajador, lat, lon, ult_actualizacion)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (id_trabajador)
            DO UPDATE SET
                lat = EXCLUDED.lat,
                lon = EXCLUDED.lon,
                ult_actualizacion = NOW();
            `,
            [id_trabajador, lat, lon]
        );
    };

    //Obtiene todas las ubicaciones de los trabajadores asociados a un encargado concreto
    static async obtenerUbicacionesPorEncargado(id_encargado) {

        return pool.query(
            `SELECT 
                u.id AS id_trabajador,
                u.nombre AS nombre,
                ub.lat,
                ub.lon,
                ub.ult_actualizacion,
                st.id_maquina,
                st.id_tarea
            FROM usuario u
            JOIN ubicaciones ub ON ub.id_trabajador = u.id
            LEFT JOIN sesion_trabajo st ON st.id_trabajador = u.id AND st.activa = TRUE
            WHERE u.id_encargado = $1
            AND EXISTS (
                SELECT 1
                FROM fichaje f
                WHERE f.id_usuario = u.id
                AND f.activo = true
            )`,
            [id_encargado]
        );
    };

    //Obtiene la última ubicación almacenada de un trabajador
    static async obtenerUltimaUbicacion(id_trabajador) {
        const resultado = await pool.query(
            `SELECT lat, lon FROM ubicaciones WHERE id_trabajador = $1`,
            [id_trabajador]
        );
        return resultado.rows[0] ?? null;
    };
}

module.exports = UbicacionModelo;