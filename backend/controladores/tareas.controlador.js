const TareasModelo = require('../modelos/tareas.modelo');
const UsuarioModelo = require("../modelos/usuarios.modelo");
const ParcelasModelo = require("../modelos/parcelas.modelo");
const MaquinasModelo = require("../modelos/maquinas.modelo");
const UbicacionModelo = require("../modelos/ubicacion.modelo");


const NotificacionesServicio = require("../servicios/notificaciones.servicio");
const SesionTrabajoServicio = require("../servicios/sesion_trabajo.servicio");
const UbicacionServicio = require("../servicios/ubicacion.servicio");


class TareasControlador {

    static async #validarDatosNuevaTarea({nombre, id_trabajador, fecha_planificada, rol, id_parcela, id_maquina, id}) {

        // Verifica que los datos obligatorios no esten vacios
        if(!nombre || !id_trabajador || !fecha_planificada){
            // return res.status(400).json({error: "Faltan campos obligatorios"});
            return { valido: false, status: 400, mensaje: "Faltan campos obligatorios" };
        }


        //Comprueba si el id_trabajador corresponde con un usuario con rol trabajador
        const esTrabajador = await UsuarioModelo.cumpleRol(id_trabajador, "trabajador");
        if(!esTrabajador){
            return { valido: false, status: 403, mensaje: "No puedes asignarle tareas a este usuario" };
            // return res.status(403).json({ error: "No puedes asignarle tareas a este usuario"});
        }

        //Si el usuario que crea la tarea es un encargado
        if(rol === "encargado"){

            // Comprueba si el id del trabajador al que le asocia la tarea está asociado al suyo
            const esValido = await UsuarioModelo.asociacionTrabajadorEncargado(id_trabajador, id);

            //Si no está asociado, el encargado no puede crear tareas para ese trabajador
            if (!esValido) {
                return { valido: false, status: 403, mensaje: "No tienes permiso para añadir tareas a este trabajador" };
                // return res.status(403).json({ error: "No tienes permiso para añadir tareas a este trabajador"});
            }
        }

        if(id_parcela){

            //Comprueba que exista la parcela que se indica
            const existe = await ParcelasModelo.existeParcela(id_parcela);
            if (!existe) {
                return { valido: false, status: 404, mensaje: "No se ha encontrado la parcela" };
            }
        }

        if(id_maquina){

            //Comprueba que exista la maquina que se indica
            const existeMaquina = await MaquinasModelo.obtenerMaquinaPorId(id_maquina);
            if (!existeMaquina) {
                return { valido: false, status: 404, mensaje: "No se ha encontrado la máquina" };
            }
        }

        return { valido: true };
    }

    /**
     * Controlador para crear una nueva tarea en el sistema.
     * @param {Object} req - Objeto de petición de Express (contiene el body con los datos).
     * @param {Object} res - Objeto de respuesta de Express.
     */
    static async registrarTarea(req, res) {
        const {rol, id} = req.usuario;

        // Desestructuración de los datos recibidos en el cuerpo de la petición (JSON)
        const {nombre, fecha_ini, fecha_fin, id_trabajador, id_parcela, id_maquina, descripcion, fecha_planificada} = req.body;

        //Las tareas se crean con estado pendiente
        const estado = "pendiente";

        try{

            const validacion = await TareasControlador.#validarDatosNuevaTarea({nombre, id_trabajador, fecha_planificada, rol, id_parcela, id_maquina, id});
            if(!validacion.valido){
                return res.status(validacion.status).json({error: validacion.mensaje});
            }

            //Inserta en la BD
            const nuevaTarea = await TareasModelo.crearTarea(nombre, fecha_ini, fecha_fin, id_trabajador, TareasControlador.#aNuloONumero(id_parcela), TareasControlador.#aNuloONumero(id_maquina), descripcion, estado, fecha_planificada);

            //Envia notificación al usuario
            await NotificacionesServicio.enviarNotificacion(id_trabajador, "Se te ha asignado una nueva tarea");

            //Envia evento para que el trabajador actualice sus tareas
            await NotificacionesServicio.enviarActualizarTareas(id_trabajador);

            // Respuesta exitosa, devuelve la nueva tarea
            res.status(201).json(nuevaTarea);

        } catch (err){

            //Mensaje de error
            console.error("Error en el proceso de crear una tarea: ", err.message);
            res.status(500).json({error: err.message});
        }
    };


    static async eliminarTarea(req, res) {

        const {rol, id} = req.usuario;
        const id_tarea = req.params.id;

        //Verifica que los datos necesarios no esten vacíos
        if(!id_tarea){
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        try {

            //Primero se comprueba que la tarea exista
            const tarea = await TareasModelo.obtenerTareaPorId(id_tarea);
            
            if(!tarea){
                return res.status(404).json({ error: "No se ha encontrado la tarea."});
            }

            const id_trabajador = tarea.id_trabajador;

            //Si un encargado quiere eliminar una tarea estado, se comprueba que esa tarea este asociada a uno de sus trabajadores
            if(rol==="encargado"){
                
                const esValido = await UsuarioModelo.asociacionTrabajadorEncargado(id_trabajador, id);
                if (!esValido) {
                    return res.status(403).json({ error: "No tienes permiso para eliminar esta tarea."});
                }
            }

            let tareaEliminada= await TareasModelo.borrarTarea(id_tarea);

            if (!tareaEliminada) {
                return res.status(500).json({error: "No se ha podido eliminar la tarea."});
            }

            //Envia notifiación al trabajador
            await NotificacionesServicio.enviarNotificacion(id_trabajador, "Se ha eliminado una de tus tareas");

            //Envia evento para que el trabajador actualice sus tareas
            await NotificacionesServicio.enviarActualizarTareas(id_trabajador);

            // Respuesta exitosa, devuelve la tarea
            res.status(200).json(tareaEliminada);

        } catch (err){

            //Mensaje de error
            console.error("Error en el proceso de eliminar la tarea: ", err.message);
            res.status(400).json({error: err.message});
        }

    };
    

    static async listarTareas(req, res) {
        const { id, rol } = req.usuario;
        const { fechaDesde, fechaHasta, id_trabajador, estado, id_parcela, id_maquina} = req.query;

        let filtros = {};

        // Lógica de Rol
        // Si es un trabajador, solo puede ver sus propias tareas
        if (rol === "trabajador") {

            filtros.id_trabajador = id;

            if (estado){
                filtros.estado = estado;

                //Solo se muestran las tareas completadas que se hayan finalizado hoy
                if(estado === "completada"){
                    filtros.fecha_fin = new Date().toLocaleDateString("en-CA");
                }
            }
        } 
        //Encargado y administrador
        else if (rol === "encargado" || rol === "admin") {

            //Si es encargado, indica su id para que solo se muestren tareas de los trabajadores bajo su cargo
            if(rol==="encargado"){
                filtros.id_encargado = id;
            }
            
            //FILTROS: ID trabajador, estado, ID parcela, fecha

            if (id_trabajador){
                filtros.id_trabajador = id_trabajador;
            } 
            if(estado){
                filtros.estado = estado;
            }
            if(id_parcela){
                filtros.id_parcela = id_parcela;
            }
            if(id_maquina){
                filtros.id_maquina = id_maquina;
            }

            if(estado==="completada"){

                filtros.fecha_fin_desde = fechaDesde;
                filtros.fecha_fin_hasta = fechaHasta;
            }
            else if(estado!="pendiente"){
                filtros.fecha_planificada_desde = fechaDesde;
                filtros.fecha_planificada_hasta = fechaHasta;
            }
        } 
    
        console.log("FILTROS: " , filtros);

        try {
            const tareas = await TareasModelo.obtenerTareasGeneral(filtros);
            res.json(tareas);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error al obtener tareas");
        }
    };

    //Método auxiliar privado para validar los datos de la petición de cambio de estado de una tarea
    static async #validarDatosCambioEstado(id_tarea, estado, usuario) {

        //Verifica los campos obligatorios
        if(!id_tarea || !estado){
            return { valido: false, status: 400, mensaje: "Faltan datos obligatorios" };
        }

        //Comprueba que estado sea válido
        const estadosValidos = ["pendiente", "en_proceso", "completada"];
        if (!estadosValidos.includes(estado)) {
            return { valido: false, status: 400, mensaje: "Estado no válido" };
        }

        //Comprueba que la tarea exista
        const tarea = await TareasModelo.obtenerTareaPorId(id_tarea);
        if(!tarea){
            return { valido: false, status: 404, mensaje: "No se ha encontrado la tarea" };
        }

        //Control de permisos por rol
        const id_trabajador = tarea.id_trabajador;

        //Si un encargado quiere modificar el estado, se comprueba que la tarea este asociada a uno de sus trabajadores
        if(usuario.rol==="encargado"){

            const esValido = await UsuarioModelo.asociacionTrabajadorEncargado(id_trabajador, usuario.id);
            if (!esValido) {
                return { valido: false, status: 403, mensaje: "No tienes permiso para modificar esta tarea." };
            }
        }
        //Si un trabajador quiere cambiar el estado de una tarea que no es suya, error.
        else if(usuario.rol==="trabajador" && usuario.id!==id_trabajador){
            return { valido: false, status: 403, mensaje: "No tienes permiso para modificar esta tarea." };
        }

        // Devuelve la tarea obtenida
        return { valido: true, tarea };
    }

    static async #procesarEfectosCambioEstado(tarea, estado) {

        const id_trabajador = tarea.id_trabajador;
        const id_encargado = tarea.id_encargado;
        const id_maquina = tarea.id_maquina;
        const id_tarea = tarea.id;

        //Si comienza la tarea, crea la sesión de trabajo
        if(estado==="en_proceso"){
            await SesionTrabajoServicio.registrarSesionTrabajo({id_trabajador, id_maquina, id_tarea});

            // Fuerza una actualización del mapa con la nueva sesión
            try {
                const ubicacionActual = await UbicacionModelo.obtenerUltimaUbicacion(id_trabajador);

                if (ubicacionActual) {
                    await UbicacionServicio.actualizarUbicacion({id_trabajador, lat: ubicacionActual.lat, lon: ubicacionActual.lon});
                }
            } catch (err) {
                console.error("Error actualizando ubicación tras cambio de estado:", err.message);
                // No es un error crítico, no interrumpe el flujo
            }
        }
        //Si termina la tarea, finaliza la sesión de trabajo
        else if(estado==="completada"){
            await SesionTrabajoServicio.finalizarSesionTrabajo({id_trabajador, id_tarea});
        }

    }

    /**
     * Controlador para actualizar el estado de una tarea.
     * @param {Object} req - Objeto de petición de Express (contiene el body con los datos).
     * @param {Object} res - Objeto de respuesta de Express.
     */
    static async actualizaEstado(req, res) {

        const id_tarea = req.params.id;
        const {estado}=req.body;
        const usuario = req.usuario;

        try{

            //Valida los parámetros, la existencia de la tarea y los permisos del usuario
            const validacion = await TareasControlador.#validarDatosCambioEstado(id_tarea, estado, usuario);
            if(!validacion.valido){
                return res.status(validacion.status).json({error: validacion.mensaje});
            }

            const tarea = validacion.tarea;
            const id_trabajador = tarea.id_trabajador;
            const id_encargado = tarea.id_encargado;

            //Gestiona la sesión de trabajo y la ubicación según el nuevo estado
            await TareasControlador.#procesarEfectosCambioEstado(tarea, estado);

            //Actualiza el estado de la tarea en la BD
            let tareaActualizada = await TareasModelo.cambiarEstado(id_tarea, estado);

            if(!tareaActualizada){
                return res.status(403).json({error: "No tienes permiso para modificar esta tarea o no existe"});
            }

            //Envia evento para que se actualice la lista de tareas del encargado
            await NotificacionesServicio.enviarActualizarTareas(id_encargado);

            // Respuesta exitosa, devuelve la tarea
            res.status(200).json(tareaActualizada);

        } catch (err){

            //Mensaje de error
            console.error("Error en el proceso de actualizar el estado de la tarea: ", err.message);
            res.status(400).json({error: err.message});
            // res.status(500).send("Error en el servidor");
        }
    };

    //Controlador para evitar mandar un número como cadena vacia
    static #aNuloONumero(n) {
        return n === "" || n === undefined ? null : Number(n);
    }

    //Controlador para modificar los datos de una tarea existente
    static async modificarTarea(req, res) {

        const id_tarea = req.params.id;
        const usuario = req.usuario;

        //Los nuevos valores
        const{nombre, id_trabajador, id_parcela, id_maquina, descripcion, fecha_planificada} = req.body;

        try {

            let tarea;

            //Primero se comprueba que exista la tarea
            if(id_tarea){
                tarea = await TareasModelo.obtenerTareaPorId(id_tarea);

                if(!tarea){
                    return res.status(404).json({ error: "No se ha encontrado la tarea."});
                }
            }
            else{
                //Falta indicar el id de la tarea
                return res.status(400).json({ error: "Faltan indicar el id de la tarea." });
            }
            

            //Si se quiere modificar el id del trabajador, se comprueba que exista un trabajador con ese id
            if(id_trabajador){
                const existe = await UsuarioModelo.existeTrabajador(id_trabajador);
                if(!existe){
                    return res.status(404).json({ error: "No se ha encontrado ningun trabajador con el nuevo id."});
                }
            }

            //Si quien quiere realizar la modificación es el encargado
            if(usuario.rol === "encargado"){

                //Se comprueba que la tarea esté asociada a alguno de sus trabajadores            
                const esValido = await UsuarioModelo.asociacionTrabajadorEncargado(tarea.id_trabajador, usuario.id);
                if (!esValido) {
                    return res.status(403).json({ error: "No tienes permiso para modificar esta tarea."});
                }

                //Si se quiere actualizar el trabajador que realiza la tarea, se comprueba que 
                //el nuevo trabajador esté asociado al encargado
                if(id_trabajador){
                    const asociados = await UsuarioModelo.asociacionTrabajadorEncargado(id_trabajador, usuario.id);
                    if (!asociados) {
                        return res.status(403).json({ error: "No tienes permiso para asignar tareas a ese trabajador."});
                    }
                }
            }

            if(id_maquina){
                //Comprueba que exista la maquina que se indica
                const existeMaquina = await MaquinasModelo.obtenerMaquinaPorId(id_maquina);
                if (!existeMaquina) {
                    return res.status(404).json({ error: "No se ha encontrado la máquina"});
                }
            }


            const tareaActualizada = await TareasModelo.actualizarTarea(id_tarea, nombre, TareasControlador.#aNuloONumero(id_trabajador), TareasControlador.#aNuloONumero(id_parcela), TareasControlador.#aNuloONumero(id_maquina), descripcion, fecha_planificada);
            if(!tareaActualizada){
                return res.status(404).json({error: "La tarea no se ha actualizado."});
            }

            const trabajadorFinal = id_trabajador ?? tarea.id_trabajador;

            //Envia una notificación al usuario
            await NotificacionesServicio.enviarNotificacion(trabajadorFinal, "Tu tarea ha sido modificada");

            //Envia evento para que el trabajador actualice sus tareas
            await NotificacionesServicio.enviarActualizarTareas(trabajadorFinal);

            res.status(200).json(tareaActualizada);

        }catch (err){

            //Mensaje de error
            console.error("Error en el proceso de actualizar la tarea: ", err.message);
            res.status(500).send("Error al actualizar la tarea");
        }
        
    }
}

module.exports = TareasControlador;