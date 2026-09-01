const http = require("http");
const app = require("./app");

const { iniciarSocket } = require("./sockets/socket");


//Crear servidor HTTP
const server = http.createServer(app);

//Inicializar Socket.IO sobre servidor HTTP
iniciarSocket(server);

const PORT = 3000;

//Backend escucha en el puerto 3000
server.listen(PORT,"0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


//Prueba de que pool de bd.js funciona
const pool = require('./bd');
pool.query('SELECT NOW()', (err, res) => {
    if(err){
        console.error('Error conectando bd:', err.stack);
    }
    else{
        console.log('Conexión exitosa. La hora en la BD es: ', res.rows[0].now);
    }
});