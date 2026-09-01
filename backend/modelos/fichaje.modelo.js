const pool = require('../bd');          //Importa la conexión a la bd


class FichajeModelo {

    //Método para crear un fichaje
    static async crearFichaje(id_trabajador) {

        const resultado = await pool.query(
            `INSERT INTO fichaje (id_usuario, inicio, activo) VALUES ($1, NOW(), true) RETURNING *`,
            [id_trabajador]
        );

        return resultado.rows[0];
    };

    //Método para finalizar un fichaje
    static async terminarFichaje(id_trabajador) {

        const resultado = await pool.query(
            `UPDATE fichaje SET fin = NOW(), total_horas = (EXTRACT(EPOCH FROM (NOW() - inicio )) / 3600), activo=false 
            WHERE id_usuario=$1 AND fin IS NULL AND activo=true RETURNING *`,
            [id_trabajador]
        );

        return resultado.rows[0];
    };

    //Método para comprobar si un trabajador está activo (si está trabajando ahora) o no
    static async fichajeActivo(id_trabajador) {

        const resultado = await pool.query(
            `SELECT activo FROM fichaje WHERE id_usuario=$1 ORDER BY id DESC LIMIT 1`,
            [id_trabajador]
        );

        return resultado.rows[0]?.activo || false;
    };

    //Método par aobtener los fichajes de una semana de los trabajadores asociados al encargado id_encargado
    static async obtenerFichajesSemana(lunes, domingo, id_encargado) {

        const resultado = await pool.query(
            `SELECT f.inicio::date AS fecha, 
                    u.nombre AS trabajador, 
                    f.total_horas
            FROM fichaje f
            JOIN usuario u ON u.id = f.id_usuario
            WHERE u.id_encargado = $3
            AND f.inicio::date BETWEEN $1 AND $2`,
            [lunes, domingo, id_encargado]
        );

        return resultado.rows;
    }

    //Método para obtener el fichaje activo de un trabajador
    static async obtenerFichajeActivo(id_trabajador) {
        const resultado = await pool.query(
            `SELECT * FROM fichaje WHERE id_usuario=$1 
            AND activo=true AND fin IS NULL 
            ORDER BY id DESC 
            LIMIT 1`,
            [id_trabajador]
        );

        return resultado.rows[0] || null;
    };


    // Método para obtener el fichaje realizado hoy por un trabajador
    static async obtenerFichajeHoy(id_trabajador) {

        const resultado = await pool.query(
            `SELECT * FROM fichaje WHERE id_usuario = $1 AND inicio::date = CURRENT_DATE
            ORDER BY id DESC LIMIT 1`,
            [id_trabajador]
        );

        return resultado.rows[0] || null;
    };
}

// Exporta la clase FichajeModelo
module.exports = FichajeModelo;