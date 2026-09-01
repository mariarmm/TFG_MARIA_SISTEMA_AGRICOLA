const pool = require('../bd');

class ParcelasModelo {
    
    //Método para crear una parcela
    //Devuelve la parcela creada
    static async crearParcela(nombre, hectareas, id_encargado, vertices) {

        const coordenadas = vertices.map(v => `${v.longitud} ${v.latitud}`).join(", ");
        const primerVertice = vertices[0];

        const poligono = `POLYGON((${coordenadas}, ${coordenadas.split(",")[0]}))`;

        const resultado = await pool.query(
            "INSERT INTO parcela (nombre, hectareas, id_encargado, area) VALUES ($1, $2, $3, ST_GeomFromText($4, 4326)) RETURNING * ",
            [nombre, hectareas, id_encargado, poligono]
        );

        return resultado.rows[0];
    };

    //Método para modificar la información de una parcela
    //Devuelve la parcela modificada
    static async actualizarParcela(id_parcela, nombre, hectareas, vertices, id_encargado) {

        let poligono = null;

        if (vertices && vertices.length >= 3) {
            const coordenadas = vertices
                .map(v => `${v.longitud} ${v.latitud}`)
                .join(", ");

            const primerVertice = vertices[0];
            poligono = `POLYGON((${coordenadas}, ${primerVertice.longitud} ${primerVertice.latitud}))`;
        }

        const resultado = await pool.query(
            `UPDATE parcela 
                SET nombre = COALESCE($1, nombre), 
                    hectareas = COALESCE($2, hectareas), 
                    area = COALESCE(ST_GeomFromText($3, 4326), area),
                    id_encargado = COALESCE($4, id_encargado) 
            WHERE id = $5 RETURNING *`,
            [nombre, hectareas, poligono, id_encargado, id_parcela]
        );
        
        return resultado.rows[0];
    }

    //Método para eliminar una parcela por su id.
    static async borrarParcela(id) {
        const resultado = await pool.query(
            "DELETE FROM parcela WHERE id = $1 RETURNING *",
            [id]
        );

        return resultado.rows[0]; // parcela eliminada
    }

    //Método para obtener las parcelas, permite filtrar parcelas por id del encargado que las ha creado
    static async obtenerParcelas(id_encargado) {

        let query = `SELECT id, nombre, hectareas, id_encargado, ST_AsGeoJSON(area) as area FROM parcela WHERE 1=1`;
        let valores;

        if(id_encargado){
            query += " AND id_encargado = $1";
            valores = [id_encargado];
        }
        
        const resultado = await pool.query(query,valores);
        return resultado.rows;
    }

    //Método para obtener una parcela por su id y el id del encargado que la creó
    static async obtenerParcelaPorIdYEncargado(id_parcela, id_encargado) {
        const resultado = await pool.query(
            "SELECT * FROM parcela WHERE id = $1 AND id_encargado = $2",
            [id_parcela, id_encargado]
        );

        return resultado.rows[0]; // parcela encontrada
    }

    //Método para comprobar si existe una parcela por su id
    static async existeParcela(id_parcela) {
        const resultado = await pool.query(
            "SELECT * FROM parcela WHERE id = $1",
            [id_parcela]
        );

        return resultado.rows[0]; // devuelve la parcela si existe
    }

}

module.exports = ParcelasModelo;