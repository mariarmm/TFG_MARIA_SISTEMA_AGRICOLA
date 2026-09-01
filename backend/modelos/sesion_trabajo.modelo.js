const pool = require('../bd');


class SesionTrabajoModelo {

    // Método para crear sesión de trabajo
    // Devuelve la sesión creada
    static async crearSesionTrabajo(id_trabajador, id_maquina, id_tarea) {

        const resultado = await pool.query(
            `INSERT INTO sesion_trabajo (id_trabajador, id_maquina, id_tarea, activa, fecha_ini) 
            VALUES ($1, $2, $3, TRUE, NOW()) RETURNING *`,
            [id_trabajador, id_maquina, id_tarea]
        );

        return resultado.rows[0];
    };

    // Método para terminar sesión de trabajo
    // Devuelve la sesión terminada
    static async terminarSesionTrabajo(id_sesion) {
        const resultado = await pool.query(
            "UPDATE sesion_trabajo SET activa=FALSE, fecha_fin=NOW() WHERE id=$1 RETURNING *",
            [id_sesion]
        );

        return resultado.rows[0];
    };

    //Método para obtener la sesión de trabajo de un trabajador para una tarea en concreto, si está activa
    static async obtenerSesionTrabajoActiva(id_trabajador, id_tarea) {
        const resultado = await pool.query(
            `SELECT * FROM sesion_trabajo WHERE id_trabajador=$1 AND id_tarea=$2 AND activa=TRUE`,
            [id_trabajador, id_tarea]
        );

        return resultado.rows[0];
    }

    //Método para obtener las sesiones de trabajo de todos los trabajadores de un encargado en una semana concreta
    static async obtenerSesionesSemana(id_encargado, fecha_inicio, fecha_fin) {

        const resultado = await pool.query(
            `SELECT st.*, t.nombre AS tarea, m.nombre AS maquina, u.nombre AS trabajador
            FROM sesion_trabajo st
            JOIN tarea t ON st.id_tarea = t.id
            LEFT JOIN maquina m ON st.id_maquina = m.id
            JOIN usuario u ON st.id_trabajador = u.id
            WHERE u.id_encargado = $1 AND st.fecha_ini >= $2 AND st.fecha_ini <= $3`,
            [id_encargado, fecha_inicio, fecha_fin]
        );

        return resultado.rows;
    }

    //Método para obtener la sesión activa de un trabajador
    static async obtenerSesionActivaTrabajador(id_trabajador) {

        const resultado = await pool.query(
            `SELECT * FROM sesion_trabajo WHERE id_trabajador = $1 AND activa = TRUE`,
            [id_trabajador]
        );

        return resultado.rows[0] ?? null;
    };


    //Método para saber si un trabajador está realizando alguna tarea.
    // Devuelve true si está realizando alguna tarea, false si no
    static async trabajadorActivo(id_trabajador) {

        const resultado = await pool.query(
            `SELECT 1 FROM sesion_trabajo WHERE id_trabajador = $1 AND activa=TRUE`,
            [id_trabajador]
        );

        return resultado.rowCount > 0;
    }

    //Método para saber si una máquina está siendo usada.
    // Devuelve true si la máquina se está usando, false si no
    static async maquinaActiva(id_maquina) {

        const resultado = await pool.query(
            `SELECT 1 FROM sesion_trabajo WHERE id_maquina = $1 AND activa=TRUE`,
            [id_maquina]
        );

        return resultado.rowCount > 0;
    }

}

module.exports = SesionTrabajoModelo;