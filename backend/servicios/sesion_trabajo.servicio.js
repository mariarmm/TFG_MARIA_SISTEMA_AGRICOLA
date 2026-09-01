
const SesionTrabajoModelo = require('../modelos/sesion_trabajo.modelo');

class SesionTrabajoServicio {

    //Método para registrar una nueva sesión de trabajo para un trabajador, una máquina y una tarea concretos
    static async registrarSesionTrabajo({ id_trabajador, id_maquina, id_tarea }) {

        //Comprueba si el trabajador tiene otra sesión activa (está realizando otra tarea)
        const trabajadorOcupado = await SesionTrabajoModelo.trabajadorActivo(id_trabajador);
        if(trabajadorOcupado){
            throw new Error("Este trabajador tiene otra tarea iniciada.");
        }

        //Si la tarea requiere maquinaria, se comprueba que dicha maquina este libre
        if(id_maquina){

            const ocupada = await SesionTrabajoModelo.maquinaActiva(id_maquina);
            if(ocupada){
                throw new Error("La máquina no está disponible.");
            }
        }

        //Registra la sesión
        return await SesionTrabajoModelo.crearSesionTrabajo(id_trabajador, id_maquina, id_tarea);
    };

    //Método para finalizar una sesión de trabajo existente
    static async finalizarSesionTrabajo({ id_trabajador, id_tarea }) {

        if (!id_trabajador || !id_tarea) {
            throw new Error("Faltan datos");
        }

        //Comprueba que exista una sesión activa para el trabajador y la tarea proporcionados
        const sesion = await SesionTrabajoModelo.obtenerSesionTrabajoActiva(id_trabajador, id_tarea);
        if (!sesion){
            throw new Error("La sesión no existe");
        } 

        //Finaliza la sesión
        return await SesionTrabajoModelo.terminarSesionTrabajo(sesion.id);
    }

}

module.exports = SesionTrabajoServicio;