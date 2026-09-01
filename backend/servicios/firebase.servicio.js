const admin = require("firebase-admin");
const serviceAccount = require("../firebase-service-account.json");

//Inicializa firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//Exporta el objeto admin ya configurado
module.exports = admin;