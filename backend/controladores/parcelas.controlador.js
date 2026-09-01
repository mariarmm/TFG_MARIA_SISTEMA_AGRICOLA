
const ParcelasModelo = require('../modelos/parcelas.modelo');
const UsuarioModelo = require("../modelos/usuarios.modelo");


class ParcelasControlador {

    //Controlador para registrar una parcela
    static async registrarParcela(req, res) {
    
        const usuario = req.usuario;
        let {nombre, hectareas, id_encargado, vertices} = req.body;

        if(!nombre || !vertices || vertices.length < 3){
            return res.status(400).json({error: "Datos insuficientes"});
        }

        if(usuario.rol==="admin" && !id_encargado){
            return res.status(400).json({error: "Falta indicar el id del encargado"});
        }
        if(usuario.rol==="encargado"){
            id_encargado = usuario.id;
        }

        if(hectareas && hectareas<0){
            return res.status(400).json({ error: "El número de hectareas debe ser un valor positivo."});
        }

        try{

            //Comprueba que el id_encargado corresponda a un encargado
            const esEncargado = await UsuarioModelo.cumpleRol(id_encargado, "encargado");
            if(!esEncargado){
                return res.status(404).json({error: "No se ha encontrado un encargado con ese id."});
            }

            //Crea la parcela
            const nuevaParcela = await ParcelasModelo.crearParcela(nombre, hectareas, id_encargado, vertices);

            res.status(201).json(nuevaParcela);
        } catch (error) {
            console.error("Error al registrar parcela:", error);
            res.status(500).json({ error: "Error en el servidor" });
        }
    };

    //Controlador para modificar una parcela
    static async modificarParcela(req, res) {
        
        const usuario = req.usuario;
        const id_parcela = req.params.id;

        //Los nuevos valores
        let{nombre, hectareas, vertices, id_encargado} = req.body;

        if(!id_parcela || (!nombre && !hectareas && !vertices && !id_encargado)){
            return res.status(400).json({error: "Faltan datos."});
        }

        //Si no se introduce la nueva ubicación completa, da error
        if(vertices && vertices.length < 3){
            return res.status(400).json({error: "Número de vértices insuficiente."});
        }

        try{

            //Comprueba si existe una parcela con ese id
            const existe = await ParcelasModelo.existeParcela(id_parcela);
            if(!existe){
                return res.status(404).json({error: "La parcela no se ha encontrado."});
            }

            //Si quien modifica la parcela tiene rol encargado
            if(usuario.rol==="encargado"){

                //Comprueba que la parcela esté asociada a él
                if(usuario.id != existe.id_encargado){
                    return res.status(403).json({error: "No tiene permiso para modificar esta parcela."});
                }

                //El encargado no puede cambiarle el id_encargado de la parcela
                id_encargado = null;
            }
            //Si el admin quiere cambiar id_encargado
            else if(usuario.rol === "admin" && id_encargado){ 

                //Comprueba que exista un encargado con ese id
                const existeEncargado = await UsuarioModelo.cumpleRol(id_encargado, "encargado");

                if(!existeEncargado){
                    return res.status(404).json({error: "No se ha encontrado ningún encargado con ese id."});
                }
            }       

            let parcelaActualizada = await ParcelasModelo.actualizarParcela(id_parcela, nombre, hectareas, vertices, id_encargado);

            if(!parcelaActualizada){
                return res.status(404).json({error: "La parcela no se ha actualizado."});
            }

            res.status(200).json(parcelaActualizada);
        }
        catch (err){

            //Mensaje de error
            console.error("Error en el proceso de actualizar la parcela: ", err.message);
            res.status(500).json({error: "Error al actualizar la parcela"});
        }

    }

    //Controlador para eliminar una parcela
    static async eliminarParcela(req, res) {

        // Id de la parcela que se quiere borrar
        let id = Number(req.params.id);

        const usuario = req.usuario;

        // Si no hay id, error
        if (!id) {
            return res.status(400).json({ error: "Falta id de la parcela a eliminar" });
        }

        // El encargado solo puede borrar parcelas que asociadas a él
        if(usuario.rol==="encargado"){

            const parcela = await ParcelasModelo.obtenerParcelaPorIdYEncargado(id, usuario.id);

            if(!parcela){
                return res.status(403).json({error: "No tienes permiso para eliminar esta parcela o no existe"});
            }
        }

        try{

            const parcelaEliminada = await ParcelasModelo.borrarParcela(id);

            //Si no se ha encontrado una parcela con ese id, se informa
            if(!parcelaEliminada){
                return res.status(404).json({ error: "Parcela no encontrada" });
            }

            //Mensaje de éxito
            res.status(200).json({
                message: "Parcela eliminada correctamente",
                parcela: parcelaEliminada
            });

        } catch (err) {

            // Mensaje de error
            console.error("Error en el proceso de eliminar un parcela:", err.message);
            res.status(500).send("Error en el servidor");
        }
    };

    //Controlador para listar todas las parcelas asociadas a un encargado o todas las parcelas si es admin
    static async listarParcelas(req, res) {

        const { id, rol } = req.usuario;
        let parcelas;

        try{

            if(rol=="encargado"){
                parcelas = await ParcelasModelo.obtenerParcelas(id);
            }
            else if(rol=="admin"){
                parcelas = await ParcelasModelo.obtenerParcelas();
            }
            res.status(200).json(parcelas);
        } catch (error) {
            
            console.error("Error al listar parcelas:", error);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

}

module.exports = ParcelasControlador;
