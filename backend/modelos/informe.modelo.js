const pool = require('../bd');          //Importa la conexión a la bd

class InformeModelo {

  // Método para obtener un informe por fecha y encargado
  static async obtenerInforme(fecha_inicio, fecha_fin, id_encargado) {
  
    //Verifica si ya existe un informe para esa semana
    const resultado = await pool.query(
      `SELECT i.id, i.observacion, i.id_encargado, u.nombre as encargado
      FROM informe i
      JOIN usuario u ON u.id = i.id_encargado
      WHERE i.fecha_ini = $1
        AND i.fecha_fin = $2
        AND i.id_encargado = $3
      LIMIT 1`,
      [fecha_inicio, fecha_fin, id_encargado]
    );

    return resultado.rows[0];
  }

  //Método para añadir una observación a un informe existente
  static async aniadirObservacion(id_informe, observacion) {

    const resultado = await pool.query(
      `UPDATE informe
      SET observacion = $1
      WHERE id = $2
      RETURNING id, observacion`,
      [observacion, id_informe]
    );

    return resultado.rows[0];
  }

  //Método para registrar un nuevo informe
  static async registrarInforme(id_encargado, fecha_ini, fecha_fin, observacion) {
    const resultado = await pool.query(
      `INSERT INTO informe (id_encargado, fecha_ini, fecha_fin, observacion, fecha_creacion) VALUES ($1,$2,$3,$4, NOW()) RETURNING *`,
      [id_encargado, fecha_ini, fecha_fin, observacion]
    );

    return resultado.rows[0]
  }

}

// Exporta la clase InformeModelo
module.exports = InformeModelo;
