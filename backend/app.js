const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = [
      'http://localhost',
      'https://localhost',      
      'http://localhost:3000',
      'http://localhost:5173',   // Vite
      'capacitor://localhost',   // iOS Capacitor
      'http://localhost:8080',
      'http://192.168.100.228:5173',
      'http://192.168.18.125:5173'
];

const corsOptions = {
  
  origin: function (origin, callback) {
    
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.trycloudflare.com')) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('/{*path}', cors(corsOptions));


app.use(express.json());

// Importar rutas
const rutasAutenticacion = require('./rutas/autenticacion.rutas');
const rutasUsuario = require('./rutas/usuarios.rutas');
const rutasTarea = require('./rutas/tareas.rutas');
const rutasFichaje = require('./rutas/fichaje.rutas');
const rutasUbicacion = require('./rutas/ubicacion.rutas');
const rutasParcela = require('./rutas/parcelas.rutas');
const rutasInforme = require('./rutas/informe.rutas');
const rutasNotificaciones = require('./rutas/notificaciones.rutas');
const rutasMaquinas = require('./rutas/maquinas.rutas');
const rutasSesionTrabajo = require('./rutas/sesion_trabajo.rutas');
const rutasTokensNotificaciones = require('./rutas/tokens_notificaciones.rutas');
const rutasTest = require("./rutas/test.rutas");


app.use('/autenticacion', rutasAutenticacion);
app.use('/usuarios', rutasUsuario);
app.use('/tareas', rutasTarea);
app.use('/fichaje', rutasFichaje);
app.use('/ubicacion', rutasUbicacion);
app.use('/parcelas', rutasParcela);
app.use('/informes', rutasInforme);
app.use('/notificaciones', rutasNotificaciones);
app.use('/maquinas', rutasMaquinas);
app.use('/sesion-trabajo', rutasSesionTrabajo);
app.use('/tokens-notificaciones', rutasTokensNotificaciones);


if (process.env.NODE_ENV === "test") {
    app.use("/test", rutasTest);
}

app.get('/', (req, res) => {
  res.send('¡El Backend de la app agrícola está vivo!');
});

module.exports = app;