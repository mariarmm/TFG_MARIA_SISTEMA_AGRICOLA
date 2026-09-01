const express = require("express");
const request = require("supertest");
const pool = require("../bd");

const TareasModelo = require("../modelos/tareas.modelo");

const rutasAutenticacion = require("../rutas/autenticacion.rutas");
const rutasTareas = require("../rutas/tareas.rutas");

const {crearEscenarioBasico,crearUsuario,crearParcela,crearMaquina,limpiarDatos,crearTarea} = require("./auxiliar");

const app = express();

app.use(express.json());
app.use("/autenticacion", rutasAutenticacion);
app.use("/tareas", rutasTareas);

let encargado;
let trabajador;
let trabajador2 = null;

let idParcela;
let idTarea;
let idTarea2;
let idMaquina;

beforeAll(async () => {

    ({ encargado, trabajador } = await crearEscenarioBasico(app));

});

beforeEach(async () => {

    idParcela = null;
    idTarea = null;
    idTarea2 = null;
    idMaquina = null;
    trabajador2 = null;

    const parcela = await crearParcela(encargado.id);
    idParcela = parcela.id;

    await pool.query(
        "DELETE FROM sesion_trabajo WHERE id_trabajador=$1",
        [trabajador.id]
    );

});

afterEach(async () => {

    await limpiarDatos({
        idTarea,
        idTarea2,
        idParcela,
        idMaquina,
        trabajador2
    });

    idTarea = null;
    idTarea2 = null;
    idMaquina = null;
    trabajador2 = null;

});

afterAll(async () => {

    await limpiarDatos({
        idTrabajador: trabajador.id,
        idEncargado: encargado.id
    });

    await pool.end();

});

async function crearTareaPrueba() {

    const tarea = await crearTarea(
        app,
        encargado.token,
        {
            nombre: "Tarea de prueba",
            descripcion: "Descripción",
            id_trabajador: trabajador.id,
            id_parcela: idParcela,
            fecha_planificada: "2026-04-27"
        }
    );

    idTarea = tarea.id;

    return tarea;
}

describe("Tareas", () => {

    test("Debe crear una tarea correctamente", async () => {

        const tarea = await crearTareaPrueba();

        expect(tarea.id).toBeDefined();
        expect(tarea.nombre).toBe("Tarea de prueba");
    });

    test("Debe devolver 400 si falta el nombre", async () => {

        const res = await request(app)
            .post("/tareas")
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                descripcion: "Prueba",
                id_trabajador: trabajador.id,
                id_parcela: idParcela
            });

        expect(res.statusCode).toBe(400);
    });

    test("Debe devolver 400 si el trabajador no existe", async () => {

        const res = await request(app)
            .post("/tareas")
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                nombre: "Tarea de Prueba",
                descripcion: "Prueba",
                id_trabajador: -1,
                id_parcela: idParcela
            });

        expect(res.statusCode).toBe(400);
    });

    test("Debe devolver 400 si la parcela no existe", async () => {

        const res = await request(app)
            .post("/tareas")
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                nombre: "Tarea de Prueba",
                descripcion: "Prueba",
                id_trabajador: trabajador.id,
                id_parcela: -1
            });

        expect(res.statusCode).toBe(400);
    });

    test("Debe modificar una tarea correctamente", async () => {

        await crearTareaPrueba();

        const res = await request(app)
            .patch(`/tareas/${idTarea}`)
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                nombre: "Nombre modificado"
            });

        expect(res.statusCode).toBe(200);

        const tarea = await TareasModelo.obtenerTareaPorId(idTarea);

        expect(tarea.nombre).toBe("Nombre modificado");
    });


    test("Debe devolver 404 si la tarea a modificar no existe", async () => {

        const res = await request(app)
            .patch(`/tareas/-1`)
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                nombre: "Nombre modificado"
            });

        expect(res.statusCode).toBe(404);
    });


    test("Debe cambiar el estado a en_proceso", async () => {

        await crearTareaPrueba();

        const res = await request(app)
            .patch(`/tareas/${idTarea}/estado`)
            .set("Authorization", `Bearer ${trabajador.token}`)
            .send({
                estado: "en_proceso"
            });

        expect(res.statusCode).toBe(200);

        const tarea = await TareasModelo.obtenerTareaPorId(idTarea);

        expect(tarea.estado).toBe("en_proceso");
        expect(tarea.fecha_ini).not.toBeNull();
    });

    test("Debe cambiar el estado a completada", async () => {

        await crearTareaPrueba();

        await request(app)
            .patch(`/tareas/${idTarea}/estado`)
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                estado: "en_proceso"
            });

        const res = await request(app)
            .patch(`/tareas/${idTarea}/estado`)
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                estado: "completada"
            });

        expect(res.statusCode).toBe(200);

        const tarea = await TareasModelo.obtenerTareaPorId(idTarea);

        expect(tarea.estado).toBe("completada");
        expect(tarea.fecha_fin).not.toBeNull();
    });

    test("Debe devolver 400 si cambia una tarea a un estado inválido", async () => {

        await crearTareaPrueba();

        const res = await request(app)
            .patch(`/tareas/${idTarea}/estado`)
            //todo
            .set("Authorization", `Bearer ${trabajador.token}`)
            .send({
                estado: "terminando"
            });

        expect(res.statusCode).toBe(400);
    });

    test("Debe devolver 404 si cambia el estado de una tarea que no existe", async () => {

        const res = await request(app)
            .patch(`/tareas/-1/estado`)
            //todo
            .set("Authorization", `Bearer ${trabajador.token}`)
            .send({
                estado: "en_proceso"
            });

        expect(res.statusCode).toBe(404);
    });

    test("Debe eliminar una tarea", async () => {

        await crearTareaPrueba();

        const res = await request(app)
            .delete(`/tareas/${idTarea}/`)
            .set("Authorization", `Bearer ${encargado.token}`)

        expect(res.statusCode).toBe(200);

        const tarea = await TareasModelo.obtenerTareaPorId(idTarea);

        expect(tarea).toBeUndefined();
    });


    test("Debe devolver 404 si elimina una tarea que no existe", async () => {

        await crearTareaPrueba();

        const res = await request(app)
            .delete(`/tareas/-1/`)
            .set("Authorization", `Bearer ${encargado.token}`)

        expect(res.statusCode).toBe(404);
    });


    test("Debe impedir iniciar una segunda tarea al mismo trabajador", async () => {

        const tarea1 = await crearTareaPrueba(
            app,
            encargado.token,
            {
                nombre: "Tarea 1",
                descripcion: "Prueba",
                id_trabajador: trabajador.id,
                id_parcela: idParcela,
                fecha_planificada: "2026-04-27"
            }
        );

        const tarea2 = await crearTareaPrueba(
            app,
            encargado.token,
            {
                nombre: "Tarea 2",
                descripcion: "Prueba",
                id_trabajador: trabajador.id,
                id_parcela: idParcela,
                fecha_planificada: "2026-04-27"
            }
        );

        // Guardamos la segunda para que afterEach la elimine
        idTarea = tarea2.id;

        // Iniciar la primera
        const res1 = await request(app)
            .patch(`/tareas/${tarea1.id}/estado`)
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                estado: "en_proceso"
            });

        expect(res1.statusCode).toBe(200);

        // Intentar iniciar la segunda
        const res2 = await request(app)
            .patch(`/tareas/${tarea2.id}/estado`)
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                estado: "en_proceso"
            });

        expect(res2.statusCode).toBe(400);
        expect(res2.body.error).toBe(
            "Este trabajador tiene otra tarea iniciada."
        );

        // Eliminar la sesión para poder borrar la primera tarea
        await pool.query(
            "DELETE FROM sesion_trabajo WHERE id_trabajador = $1",
            [trabajador.id]
        );

        await TareasModelo.borrarTarea(tarea1.id);
    });

    test("Debe listar las tareas del encargado", async () => {

        await crearTareaPrueba();

        const res = await request(app)
            .get("/tareas")
            .set("Authorization", `Bearer ${encargado.token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);

        expect(
            res.body.some(t => t.id === idTarea)
        ).toBe(true);
    });


    test("Debe filtrar las tareas por estado", async () => {

        await crearTareaPrueba();

        await request(app)
            .patch(`/tareas/${idTarea}/estado`)
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                estado: "en_proceso"
            });

        const res = await request(app)
            .get("/tareas")
            .query({
                estado: "en_proceso"
            })
            .set("Authorization", `Bearer ${encargado.token}`);

        expect(res.statusCode).toBe(200);
        expect(
            res.body.some(t => t.id === idTarea && t.estado === "en_proceso")
        ).toBe(true);
    });

    test("Debe impedir iniciar una tarea cuando la máquina ya está siendo utilizada", async () => {

        const trabajador2 = await crearUsuario(app, {
            nombre: "Trabajador 2",
            email: "trabajadorpruebas2@test.com",
            rol: "trabajador",
            idEncargado: encargado.id,
            token: `token_${Date.now()}`
        });

        idtrabajador2 = trabajador2.id;
        const maquina = await crearMaquina(
            "Tractor de prueba",
            "Descripcion de prueba",
            encargado.id
        );

        idMaquina = maquina.id;

        const tarea1 = await crearTarea(
            app,
            encargado.token,
            {
                nombre: "Tarea 1",
                descripcion: "Prueba",
                id_trabajador: trabajador.id,
                id_parcela: idParcela,
                id_maquina: idMaquina,
                fecha_planificada: "2026-04-27"
            }
        );

        const tarea2 = await crearTarea(
            app,
            encargado.token,
            {
                nombre: "Tarea 2",
                descripcion: "Prueba",
                id_trabajador: trabajador2.id,
                id_parcela: idParcela,
                id_maquina: idMaquina,
                fecha_planificada: "2026-04-27"
            }
        );

        idTarea = tarea1.id;
        idTarea2 = tarea2.id;

        // Iniciar la primera tarea
        const res1 = await request(app)
            .patch(`/tareas/${idTarea}/estado`)
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                estado: "en_proceso"
            });

        expect(res1.statusCode).toBe(200);

        // Intentar iniciar la segunda tarea
        const res2 = await request(app)
            .patch(`/tareas/${idTarea2}/estado`)
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                estado: "en_proceso"
            });

        expect(res2.statusCode).toBe(400);
        expect(res2.body.error).toBe("La máquina no está disponible.");

        // Verificar que solo existe una sesión activa para esa máquina
        const sesiones = await pool.query(
            `SELECT *
            FROM sesion_trabajo
            WHERE id_maquina = $1
            AND activa = TRUE`,
            [idMaquina]
        );

        expect(sesiones.rowCount).toBe(1);
        expect(sesiones.rows[0].id_trabajador).toBe(trabajador.id);
    });

});

