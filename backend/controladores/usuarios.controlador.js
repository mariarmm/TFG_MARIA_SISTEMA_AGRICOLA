const crypto = require("crypto");

const UsuarioModelo = require("../modelos/usuarios.modelo");
const ServicioCorreo = require("../servicios/correo.servicio");

class UsuariosControlador {

    //Genera un código provisional
    static #generarToken() {

        const token = crypto.randomBytes(32).toString("hex");

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        return {token,tokenHash};
    }; 


    /**
     * Controlador para registrar un nuevo usuario en el sistema.
     * @param {Object} req - Objeto de petición de Express (contiene el body con los datos).
     * @param {Object} res - Objeto de respuesta de Express.
     */
    static async registrarUsuario(req, res) {

        // Desestructuración de los datos recibidos en el cuerpo de la petición (JSON)
        let { nombre, email, rol, id_encargado } = req.body;

        const usuario = req.usuario;

        // Verifica que los datos no esten vacios
        if (!nombre || !email || !rol) {
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        }

        // Comprueba que el email tenga un formato correcto
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Email no válido" });
        }

        // Comprueba si un encargado intenta crear un usuario que no sea trabajador o un trabajador para un encargado distinto
        if(usuario.rol==="encargado"){

            if(rol!="trabajador"){
                return res.status(403).json({error: "No tienes permiso para realizar esta acción."});
            }

            if(id_encargado!=usuario.id){
                return res.status(403).json({error: "No tienes permiso para crear trabajadores para otros encargados."});
            }
        }
    

        try {

            //Si se introduce el id_encargado
            if(id_encargado){
                
                // Comprueba si el id_encargado corresponde a un usuario con rol de encargado
                const esEncargado = await UsuarioModelo.cumpleRol(id_encargado, "encargado");

                if(!esEncargado){
                    return res.status(400).json({ error: "El encargado asociado no tiene rol de encargado" });
                }
            }


            // Comprueba si ya existe un usuario con ese correo
            const usuarioExiste = await UsuarioModelo.obtenerUsuarioPorEmail(email);

            if (usuarioExiste) {
                return res.status(400).json({ error: "El usuario ya existe" });
            }


            //Si pasa todas las comprobaciones, crea el usuario:

            const { token, tokenHash } = UsuariosControlador.#generarToken();

            //Inserta en la BD
            const nuevoUsuario = await UsuarioModelo.crearUsuario(nombre, email, rol, id_encargado, tokenHash);

            // Enviar email
            const url = `${process.env.FRONTEND_URL}/autenticacion/activar-cuenta/${token}`;
            await ServicioCorreo.enviarCorreoActivacion(email, url);

            // Respuesta exitosa, devuelve el usuario
            res.status(201).json(nuevoUsuario);

        } catch (err) {

            // Mensaje de error
            console.error("Error en el proceso de crear un usuario:", err.message);
            res.status(500).json({error: "Error en el servidor"});
        }
    };


    //Controlador para modificar usuario
    static async modificarUsuario(req, res) {

        const id_usuario_modificar = req.params.id;
        const usuario = req.usuario;

        //Los nuevos valores
        const{nombre, email, rol, id_encargado} = req.body;

        //Si no se indica el usuario a modificar o no hay ningún campo para modificar
        if(!id_usuario_modificar || (!nombre && !email && !rol && !id_encargado)){
            return res.status(400).json({error: "Faltan datos"});
        }


        try {

            //Primero se comprueba que exista el usuario
            if (id_usuario_modificar){

                const hayUsuario = await UsuarioModelo.obtenerUsuarioPorId(id_usuario_modificar);

                if(!hayUsuario){
                    return res.status(404).json({ error: "No se ha encontrado el usuario."});
                }
            }
            else{
                //Falta indicar el id del usuario
                return res.status(400).json({error: "Falta indicar el id del usuario"});
            }


            //Si se quiere modificar el id del encargado, se comprueba que exista un encargado con ese id
            if(id_encargado !== undefined && id_encargado !== null){
                const existeEncargado = await UsuarioModelo.cumpleRol(id_encargado, "encargado");
                if(!existeEncargado){
                    return res.status(404).json({ error: "No se ha encontrado ningun encargado con el nuevo id."});
                }
            }
            

            //Si se quiere modificar el email
            if(email){

                // Comprueba que ese email no esté ya registrado
                const existeEmail = await UsuarioModelo.obtenerUsuarioPorEmail(email);
                if(existeEmail && existeEmail.id != id_usuario_modificar){
                    return res.status(404).json({ error: "Ya existe un usuario con ese email."});
                }

                // Comprueba que el email tenga un formato correcto
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return res.status(400).json({ message: "Email no válido" });
                }
            }

            if(rol){
                //Comprueba que rol sea válido
                const rolValidos = ["trabajador", "admin", "encargado"];
                if (!rolValidos.includes(rol)) {
                    return res.status(400).json({ error: "Rol no válido" });
                }
            }


            //Si quien realiza la modificación es el encargado
            if(usuario.rol === "encargado"){

                //Si quiere modificar un usuario que no sea él mismo
                if(usuario.id != id_usuario_modificar){

                    // Solo puede modificar a sus trabajadores
                    const esValido = await UsuarioModelo.asociacionTrabajadorEncargado(id_usuario_modificar, usuario.id);
                    if (!esValido) {
                        return res.status(403).json({ error: "No tienes permiso para modificar este usuario."});
                    }
                }

                //El encargado no puede asignar un rol diferente a trabajador
                if(rol && rol!="trabajador"){
                    return res.status(403).json({ error: "No tienes permiso para crear este usuario."});
                }
            } 

            let usuarioActualizado = await UsuarioModelo.actualizarUsuario(id_usuario_modificar, nombre, email, rol, id_encargado);
            
            if(!usuarioActualizado){
                return res.status(404).json({error: "El usuario no se ha actualizado."});
            }

            res.status(200).json(usuarioActualizado);
        }
        catch (err){

            //Mensaje de error
            console.error("Error en el proceso de actualizar el usuario: ", err.message);
            res.status(500).json({error: "Error al actualizar el usuario"});
        }
    }


    /**
     * Controlador para eliminar un usuario del sistema.
     * @param {Object} req - Objeto de petición de Express (contiene el body con los datos).
     * @param {Object} res - Objeto de respuesta de Express.
     */
    static async eliminarUsuario(req, res) {

        // Id del usuario que se quiere borrar
        let id = Number(req.params.id);

        const usuario = req.usuario;


        // Si no hay id, error
        if (!id) {
            return res.status(400).json({ error: "Falta id del usuario a eliminar" });
        }

        //Un usuario no se puede borrar a si mismo
        if(usuario.id === id){
            return res.status(403).json({error: "No tienes permiso para eliminar a este usuario"});
        }

        // El encargado solo puede borrar trabajadores asociados a él
        if(usuario.rol==="encargado"){

            const esTrabajador = await UsuarioModelo.cumpleRol(id, "trabajador");
            const esValido = await UsuarioModelo.asociacionTrabajadorEncargado(id, usuario.id);

            if(!esTrabajador || !esValido){
                return res.status(403).json({error: "No tienes permiso para eliminar a este usuario"});
            }
        }

        try{

            const usuarioEliminado = await UsuarioModelo.borrarUsuario(id);

            //Si no se ha encontrado un usuario con ese id, se informa
            if(!usuarioEliminado){
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            //Mensaje de éxito
            res.status(200).json({
                message: "Usuario eliminado correctamente",
                usuario: usuarioEliminado
            });

        } catch (err) {

            // Mensaje de error
            console.error("Error en el proceso de eliminar un usuario:", err.message);
            res.status(500).json({error: "Error en el servidor"});
        }
    };


    /**
     * Controlador para listar todos los usuarios con un rol determinado registrados.
     * @param {Object} req - Objeto de petición de Express (contiene el body con los datos).
     * @param {Object} res - Objeto de respuesta de Express.
     */
    static async listarUsuarios(req, res) {

        const {id, rol} = req.usuario;
        const rol_consulta = req.query.rol;

        if(!rol_consulta){
            return res.status(400).json({ error: "Falta indicar el rol" });
        }

        try{
            const usuariosRol = await UsuarioModelo.obtenerUsuarios(rol, id, rol_consulta);

            res.status(200).json(usuariosRol);

        } catch (err) {
            console.error("Error obteniendo los usuarios:", err.message);
            res.status(500).json({error: "Error en el servidor"});
        }

    }

}

module.exports = UsuariosControlador;