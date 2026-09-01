const jwt = require('jsonwebtoken');    //Importa JWT
const crypto = require("crypto");       //Importa crypto para el cifrado de token de activación
const bcrypt = require('bcrypt');       //Importa bcrypt para el cifrado de contraseñas

const UsuarioModelo = require("../modelos/usuarios.modelo");

class AutenticacionControlador {

    //Controlador para activar la cuenta de un usuario
    static async activarCuenta(req, res) {

        const {token, contrasenia} = req.body;

        if(!token || !contrasenia){
            return res.status(400).json({error:"Faltan datos"});
        }

        try{
            const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

            //Obtiene el usuario asociado al token
            const usuario = await UsuarioModelo.obtenerUsuarioPorToken(tokenHash);

            if(!usuario){
                return res.status(400).json({error:"Token inválido o expirado"});
            }

            const passwordHash = await bcrypt.hash(contrasenia, 10);

            //Cambia la contraseña del usuario y activa su cuenta
            await UsuarioModelo.cambiarContraseña(usuario.id, passwordHash);

            res.status(200).json({mensaje:"Cuenta activada"});
        }
        catch (error){
            console.log(error);

            res.status(500).json({error: "Error del servidor"});
        }
    }

    //Método privado para validar el formato de las credenciales
    static #validarFormatoCredenciales(email, contrasenia) {

        //Comprueba que los datos no esten vacios
        if(!email || !contrasenia){
            return { valido: false, mensaje: "Faltan campos obligatorios" };
        }

        //Comprueba que el email tenga un formato correcto
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valido: false, mensaje: "Email no válido" };
        }

        //Comprueba la longitud de la contraseña
        if(contrasenia.length<5 || contrasenia.length>20){
            return { valido: false, mensaje: "La contraseña debe tener entre 5 y 20 caracteres" };
        }

        return { valido: true };
    }

    //Método privado para validar las credenciales del usuario
    static async #validarCredenciales(email, contrasenia) {

        //Comprueba si existe un usuario en la bd con ese correo
        const usuario = await UsuarioModelo.obtenerUsuarioPorEmail(email);

        //Si existe el usuario
        if(usuario){
            
            //Si no tiene contraseña, significa que no ha activado su cuenta
            if(!usuario.contrasenia){
                return { valido: false, mensaje: "Debes activar tu cuenta" };
            }

            //Comprueba que la contraseña introducida sea correcta
            const loginExito = await bcrypt.compare(contrasenia, usuario.contrasenia);

            if (loginExito) {

                //Devuelve el usuario sin la contraseña
                delete usuario.contrasenia;
                return { valido: true, usuario };
            } 
            else {
                return { valido: false, mensaje: "La contraseña no es correcta" };
            }

        } else {
            // No se encontró ningún usuario con ese email
            return { valido: false, mensaje: "El usuario no existe" };
        }
    }

    //Controlador para que un usuario inicie sesión en el sistema
    static async login(req, res) {

        //Desestructuración de los datos recibidos en el cuerpo de la petición (JSON)
        const {email, contrasenia} = req.body;

        //Valida el formato de las credenciales
        const credencialesValidas = AutenticacionControlador.#validarFormatoCredenciales(email, contrasenia);

        if (!credencialesValidas.valido) {
            return res.status(400).json({ error: credencialesValidas.mensaje });
        }

        try{

            //Valida las credenciales del usuario
            const resultado = await AutenticacionControlador.#validarCredenciales(email, contrasenia);

            //Si las credenciales no son válidas, devuelve un error
            if (!resultado.valido) {

                //Si la cuenta no está activa, devuelve un error 403
                if (resultado.mensaje === "Debes activar tu cuenta") {
                    return res.status(403).json({ error: resultado.mensaje });
                }

                //Para otros errores de credenciales, devuelve un error 401
                return res.status(401).json({ error: resultado.mensaje });
            }
            else{                

                // Creación del token
                const token = jwt.sign(
                    {id: resultado.usuario.id, rol: resultado.usuario.rol},
                    process.env.JWT_SECRET,
                    {expiresIn: "24h"}
                )

                //Si el login es correcto, devuelve el token y los datos del usuario
                return res.status(200).json({
                    mensaje: "Login correcto",
                    token: token,
                    usuario: resultado.usuario
                });
            }

        } catch (err) {

            // Mensaje de error
            console.error("Error en el proceso de login:", err.message);
            res.status(500).send("Error en el servidor");
        }
    };

}

module.exports = AutenticacionControlador;