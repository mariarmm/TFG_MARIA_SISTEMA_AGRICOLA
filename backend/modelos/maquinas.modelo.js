const pool = require('../bd');


class MaquinasModelo {

    //Método para crear una máquina
    //Devuelve la máquina creada
    static async crearMaquina(nombre, descripcion, id_encargado) {
        const resultado = await pool.query(
            "INSERT INTO maquina (nombre, descripcion, id_encargado) VALUES ($1, $2, $3) RETURNING *",
            [nombre, descripcion, id_encargado]
        );

        return resultado.rows[0];
    };

    //Método para eliminar una máquina por su id.
    static async borrarMaquina(id) {

        const resultado = await pool.query(
            "DELETE FROM maquina WHERE id = $1 RETURNING *",
            [id]
        );

        return resultado.rows[0]; // maquina eliminado
    }

    //Método para obtener una máquina por su id
    static async obtenerMaquinaPorId(id) {
        const resultado = await pool.query(
            "SELECT * FROM maquina WHERE id = $1",
            [id]
        );

        return resultado.rows[0]; // maquina
    }

    //Método para obtener las máquinas, permite filtrar máquinas por id del encargado que las ha creado
    static async obtenerMaquinas({id_encargado}) {

        let query = `SELECT * FROM maquina WHERE 1=1 `;
        let valores = [];

        if(id_encargado){
            query += ` AND id_encargado = $1`;
            valores.push(id_encargado);
        }

        const resultado = await pool.query(query, valores);
        return resultado.rows;
    }

    //Método para modificar la información de una máquina
    static async actualizarMaquina(id_maquina, nombre, descripcion, id_encargado) {
       
        let query, valores;

        query = `UPDATE maquina SET 
            nombre = COALESCE($1, nombre),
            descripcion = COALESCE($2, descripcion),
            id_encargado = COALESCE($3, id_encargado)
            WHERE id = $4 RETURNING *` ;
        
        valores = [nombre, descripcion, id_encargado, id_maquina];
        
        const resultado = await pool.query(query, valores);
        return resultado.rows[0];    
    }

}

module.exports = MaquinasModelo;