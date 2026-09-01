const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {

    const authHeader = req.headers['authorization'];

    //Limpia el token (quita espacios)
    const token = authHeader && authHeader.split(' ')[1];

    //Si no está el token, error
    if(!token){
        return res.status(401).json({error: "Token necesario"});
    }


    try{

        //Comprueba que el token sea válido. Devuelve el id y el rol del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Inyecta id y rol de usuario
        req.usuario = decoded;

        next();
        
    }catch(err){
        return res.status(403).json({error: "Token inválido"});
    }
};


//Comprueba si el rol del usuario es alguno de los rolesPermitidos que se pasan por parámetro
const verificarRol = (rolesPermitidos) => {
    
    return (req, res, next) => {

        const usuario = req.usuario;

        if(!usuario){
            return res.status(401).json({error: "Usuario no autenticado"});
        }

        //El admin tiene acceso a todas las funcionalidades
        if(usuario.rol === "admin"){
            return next();
        }

        if(!rolesPermitidos.includes(usuario.rol)){
            return res.status(403).json({error: "Acceso denegado"});
        }

        next();
    }
}



module.exports = {verificarToken, verificarRol};