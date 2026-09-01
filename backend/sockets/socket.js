const {Server} = require("socket.io"); //Importa el Server de Socket.IO para crear un servidor de comunicación basado en WebSockets.

const servicioUbicacion = require("../servicios/ubicacion.servicio");
const servicioNotificaciones = require("../servicios/notificaciones.servicio");
const servicioFichaje = require("../servicios/fichaje.servicio");

const authSocket = require("./socket.middleware");

let ioInstancia = null;

//Direcciones desde las que se permiten conexiones
const allowedOrigins = [
      'http://localhost',
      'https://localhost',      
      'http://localhost:3000',
      'http://localhost:5173',
      'capacitor://localhost',
      'http://localhost:8080',
      'http://192.168.100.228:5173',
      'http://192.168.18.125:5173'
];

//Coordina ubicación y notificaciones
const iniciarSocket = (servidor) => {

    //Crea una instancia de Socket.IO asociada a servidor (servidor HTTP)
    const io = new Server(servidor, {
        
        //Configuración de CORS (determina qué aplicaciones pueden establecer una conexión con el servidor Socket.IO)
        cors: {

            origin: function (origin, callback) {

                //Si es una dirección permitida o un dominio generado por Cloudflare Tunnel
                if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".trycloudflare.com")) {

                    callback(null, true);
                } else {
                    callback(new Error("No permitido por CORS"));
                }
            },

            methods: ["GET", "POST", "PATCH"],
            credentials: true
        },
        //Transportes utilizados (WebSocket como mecanismo principal, Polling como mecanismo alternativo)
        transports: ["websocket", "polling"]
    });

    ioInstancia = io;

    //Middleware para comprobar que el usuario está autenticado
    io.use(authSocket.verificarSocket);

    //Comparte la instancia de Socket.IO con los servicios
    servicioUbicacion.setSocket(io);
    servicioNotificaciones.setSocket(io);
    servicioFichaje.setSocket(io);

    //Gestión de nuevas conexiones
    io.on("connection", (socket) => {
    
        console.log("Socket conectado:", socket.id, "ROL:", socket.usuario.rol, "ID:", socket.usuario.id);

        //Cada usuario entra en una sala personal (para notificaciones)
        socket.join(`usuario_${socket.usuario.id}`);

        //Los usuarios con rol admin o encargado entran a sala encargado (para las ubicaciones de trabajadores)
        if (socket.usuario.rol === "encargado" || socket.usuario.rol === "admin") {
            socket.join(`encargado_${socket.usuario.id}`);
            console.log(`Encargado ${socket.usuario.id} unido a sala encargado_${socket.usuario.id}`);
        }

        //Se ejecuta cuando pierde conexión
        socket.on("disconnect", (reason) => {
            console.log("Usuario desconectado:",socket.usuario.id, "Motivo: ", reason);
        });

    });
};

module.exports = {iniciarSocket};