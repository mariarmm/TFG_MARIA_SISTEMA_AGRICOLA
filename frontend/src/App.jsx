
//Importa los componentes para gestionar la navegación entre las diferentes páginas mediante React Router
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import './App.css' //Importa los estilos de la aplicación

//Importa las páginas de la aplicación
import Login from "./paginas/Login";
import Tareas from "./paginas/Tareas";
import Equipo from "./paginas/Equipo";
import Mapa from "./paginas/Mapa";
import Parcelas from "./paginas/Parcelas";
import Informes from "./paginas/Informes";
import ActivacionCuenta from "./paginas/ActivacionCuenta";


//Componente que proporciona la estructura de la aplicación
import Layout from "./componentes/Layout";

//Componente que proporciona unos estilos base para la aplicación
import CssBaseline from '@mui/material/CssBaseline';

//Proporciona acceso a la conexión de Socket.IO
import { SocketProvider } from "./contextos/SocketContext";

//Plugin de capacitor para las notificaciones push
import { PushNotifications } from '@capacitor/push-notifications';

import { useEffect } from "react";

//Funciones encargadas de realizar peticiones al backend y manejar las respuestas
import { apiFetch, manejarRespuesta } from "./api";


function App() {

  //Obtiene el token JWT
  const token = localStorage.getItem("token");


  useEffect(() => {

    //Inicializa las notificaciones push
    const initPush = async () => {

      //Si no hay token, no se inicializan las notificaciones
      if (!token) return;

      try {
        
        //Elimina listeners existentes para evitar duplicados
        await PushNotifications.removeAllListeners();

        //Comprueba si la aplicación tiene permiso para enviar notificaciones push
        let permStatus = await PushNotifications.checkPermissions();

        //Si no tiene permiso, solicita autorización al usuario
        if (permStatus.receive !== "granted") {
          permStatus = await PushNotifications.requestPermissions();
        }

        //Si el usuario no concede permiso, se detiene la inicialización
        if (permStatus.receive !== "granted") {
          console.log("Permisos no concedidos");
          return;
        }

        //Registra la aplicación para recibir notificaciones push
        PushNotifications.addListener('registration', async (pushToken) => {
          
          //Guarda el token de notificación push en el almacenamiento local
          localStorage.setItem("fcm_token", pushToken.value);

          try {

            //Envia el token de notificación push al backend para asociarlo con el usuario
            const res = await apiFetch(`/tokens-notificaciones`, {
                method: "POST",
                body: JSON.stringify({token: pushToken.value })
            })

            //Comprueba la respuesta del backend
            await manejarRespuesta(res);
            console.log("Token enviado al backend");

          } catch (err) {
            console.error("Error enviando token al backend:", err);
          }
        });

        //Listener para manejar errores durante el registro de notificaciones push
        PushNotifications.addListener('registrationError', (err) => {
          console.error("ERROR registration push:", err);
        });

        //Registra el dispositivo para recibir notificaciones push
        await PushNotifications.register();

      } catch (err) {
        console.error("Error en initPush:", err);
      }
    };

    //Ejecuta la inicialización de las notificaciones push
    initPush();

    //Limpia los listeners al desmontar el componente
    return () => {
      PushNotifications.removeAllListeners();
    };

  }, [token]);  


  return (

    // Proporciona conexión Socket.IO a toda la aplicación
    <SocketProvider>
      <>

        {/* Aplica estilos base de Material UI a la aplicación */}
        <CssBaseline />

        {/* Componente que habilita la navegación mediante React Router */}
        <BrowserRouter>

          {/* Define las rutas de la aplicación */}
          <Routes>

            {/* Ruta de página inicio de sesión */}
            <Route path="/" element= {<Login/>} />

            {/* Ruta de página activación de cuenta */}
            <Route path="/autenticacion/activar-cuenta/:token" element={<ActivacionCuenta />} />


            {/* Rutas que requieren autenticación. 
              Si existe token, se muestra el LAYOUT
              En caso contrario, se redirige a la página de inicio de sesión */}
            <Route element={token ? <Layout /> : <Navigate to="/" />}>

              <Route path="/tareas" element={<Tareas />} />
              <Route path="/equipo" element={<Equipo />} />
              <Route path="/mapa" element={<Mapa />} />
              <Route path="/parcelas" element={<Parcelas />} />
              <Route path="/informes" element={<Informes />} />
              
            </Route>

          </Routes>
        </BrowserRouter>
      </>
    </SocketProvider>
    
   
  );
}

//Exporta el componente principal de la aplicación
export default App;
