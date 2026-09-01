const express = require("express");
const request = require("supertest");
const pool = require("../bd");

const UsuarioModelo = require("../modelos/usuarios.modelo");

const rutasUsuario = require("../rutas/usuarios.rutas");
const rutasAutenticacion = require("../rutas/autenticacion.rutas");

const {crearUsuario,crearEscenarioBasico,limpiarDatos} = require("./auxiliar");

const app = express();

app.use(express.json());
app.use("/usuarios", rutasUsuario);
app.use("/autenticacion", rutasAutenticacion);

let encargado;
let trabajador;

beforeAll(async () => {

    ({ encargado, trabajador } = await crearEscenarioBasico(app));

});

afterAll(async () => {

    await limpiarDatos({
        idTrabajador: trabajador.id,
        idEncargado: encargado.id
    });

    await pool.end();

});

describe("Usuarios", () => {

    let usuarioPrueba;

    beforeEach(async () => {

        usuarioPrueba = await crearUsuario(app, {
            nombre: "Trabajador Prueba",
            email: `trabajador_${Date.now()}@test.com`,
            rol: "trabajador",
            idEncargado: encargado.id,
            token: `token_${Date.now()}`
        });

    });

    afterEach(async () => {

        await limpiarDatos({
            idTrabajador: usuarioPrueba.id
        });

    });

    test("Debe devolver 400 si el email ya existe", async () => {

        const res = await request(app)
            .post("/usuarios")
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                nombre: "Otro trabajador",
                email: usuarioPrueba.email,
                rol: "trabajador",
                id_encargado: encargado.id
            });

        expect(res.statusCode).toBe(400);

    });

    test("Debe modificar el nombre del usuario", async () => {

        const res = await request(app)
            .patch(`/usuarios/${usuarioPrueba.id}`)
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                nombre: "Trabajador Modificado"
            });

        expect(res.statusCode).toBe(200);

        const usuario = await UsuarioModelo.obtenerUsuarioPorId(usuarioPrueba.id);

        expect(usuario.nombre).toBe("Trabajador Modificado");

    });

    test("Debe eliminar un usuario", async () => {

        const res = await request(app)
            .delete(`/usuarios/${usuarioPrueba.id}`)
            .set("Authorization", `Bearer ${encargado.token}`);

        expect(res.statusCode).toBe(200);

        const usuario = await UsuarioModelo.obtenerUsuarioPorId(usuarioPrueba.id);

        expect(usuario).toBeUndefined();

        // Evitar que afterEach intente borrarlo otra vez
        usuarioPrueba = {};

    });

    test("Debe listar los trabajadores correctamente", async () => {

        const res = await request(app)
            .get("/usuarios?rol=trabajador")
            .set("Authorization", `Bearer ${encargado.token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        const existe = res.body.some(u => u.id === usuarioPrueba.id);

        expect(existe).toBe(true);

    });

    test("Debe devolver 404 al modificar un usuario inexistente", async () => {

        const res = await request(app)
            .patch("/usuarios/999999")
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                nombre: "NuevoNombre"
            });

        expect(res.statusCode).toBe(404);

    });

});

describe("Creación de usuarios", () => {

    let nuevoUsuario;

    afterEach(async () => {

        if (nuevoUsuario) {
            await limpiarDatos({
                idTrabajador: nuevoUsuario.id
            });
        }

    });

    test("Debe crear un trabajador correctamente", async () => {

        const email = `nuevo_${Date.now()}@test.com`;

        const res = await request(app)
            .post("/usuarios")
            .set("Authorization", `Bearer ${encargado.token}`)
            .send({
                nombre: "Trabajador Nuevo",
                email,
                rol: "trabajador",
                id_encargado: encargado.id
            });

        expect(res.statusCode).toBe(201);

        const usuario = await UsuarioModelo.obtenerUsuarioPorEmail(email);

        nuevoUsuario = {
            id: usuario.id
        };

    });

});