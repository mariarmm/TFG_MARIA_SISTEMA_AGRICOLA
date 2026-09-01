const express = require("express");
const request = require("supertest");

const pool = require("../bd");

const SesionTrabajoModelo = require("../modelos/sesion_trabajo.modelo");

const rutasAutenticacion = require("../rutas/autenticacion.rutas");
const rutasTareas = require("../rutas/tareas.rutas");
const rutasSesionTrabajo = require("../rutas/sesion_trabajo.rutas");

const {crearParcela,crearTarea,limpiarDatos, crearEscenarioBasico} = require("./auxiliar");

const app = express();

app.use(express.json());
app.use("/autenticacion", rutasAutenticacion);
app.use("/tareas", rutasTareas);
app.use("/sesion-trabajo", rutasSesionTrabajo);

let encargado;
let trabajador;

let idParcela;
let idTarea;
let idMaquina;

beforeAll(async () => {

    ({ encargado, trabajador } = await crearEscenarioBasico(app));

    console.log(encargado);
    console.log(trabajador);
});

beforeEach(async () => {

    idParcela = null;
    idTarea = null;
    idMaquina = null;

    await pool.query(
        "DELETE FROM sesion_trabajo WHERE id_trabajador=$1",
        [trabajador.id]
    );

});

afterEach(async () => {

    if (idTarea || idParcela || idMaquina) {

        await limpiarDatos({
            idTarea,
            idParcela,
            idMaquina
        });

    }

    await pool.query(
        "DELETE FROM sesion_trabajo WHERE id_trabajador=$1",
        [trabajador.id]
    );

});

afterAll(async () => {

    await limpiarDatos({
        idTrabajador: trabajador.id,
        idEncargado: encargado.id
    });

    await pool.end();

});

describe("Sesión de trabajo", () => {

    test("Debe registrar una sesión correctamente", async () => {

        const parcela = await crearParcela(encargado.id);
        idParcela = parcela.id;

        const tarea = await crearTarea(
            app,
            encargado.token,
            {
                nombre: "Tarea de prueba",
                descripcion: "Descripción",
                id_trabajador: trabajador.id,
                id_parcela: parcela.id,
                fecha_planificada: "2026-04-27"
            }
        );

        idTarea = tarea.id;

        const res = await request(app)
            .patch(`/tareas/${tarea.id}/estado`)
            .set("Authorization", `Bearer ${trabajador.token}`)
            .send({
                estado: "en_proceso"
            });

        expect(res.statusCode).toBe(200);

        const sesion =
            await SesionTrabajoModelo.obtenerSesionActivaTrabajador(
                trabajador.id
            );

        expect(sesion).not.toBeNull();
        expect(sesion.id_trabajador).toBe(trabajador.id);
        expect(sesion.id_tarea).toBe(tarea.id);
        expect(sesion.activa).toBe(true);
    });

    test("Debe devolver 404 si no existe una sesión activa", async () => {

        const sesion = await request(app)
            .get(`/sesion-trabajo/activa`)
            .set("Authorization", `Bearer ${trabajador.token}`)

        expect(sesion.statusCode).toBe(404);
    });

});