
const FichajeModelo = require("../modelos/fichaje.modelo");
// const UsuarioModelo = require("../modelos/usuarios.modelo");
const SesionTrabajoModelo = require('../modelos/sesion_trabajo.modelo');

const FichajeServicio = require("../servicios/fichaje.servicio");

class FichajeControlador {

    //Controlador para registrar un nuevo fichaje en el sistema
    static async registrarFichaje(req, res) {

        const {rol, id} = req.usuario;
        
        // Verifica que los datos obligatorios no esten vacios
        if(!id){
            return res.status(400).json({error: "Falta el id"});
        }

        //Comprueba si el usuario es un trabajador
        if(rol !== "trabajador"){
            return res.status(403).json({ error: "El sistema de fichaje solo esta disponible para trabajadores"});
        }

        
        try{

            const fichajeHoy = await FichajeModelo.obtenerFichajeHoy(id);

            if (fichajeHoy) {
                if (fichajeHoy.activo) {
                    return res.status(400).json({
                        error: "Ya tienes una jornada activa"
                    });
                }

                return res.status(400).json({
                    error: "Ya has fichado hoy"
                });
            }

            //Inserta en la BD
            const nuevoFichaje= await FichajeModelo.crearFichaje(id);

            // Respuesta exitosa, devuelve la nueva tarea
            res.status(200).json(nuevoFichaje);

        } catch (err){

            //Mensaje de error
            console.error("Error en el proceso de registrar el fichaje: ", err.message);
            res.status(500).send({error:"Error en el servidor"});
        }
    };

    //Controlador para finalizar un fichaje en el sistema
    static async finalizarFichaje(req, res) {

        const {rol, id} = req.usuario;

        // Verifica que los datos obligatorios no esten vacios
        if(!id){
            return res.status(400).json({error: "Falta el id"});
        }

        //Comprueba si el usuario es un trabajador
        if(rol !== "trabajador"){
            return res.status(403).json({ error: "El sistema de fichaje solo esta disponible para trabajadores"});
        }

        try{

            const activo = await FichajeModelo.obtenerFichajeActivo(id);
            if (!activo) {
                return res.status(404).json({ error: "No hay jornada activa" });
            }

            // Finaliza el fichaje y notifica al encargado
            const fichajeFinalizado = await FichajeServicio.finalizarFichaje(id);

            //Finaliza la sesión de trabajo activa del trabajador, si existe
            const sesion = await SesionTrabajoModelo.obtenerSesionActivaTrabajador(id);
            if(sesion){
                await SesionTrabajoModelo.terminarSesionTrabajo(sesion.id);
            }

            // Respuesta exitosa, devuelve la nueva tarea
            res.status(200).json(fichajeFinalizado);

        } catch (err){

            //Mensaje de error
            console.error("Error en el proceso de registrar el fichaje: ", err.message);
            res.status(500).send({error:"Error en el servidor"});
        }
    };

    //Controlador para obtener el fichaje de hoy de un trabajador
    static async obtenerFichaje(req, res) {

        const {rol, id} = req.usuario;
        let {id_trabajador, fecha} = req.query;


        if(rol==="trabajador"){
            //Si es un trabajador, el id_trabajador es el suyo
            id_trabajador = id;
        }
        //En otro caso, comprueba que se introduzca el id del trabajador
        else if(!id_trabajador){
            return res.status(400).json({ error: "Falta indicar el id del trabajador" });
        }

        //Si no se especifica fecha, por defecto es la de hoy
        if(!fecha){
            fecha = new Date().toISOString().split("T")[0];
        }

        //Si es un encargado, solo puede obtener el fichaje de sus trabajadores
        if(rol==="encargado"){

            // Comprueba si el id del trabajador está asociado al suyo
            const esValido = await UsuarioModelo.asociacionTrabajadorEncargado(id_trabajador, id);

            if (!esValido) {
                return res.status(403).json({ error: "No tienes acceso a esta información"});
            }
        }

        try{

            //Obtiene el fichaje de hoy para el trabajador
            const fichaje = await FichajeModelo.obtenerFichajeHoy(id_trabajador);

            // Respuesta exitosa, devuelve la nueva tarea
            res.status(200).json(fichaje);

        } catch (err){

            //Mensaje de error
            console.error("Error en el proceso de registrar el fichaje: ", err.message);
            res.status(500).send({error:"Error en el servidor"});
        }
    };

}

module.exports = FichajeControlador;