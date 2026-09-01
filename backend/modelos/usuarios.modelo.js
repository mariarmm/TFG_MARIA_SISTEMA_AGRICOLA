//Importa la conexión a la base de datos
const pool = require('../bd');


class UsuarioModelo {


    // Método para crear un usuario
    // Devuelve el usuario creado, sin token ni contraseña
    static async crearUsuario(nombre, email, rol, id_encargado, token) {

        const expiracion = new Date(Date.now() + 1000 * 60 * 60);

        const resultado = await pool.query(
            "INSERT INTO usuario (nombre, email, rol, id_encargado, token, token_expira) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre, email, rol, fecha_alta, id_encargado",
            [nombre, email, rol, id_encargado, token, expiracion]
        );

        return resultado.rows[0];
    };

    //Método para actualizar los datos de un usuario
    static async actualizarUsuario(id_usuario, nombre, email, rol, id_encargado){
        
        const resultado = await pool.query(
            "UPDATE usuario SET nombre = COALESCE($1, nombre), email = COALESCE($2, email), rol = COALESCE($3, rol), id_encargado = COALESCE($4, id_encargado) WHERE id = $5 RETURNING *",
            [nombre, email, rol, id_encargado, id_usuario]
        );
    
        return resultado.rows[0];
    }

    //Método para cambiar la contraseña asociada al usuario
    static async cambiarContraseña(id_usuario, contrasenia){
        const resultado = await pool.query(
            "UPDATE usuario SET contrasenia = $1, token = NULL, token_expira = NULL, cuenta_verificada = TRUE WHERE id = $2 RETURNING nombre, email, rol, fecha_alta, id_encargado",
            [contrasenia, id_usuario]
        );

        return resultado.rows[0];
    }

    //Método para obtener el usuario con el token tokenHash
    static async obtenerUsuarioPorToken(tokenHash){
        const resultado = await pool.query(
            `SELECT * FROM usuario WHERE token = $1 AND token_expira > NOW()`,
            [tokenHash]
        );

        return resultado.rows[0];
    }

    //Método para obtener el usuario con id id_usuario
    static async  obtenerUsuarioPorId(id_usuario) {

        const resultado = await pool.query(
            `SELECT * FROM usuario WHERE id = $1`,
            [id_usuario]
        );

        return resultado.rows[0];
    };

    // Método para obtener el usuario con su email
    // Devuelve el resultado de la búsqueda, si ha encontrado un usuario devuelve sus datos (incluyendo contraseña)
    static async obtenerUsuarioPorEmail(email) {
        const resultado = await pool.query(
            "SELECT * FROM usuario WHERE email = $1",
            [email]
        );

        return resultado.rows[0];
    };


    //Método para obtener los usuarios cuyo rol sea rol_consulta
        //Si el usuario que realiza la consulta es un encargado, devuelve los usuarios que estén asociados a él y cumplan rol_consulta
        //rol e id_usuario corresponden a los datos del usuario que realiza la consulta
    static async obtenerUsuarios(rol, id_usuario, rol_consulta) {

        let query, valores;

        if(rol === "admin"){
            query = "SELECT id, nombre, email, fecha_alta, id_encargado, rol FROM usuario WHERE rol = $1";
            valores = [rol_consulta];
        }
        else if(rol==="encargado"){
            query = "SELECT id, nombre, email, fecha_alta, id_encargado, rol FROM usuario WHERE rol = $1 AND id_encargado = $2";
            valores = [rol_consulta, id_usuario];
        }

        const resultado = await pool.query(query, valores);
        
        return resultado.rows;
    }

    //Método para obtener el encargado asociado a un usuario (trabajador)
    static async obtenerEncargadoAsociado(id_trabajador) {

        const resultado = await pool.query(
            "SELECT id_encargado FROM usuario WHERE id = $1",
            [id_trabajador]
        );

        return resultado.rows[0];
    };


    // Método para eliminar un usuario
    static async borrarUsuario(id) {

        const resultado = await pool.query(
            "DELETE FROM usuario WHERE id = $1 RETURNING *",
            [id]
        );

        return resultado.rows[0]; // usuario eliminado
    }

    //Método para comprobar si trabajador id_trabajador tiene como encargado asociado id_encargado
    static async asociacionTrabajadorEncargado(id_trabajador, id_encargado){
        const resultado = await pool.query(
            "SELECT 1 FROM usuario WHERE id=$1 AND id_encargado = $2",
            [id_trabajador, id_encargado]
        );

        return resultado.rows.length>0;
    }

    //Método para comprobar si el usuario id cumple el rol que se indica por parámetro
    static async cumpleRol(id, rol) {

        const resultado = await pool.query(
            "SELECT 1 FROM usuario WHERE id=$1 AND rol=$2",
            [id, rol]
        );

        return resultado.rows.length>0;
    }

    //Método para comprobar si existe un trabajador
    static async existeTrabajador(id) {
        const resultado = await pool.query(
            "SELECT 1 FROM usuario WHERE id = $1 AND rol=$2",
            [id, "trabajador"]
        );

        return resultado.rows[0];
    };

}

module.exports = UsuarioModelo;