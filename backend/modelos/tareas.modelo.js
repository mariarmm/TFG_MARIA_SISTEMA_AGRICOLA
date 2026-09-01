const pool = require('../bd');

class TareasModelo {

    //Método para crear una tarea
    //Devuelve la tarea creada
    static async crearTarea(nombre, fecha_ini, fecha_fin, id_trabajador, id_parcela, id_maquina, descripcion, estado, fecha_planificada) {
        const resultado = await pool.query(
            `INSERT INTO tarea (nombre, fecha_ini, fecha_fin, id_trabajador, id_parcela, id_maquina, descripcion, estado, fecha_planificada) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING * `,
            [nombre, fecha_ini, fecha_fin, id_trabajador, id_parcela, id_maquina, descripcion, estado, fecha_planificada]
        );

        return resultado.rows[0];
    };

    //Método para borrar una tarea por su id.
    //Devuelve la tarea borrada.
    static async borrarTarea(id_tarea) {
        const resultado = await pool.query(
            "DELETE FROM tarea WHERE id = $1 RETURNING *",
            [id_tarea]
        );
        return resultado.rows[0];
    };

    // Método para obtener las tareas filtrando por trabajador, encargado, fecha o estado. Si no se indica ningún filtro, devuelve todas las tareas.
    static async obtenerTareasGeneral({ id_trabajador, id_encargado, fecha_planificada_desde, fecha_planificada_hasta, fecha_fin_desde, fecha_fin_hasta, estado, id_parcela, id_maquina, fecha_fin }) {
        let query = `
            SELECT t.id, t.nombre, 
            TO_CHAR(t.fecha_ini, 'YYYY-MM-DD HH24:MI') AS fecha_ini, 
            TO_CHAR(t.fecha_fin, 'YYYY-MM-DD HH24:MI') AS fecha_fin, 
            t.id_trabajador, 
            t.id_parcela, t.id_maquina, m.nombre as nombre_maquina, t.descripcion, t.estado, 
            TO_CHAR(t.fecha_planificada, 'YYYY-MM-DD') AS fecha_planificada,
            u.nombre as nombre_trabajador, p.nombre as nombre_parcela 
            FROM tarea t 
            JOIN usuario u ON t.id_trabajador = u.id 
            LEFT JOIN parcela p ON t.id_parcela = p.id
            LEFT JOIN maquina m ON t.id_maquina = m.id
            WHERE 1=1`; //1=1 permite concatenar ANDs
        
        let valores = [];
        let contador = 1;

        if (id_trabajador) {
            query += ` AND t.id_trabajador = $${contador++}`;
            valores.push(id_trabajador);
        }
        if (id_encargado) {
            query += ` AND u.id_encargado = $${contador++}`;
            valores.push(id_encargado);
        }
        if (fecha_planificada_desde) {
            query += ` AND DATE(t.fecha_planificada) >= $${contador++}`;
            valores.push(fecha_planificada_desde);
        }
        if (fecha_planificada_hasta) {
            query += ` AND DATE(t.fecha_planificada) <= $${contador++}`;
            valores.push(fecha_planificada_hasta);
        }
        if (fecha_fin_desde) {
            query += ` AND DATE(t.fecha_fin) >= $${contador++}`;
            valores.push(fecha_fin_desde);
        }

        if (fecha_fin_hasta) {
            query += ` AND DATE(t.fecha_fin) <= $${contador++}`;
            valores.push(fecha_fin_hasta);
        }

        if(fecha_fin){
            query += ` AND TO_CHAR(t.fecha_fin, 'YYYY-MM-DD') = $${contador++}`;
            valores.push(fecha_fin);
        }
        if(id_parcela){
            query += ` AND t.id_parcela = $${contador++}`;
            valores.push(id_parcela);
        }
        if(id_maquina){
            query += ` AND t.id_maquina = $${contador++}`;
            valores.push(id_maquina);
        }
        if (estado) {

            if(estado === "tareas_retrasadas"){
                query += ` AND t.fecha_planificada < CURRENT_DATE AND t.fecha_fin IS NULL`;
            }
            else{
                query += ` AND t.estado = $${contador++}`;
                valores.push(estado);
            }
            
        }

        query += ` ORDER BY fecha_planificada ASC`;

        const resultado = await pool.query(query, valores);
        return resultado.rows;
    };

    //Método para actualizar el estado de la tarea id_tarea
    //Comprueba cual es el estado al que se cambia para añadir la fecha de inicio o de fin
    static async cambiarEstado(id_tarea, estado) {

        let setFecha = "";

        //Si se inicia la tarea, se guarda la fecha de inicio
        if(estado === "en_proceso"){
            setFecha = ", fecha_ini = NOW()";
        }
        //Si se completa la tarea, se guarda la fecha de fin
        else if(estado === "completada"){
            setFecha = ", fecha_fin = NOW()";
        }

        const resultado = await pool.query(
            `UPDATE tarea SET estado = $1 ${setFecha} WHERE id = $2 RETURNING *`,
            [estado, id_tarea]
        );
        
        return resultado.rows[0];
    }

    //Método para modificar los datos de una tarea (excepto el campo estado)
    //Solo se modifican los campos que se envían en el cuerpo de la petición, el resto se mantiene igual.
    static async actualizarTarea(id_tarea, nombre, id_trabajador, id_parcela, id_maquina, descripcion, fecha_planificada) {
        let query, valores;

        query = `UPDATE tarea SET 
            nombre = COALESCE($1, nombre),
            id_trabajador = COALESCE($2, id_trabajador),
            id_parcela = COALESCE($3, id_parcela),
            id_maquina = COALESCE($4, id_maquina),
            descripcion = COALESCE($5, descripcion),
            fecha_planificada = COALESCE($6, fecha_planificada)
            WHERE id = $7 RETURNING *` ;
        
        valores = [nombre, id_trabajador, id_parcela, id_maquina, descripcion, fecha_planificada, id_tarea];
        
        const resultado = await pool.query(query, valores);
        return resultado.rows[0];    
    }


    //Método para obtener las tareas comenzadas en una semana especifica que están asociadas a los trabajadores del encargado id_encargado
    static async obtenerTareasSemana(lunes, domingo, id_encargado) {
        const resultado = await pool.query(
            `SELECT t.id, t.nombre, t.fecha_ini, u.nombre as trabajador, t.descripcion, t.id_maquina
            FROM tarea t
            JOIN usuario u ON u.id = t.id_trabajador
            WHERE u.id_encargado = $3
            AND t.fecha_ini BETWEEN $1 AND $2`,
            [lunes, domingo, id_encargado]
        );

        return resultado.rows;
    }

    //Método para obtener una tarea por su id
    static async obtenerTareaPorId(id_tarea) {
        const resultado = await pool.query(
            `SELECT t.*, u.id_encargado FROM tarea t 
            JOIN usuario u ON u.id = t.id_trabajador
            WHERE t.id=$1`,
            [id_tarea]
        );

        return resultado.rows[0];
    }
}


module.exports = TareasModelo;