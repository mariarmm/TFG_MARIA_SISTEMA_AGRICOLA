
//Importa el modelo de sesión de trabajo
const SesionTrabajoModelo = require('../modelos/sesion_trabajo.modelo');

// Obtiene la sesión activa del trabajador que la solicita
const obtenerSesionActiva = async (req, res) => {

    try {
        const sesion = await SesionTrabajoModelo.obtenerSesionActivaTrabajador(req.usuario.id);

        if (!sesion) {
            return res.status(404).json({
                error: "No existe una sesión activa."
            });
        }

        res.status(200).json(sesion);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Error al obtener la sesión activa"
        });
    }
};

//Inicia una nueva sesión de trabajo para un trabajador
const iniciarSesionTrabajo = async (req, res) => {

    const { rol, id } = req.usuario;
    const {id_maquina, id_tarea } = req.body;

    if (!id_tarea) {
        return res.status(400).json({ error: "Faltan datos" });
    }

    // Solo trabajadores
    if (rol !== "trabajador") {
        return res.status(403).json({
            error: "Solo los trabajadores pueden iniciar una sesión de trabajo"
        });
    }

    try {

        //Comprueba si el trabajador ya tiene una sesión activa
        const sesion = await SesionTrabajoModelo.obtenerSesionActivaTrabajador(req.usuario.id);
        if (sesion) {
            return res.status(404).json({
                error: "El trabajador ya tiene una sesión activa."
            });
        }

        //Crea una nueva sesión de trabajo
        const nuevaSesion = await SesionTrabajoModelo.crearSesionTrabajo(id, id_maquina, id_tarea);
        res.status(201).json(nuevaSesion);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al iniciar la sesión de trabajo" });
    }
}

module.exports = {obtenerSesionActiva, iniciarSesionTrabajo};