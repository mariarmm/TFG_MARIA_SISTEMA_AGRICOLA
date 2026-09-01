const nodemailer = require("nodemailer");   //Biblioteca para enviar correos

class CorreoServicio {

    //Crea el transporte, indicando el usuario y la contraseña de aplicación de la dirección que manda el correo
    static #transporte = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    //Método para enviar el correo de activación a la dirección de email especificada
    static async enviarCorreoActivacion(email, url) {
        
        await this.#transporte.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Activa tu cuenta",
            html: `
                <p> Bienvenido a AgroTask </p>
                <p>Pulsa el siguiente enlace para crear tu contraseña:</p>
                <a href="${url}">Crear contraseña</a>

                <p>Este enlace expirará en 1 hora.</p>
            `
        });
    }
}

module.exports = CorreoServicio;