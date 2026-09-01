const express = require("express");
const request = require("supertest");
const pool = require("../bd");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UsuarioModelo = require("../modelos/usuarios.modelo");

const rutasAutenticacion = require("../rutas/autenticacion.rutas");

const {crearUsuario,crearEscenarioBasico, eliminarUsuarioSiExiste} = require("./auxiliar");

const app = express();
app.use(express.json());
app.use("/autenticacion", rutasAutenticacion);


let encargado;
let trabajador;
let ids;

beforeEach(async () => {
    const escenario = await crearEscenarioBasico(app);

    encargado = escenario.encargado;
    trabajador = escenario.trabajador;
    ids = escenario.ids;
});

afterEach(async () => {

    await eliminarUsuarioSiExiste(trabajador.email);
});


describe("Autenticación", () => {

    test("Debe iniciar sesión con credenciales válidas", async () => {

        const res = await request(app)
            .post("/autenticacion/login")
            .send({
                email: trabajador.email,
                contrasenia: "Password123"
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(typeof res.body.token).toBe("string");
        expect(res.body.token.length).toBeGreaterThan(20);
        expect(res.body.usuario.rol).toBe("trabajador");
    });


    test("Debe devolver 401 con contraseña incorrecta", async () => {

        const res = await request(app)
            .post("/autenticacion/login")
            .send({
                email: trabajador.email,
                contrasenia: "trabajador"
            });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("error");
    });

    test("Debe devolver 401 si el usuario no existe", async () => {

        const res = await request(app)
            .post("/autenticacion/login")
            .send({
                email: "trabajadorencargado@test.com",
                contrasenia: "trabajador"
            });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("error");
    });

    test("Debe devolver error si el email está vacío", async () => {

        const res = await request(app)
            .post("/autenticacion/login")
            .send({
                email: "",
                contrasenia: "Password123"
            });

        expect(res.statusCode).toBe(400); // o el código que devuelva tu API
        expect(res.body).toHaveProperty("error");
    });

    test("Debe devolver error si la contraseña está vacía", async () => {

        const res = await request(app)
            .post("/autenticacion/login")
            .send({
                email: trabajador.email,
                contrasenia: ""
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    test("Debe generar un JWT válido tras un inicio de sesión correcto", async () => {
        
        const res = await request(app)
            .post("/autenticacion/login")
            .send({
                email: process.env.TRABAJADOR_EMAIL,
                contrasenia: process.env.TRABAJADOR_PASSWORD
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("token");

        // Verificar el JWT
        const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);

        expect(payload).toHaveProperty("id");
        expect(payload).toHaveProperty("rol");
        expect(payload.rol).toBe("trabajador");
    });

});


describe("Activación de cuenta", () => {

    let idUsuario;

    beforeEach(async () => {

        // Crear un usuario nuevo SIN activar
        token = "token_prueba";

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        const usuario = await UsuarioModelo.crearUsuario("Usuario Test", "usuario.test@test.com", "trabajador", 12, tokenHash);

        idUsuario = usuario.id;
    });

    afterEach(async () => {
        // Eliminar el usuario creado para esta prueba
        await UsuarioModelo.borrarUsuario(idUsuario);
    });

    test("Activa correctamente una cuenta con un token válido", async () => {
        
        const res = await request(app)
            .post("/autenticacion/activar-cuenta")
            .send({
                token,
                contrasenia: "Password123"
            });

        expect(res.statusCode).toBe(200);

        const usuario = await UsuarioModelo.obtenerUsuarioPorId(idUsuario);

        expect(usuario.cuenta_verificada).toBe(true);
        expect(usuario.token).toBeNull();
    });

    test("Debe devolver error si el token es inválido", async () => {
    
        tokenIncorrecto = "noEsElToken"

        const res = await request(app)
            .post("/autenticacion/activar-cuenta")
            .send({
                tokenIncorrecto,
                contrasenia: "Password123"
            });

        expect(res.statusCode).toBe(400);

        const usuario = await UsuarioModelo.obtenerUsuarioPorId(idUsuario);

        expect(usuario.cuenta_verificada).toBe(false);
    });

});


afterAll(async () => {
    await pool.end();
});