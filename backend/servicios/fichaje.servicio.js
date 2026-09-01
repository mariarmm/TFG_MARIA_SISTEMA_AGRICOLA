const FichajeModelo = require("../modelos/fichaje.modelo");
const UsuarioModelo = require("../modelos/usuarios.modelo");

class FichajeServicio {

    static #io = null;

    // Inyecta la instancia de Socket.IO
    static setSocket = (ioInstancia) => {
        this.#io = ioInstancia;
    };

    static async finalizarFichaje(id_trabajador) {

        // Finaliza el fichaje en la BD
        const fichajeFinalizado = await FichajeModelo.terminarFichaje(id_trabajador);

        // Obtiene el encargado del trabajador
        const encargado = await UsuarioModelo.obtenerEncargadoAsociado(id_trabajador);

        const id_encargado =
            encargado?.id_encargado ||
            encargado?.rows?.[0]?.id_encargado;

        // Notifica al encargado para quitar el marcador
        if (this.#io && id_encargado) {
            this.#io
                .to(`encargado_${id_encargado}`)
                .emit("trabajador:desconectado", {
                    id_trabajador
                });
        }

        return fichajeFinalizado;
    }
}

module.exports = FichajeServicio;