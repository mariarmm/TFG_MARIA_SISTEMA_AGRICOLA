const { Pool } = require('pg'); //Importa librería pg (PostgreSQL para Node). Trae la herramienta Pool. (Hace que la app sea más rápida porque deja la conexión abierta)
require('dotenv').config(); //Busca en el archivo .env (para la contraseña)

//Indica los datos para que sepa con que bd establecer la conexión
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

//Permite que otros archivos puedan usar esa conexión, solo necesitan importarla
module.exports = pool;