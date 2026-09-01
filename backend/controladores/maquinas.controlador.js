const UsuarioModelo = require("../modelos/usuarios.modelo");
const MaquinasModelo = require("../modelos/maquinas.modelo");


class MaquinasControlador {
    
    //Controlador para registrar una nueva maquina en el sistema
    static async registrarMaquina(req, res) {

        // Desestructuración de los datos recibidos en el cuerpo de la petición (JSON)
        let { nombre, descripcion, id_encargado } = req.body;

        const usuario = req.usuario;

        // Verifica que los datos no esten vacios
        if (!nombre) {
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        }

        try {

            // Comprueba si un encargado 
            if(usuario.rol==="encargado"){
                id_encargado = usuario.id;
            }
            else if(usuario.rol==="admin"){

                //Si falta el id_encargado muestra mensaje de error
                if(!id_encargado){
                    return res.status(400).json({ error: "Falta indicar el id del encargado asociado." });
                }

                //Comprueba si el id_encargado corresponde realmente a un encargado
                const esValido = await UsuarioModelo.cumpleRol(id_encargado, "encargado");
                if(!esValido){
                    return res.status(404).json({ error: "No se ha encontrado ningún encargado con ese id." });
                }
            }


            //Inserta en la BD
            const nuevaMaquina = await MaquinasModelo.crearMaquina(nombre, descripcion, id_encargado);

            // Respuesta exitosa, devuelve el usuario
            res.status(201).json(nuevaMaquina);

        } catch (err) {

            // Mensaje de error
            console.error("Error en el proceso de crear una maquina:", err.message);
            res.status(500).json({error: "Error en el servidor"});
        }
    };

    //Controlador para eliminar una máquina del sistema.
    static async eliminarMaquina(req, res) {

        // Id de la maquina que se quiere borrar
        let id = Number(req.params.id);

        const usuario = req.usuario;

        // Si no hay id, error
        if (!id) {
            return res.status(400).json({ error: "Falta id de la maquina a eliminar" });
        }

        try{

            //Primero comprueba si existe esa maquina
            const maquina = await MaquinasModelo.obtenerMaquinaPorId(id);
            if(!maquina){
                return res.status(404).json({ error: "No se ha encontrado ninguna maquina con ese id." });
            }

            // El encargado solo puede borrar trabajadores asociados a él
            if(usuario.rol==="encargado" && maquina.id_encargado != usuario.id){
                return res.status(403).json({error: "No tienes permiso para eliminar esta maquina"});
            }

            const maquinaEliminada = await MaquinasModelo.borrarMaquina(id);

            //Si no se ha encontrado una maquina con ese id, se informa
            if(!maquinaEliminada){
                return res.status(404).json({ error: "Maquina no encontrada" });
            }

            //Mensaje de éxito
            res.status(200).json({
                message: "Maquina eliminada correctamente",
                maquina: maquinaEliminada
            });

        } catch (err) {

            // Mensaje de error
            console.error("Error en el proceso de eliminar una maquina:", err.message);
            res.status(500).json({error: "Error en el servidor"});
        }
    };

    //Controlador para listar todas las maquinas asociadas a un encargado o todas las maquinas si es admin
    static async listarMaquinas(req, res) {

        const {id, rol} = req.usuario;
        let {id_encargado} = req.query;

        let filtros = {};

        if(rol==="encargado"){
            id_encargado = id;
        }

        if(id_encargado){
            filtros.id_encargado = id_encargado;
        }

        try {
            const maquinas = await MaquinasModelo.obtenerMaquinas({id_encargado});
            res.json(maquinas);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error al obtener maquinas");
        }
    };

    //Controlador para modificar los datos de una maquina
    static async modificarMaquina(req, res) {

        const id_maquina = req.params.id;
        const usuario = req.usuario;

        //Los nuevos valores
        let {nombre, descripcion, id_encargado} = req.body;

        try{

            //Primero se comprueba que exista la maquina
            if(id_maquina){
                const hayMaquina = await MaquinasModelo.obtenerMaquinaPorId(id_maquina);

                if(!hayMaquina){
                    return res.status(404).json({ error: "No se ha encontrado la máquina."});
                }
            }
            else{
                //Falta indicar el id de la máquina
                return res.status(400).json({ error: "Faltan indicar el id de la máquina." });
            }


            //Si es el encargado, no puede cambiar el id encargado asociado a la máquina
            if(usuario.rol=="encargado"){
                id_encargado = null;
            }
            else if(usuario.rol=="admin" && id_encargado){

                //Si se quiere modificar el id del encargado, se comprueba que exista un encargado con ese id
                const existe = await UsuarioModelo.cumpleRol(id_encargado, "encargado");

                if(!existe){
                    return res.status(404).json({ error: "No se ha encontrado ningun encargado con el nuevo id."});
                }
            }

            const maquinaActualizada = await MaquinasModelo.actualizarMaquina(id_maquina, nombre, descripcion, id_encargado);

            if(!maquinaActualizada){
                return res.status(404).json({error: "La máquina no se ha actualizado."});
            }

            res.status(200).json(maquinaActualizada);
        }
        catch (err){

            //Mensaje de error
            console.error("Error en el proceso de actualizar la máquina: ", err.message);
            res.status(500).send("Error al actualizar la máquina");
        }
    }
}

module.exports = MaquinasControlador;
