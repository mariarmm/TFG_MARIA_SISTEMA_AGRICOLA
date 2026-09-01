const modeloTokenNotificaciones = require('../modelos/tokens_notificaciones.modelos');

const registrarToken = async (req, res) => {

    const {id} = req.usuario;
    const {token} = req.body;

    if(!id || !token){
        return res.status(400).json({error: "Faltan datos obligatorios"});
    }

    try{
        const tokenCreado = await modeloTokenNotificaciones.crearToken(id, token);

        if (!tokenCreado) {
            return res.status(200).json({
                mensaje: "El token ya estaba registrado"
            });
        }

        res.status(201).json(tokenCreado);
    }catch(err){
        console.error("Error registrando token:",err.message);
        res.status(500).json({error: "Error en el servidor"});
    }
}


const eliminarToken = async (req, res) => {

    const {id} = req.usuario;
    const {token} = req.params;

    if(!token){
        return res.status(400).json({error: "Falta el token"});
    }

    try{
        const tokenEliminado = await modeloTokenNotificaciones.borrarToken(id, token);

        if(!tokenEliminado){
            return res.status(404).json({error: "Token no encontrado"});
        }

        res.status(200).json(tokenEliminado);
    }
    catch(err){
        console.error("Error eliminando token:", err.message);
        res.status(500).json({error: "Error en el servidor"});
    }
};

module.exports = {registrarToken, eliminarToken};