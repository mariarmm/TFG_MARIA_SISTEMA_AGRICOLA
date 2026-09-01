const request = require("supertest");
const pool = require("../bd");
const crypto = require("crypto");


const UsuarioModelo = require("../modelos/usuarios.modelo");
const ParcelasModelo = require("../modelos/parcelas.modelo");
const TareasModelo = require("../modelos/tareas.modelo");
const MaquinasModelo = require("../modelos/maquinas.modelo");


require("dotenv").config({
    path: ".env.test"
});

async function eliminarUsuarioSiExiste(email) {

    const usuario = await UsuarioModelo.obtenerUsuarioPorEmail(email);

    if (!usuario) return;

    await pool.query(
        "DELETE FROM sesion_trabajo WHERE id_trabajador = $1",
        [usuario.id]
    );

    await pool.query(
        "DELETE FROM notificaciones WHERE id_usuario = $1",
        [usuario.id]
    );

    try {
        await UsuarioModelo.borrarUsuario(usuario.id);
    } catch (_) {}
}

async function crearUsuario(app, datos) {

    const {
        nombre,
        email,
        rol,
        idEncargado = null,
        token,
        contrasenia = "Password123"
    } = datos;

    await eliminarUsuarioSiExiste(email);

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await UsuarioModelo.crearUsuario(
        nombre,
        email,
        rol,
        idEncargado,
        tokenHash
    );

    const activacion = await request(app)
        .post("/autenticacion/activar-cuenta")
        .send({
            token,
            contrasenia
    });

    if (activacion.statusCode !== 200) {
        console.log(activacion.body);
        throw new Error("No se pudo activar el usuario");
    }

    const login = await request(app)
        .post("/autenticacion/login")
        .send({
            email,
            contrasenia
    });

    if (login.statusCode !== 200) {
        console.log(login.body);
        throw new Error("No se pudo iniciar sesión");
    }

    return {
        id: login.body.usuario.id,
        token: login.body.token,
        email
    };
}

async function crearParcela(idEncargado) {

    return ParcelasModelo.crearParcela(
        "Parcela prueba",
        300,
        idEncargado,
        [
            {
                latitud: 37.1800,
                longitud: -3.6000
            },
            {
                latitud: 37.1810,
                longitud: -3.6005
            },
            {
                latitud: 37.1815,
                longitud: -3.5990
            },
            {
                latitud: 37.1805,
                longitud: -3.5985
            }
        ]
    );
}

async function crearTarea(app, token, datos) {

    const res = await request(app)
        .post("/tareas")
        .set("Authorization", `Bearer ${token}`)
        .send(datos);

    return res.body;
}

async function crearMaquina(nombre, descripcion, idEncargado) {

    return MaquinasModelo.crearMaquina(
        nombre,
        descripcion,
        idEncargado
    );
}


async function limpiarDatos({
    idTrabajador,
    idEncargado,
    idTarea,
    idParcela,
    idMaquina
}) {

    if (idTrabajador) {
        await pool.query(
            "DELETE FROM sesion_trabajo WHERE id_trabajador=$1",
            [idTrabajador]
        );

        await pool.query(
            "DELETE FROM notificaciones WHERE id_usuario=$1",
            [idTrabajador]
        );
    }

    if (idTarea) {
        try {
            await TareasModelo.borrarTarea(idTarea);
        } catch (_) {}
    }

    if (idParcela) {
        try {
            await pool.query(
                "DELETE FROM parcela WHERE id=$1",
                [idParcela]
            );
        } catch (_) {}
    }

    if (idMaquina) {
        try {
            await MaquinasModelo.borrarMaquina(idMaquina);
        } catch (_) {}
    }

    if (idTrabajador) {
        try {
            await UsuarioModelo.borrarUsuario(idTrabajador);
        } catch (_) {}
    }

    if (idEncargado) {

        await pool.query(
            "DELETE FROM notificaciones WHERE id_usuario=$1",
            [idEncargado]
        );

        try {
            await UsuarioModelo.borrarUsuario(idEncargado);
        } catch (_) {}
    }
}

async function crearEscenarioBasico(app) {

    const sufijo = Date.now();

    const emailEncargado = `encargado_${sufijo}@test.com`;

    const emailTrabajador = `trabajador_${sufijo}@test.com`;

    const encargado = await crearUsuario(app, {
        nombre: "Encargado",
        email: emailEncargado,
        rol: "encargado",
        token: `tokenEncargado_${sufijo}`
    });

    const trabajador = await crearUsuario(app, {
        nombre: "Trabajador",
        email: emailTrabajador,
        rol: "trabajador",
        idEncargado: encargado.id,
        token: `tokenTrabajador_${sufijo}`
    });

    return {
        encargado,
        trabajador
    };
}

async function limpiarEstadoTrabajador(idTrabajador) {

    // Eliminar sesiones de trabajo
    await pool.query(
        `DELETE FROM sesion_trabajo
         WHERE id_trabajador = $1`,
        [idTrabajador]
    );

    // Eliminar fichajes
    await pool.query(
        `DELETE FROM fichaje
         WHERE id_trabajador = $1`,
        [idTrabajador]
    );

    await pool.query(
        `UPDATE tarea
         SET estado = 'pendiente',
             fecha_ini = NULL,
             fecha_fin = NULL
         WHERE id_trabajador = $1`,
        [idTrabajador]
    );
}

module.exports = {
    crearUsuario,
    crearParcela,
    crearTarea,
    crearMaquina,
    limpiarDatos,
    eliminarUsuarioSiExiste,
    crearEscenarioBasico,
    limpiarEstadoTrabajador
};