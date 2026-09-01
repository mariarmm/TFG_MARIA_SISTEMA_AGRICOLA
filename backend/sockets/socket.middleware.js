const jwt = require('jsonwebtoken');

const verificarSocket = (socket, next) => {

    try{

        //Obtiene el token
        const token = socket.handshake.auth?.token;
        if(!token){
            return next(new Error("Token necesario"));
        }

        //Comprueba que el token JWT sea válido. Devuelve el id y el rol del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //Guarda el usuario dentro del socket
        socket.usuario = decoded;

        //Continua con la conexión
        next();
    }
    catch (err){
        //Mensaje de error
        return next(new Error("Token inválido"));
    }
};

module.exports = {verificarSocket};