
//Importa los modelos con las consultas SQL
const ubicacionModelo = require("../modelos/ubicacion.modelo");
const usuarioModelo = require("../modelos/usuarios.modelo");
const sesionModelo = require("../modelos/sesion_trabajo.modelo");


class UbicacionServicio {

    static #io = null;

    //Inyecta la instacia de Socket.IO en el servicio
    static setSocket = (ioInstancia) => {
        this.#io = ioInstancia;
    };

    //Actualiza la ubicación de un trabajador
    static async actualizarUbicacion({ id_trabajador, lat, lon }) {

        //Comprueba si el trabajador tiene una sesión de trabajo activa
        const sesion = await sesionModelo.obtenerSesionActivaTrabajador(id_trabajador);
        const id_maquina = sesion?.id_maquina ?? null;
        const id_tarea = sesion?.id_tarea ?? null;

        //Obtiene el nombre del trabajador
        const trabajador = await usuarioModelo.obtenerUsuarioPorId(id_trabajador);
        const nombre = trabajador?.nombre ?? null;

        const datos = {id_trabajador, lat, lon, nombre, ult_actualizacion: Date.now(), id_maquina, id_tarea};

        // Guarda en la base de datos
        await ubicacionModelo.upsertUbicacion({ id_trabajador, lat, lon });

        // Obtiene el encargado
        const resultado = await usuarioModelo.obtenerEncargadoAsociado(id_trabajador);
        const id_encargado = resultado?.id_encargado || resultado?.rows?.[0]?.id_encargado;

        // Emite la ubicación al encargado por socket
        if (this.#io && id_encargado) {

            console.log("--> UBICACIÓN RECIBIDA DEL TRABAJADOR:", datos, "HORA: ", new Date().toLocaleString());            
            this.#io.to(`encargado_${id_encargado}`).emit("ubicaciones:actualizacion", datos);
        }

        return datos;
    };

    //Obtiene las ubicaciones de todos los trabajadores visibles para un encargado
    static async obtenerUbicacionesPorEncargado(id_encargado) {
        const result = await ubicacionModelo.obtenerUbicacionesPorEncargado(id_encargado);
        return result.rows;
    };
}

module.exports = UbicacionServicio;