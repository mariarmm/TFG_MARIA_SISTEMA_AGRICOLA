import { useEffect, useRef } from "react";  //Importa useRef para manejar referencias a elementos y valores persistentes

// Importa la librería de geolocalización en segundo plano
import BackgroundGeolocation from "@transistorsoft/capacitor-background-geolocation";

// Hook personalizado para manejar la geolocalización en segundo plano
export const useBackgroundGeolocation = () => {

    const configurado = useRef(false);

    // Configura la geolocalización en segundo plano
    const configurar = async () => {
        if (configurado.current) return;

        const apiUrl = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem("token");

        await BackgroundGeolocation.ready({
            desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
            distanceFilter: 50, // Mínima distancia en metros para recibir actualizaciones de ubicación
            stopOnTerminate: false,
            startOnBoot: false,
            heartbeatInterval: 60,  // Intervalo en segundos para el heartbeat (valor modificado para la demostración)

            // URL para enviar la ubicación al backend
            url: `${apiUrl}/ubicacion/`,
            httpRootProperty: ".",
            locationTemplate: '{ "lat": <%= latitude %>, "lon": <%= longitude %> }',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            autoSync: true,
            stopTimeout: 0,

            // Notificación persistente
            notification: {
                title: "Jornada activa",
                text: "Compartiendo ubicación con tu encargado",
                channelName: "Seguimiento de ubicación",
                priority: BackgroundGeolocation.NOTIFICATION_PRIORITY_HIGH,
                sticky: true,        // No se puede descartar
            },

            debug: false,
            reset: true,  // Fuerza reconfiguración aunque ya estuviera inicializado
        });

        // Heartbeat: fuerza una ubicación cada heartbeatInterval aunque no haya movimiento
        BackgroundGeolocation.onHeartbeat(async () => {
            console.log("Heartbeat:", new Date().toLocaleTimeString());

            try {
                await BackgroundGeolocation.getCurrentPosition({
                    samples: 1,
                    persist: true,   // persist: true → lo envía via HTTP automáticamente
                });
            } catch (err) {
                console.error("Error en heartbeat:", err);
            }
        });

        configurado.current = true;
    };

    // Inicia la geolocalización en segundo plano y obtiene la ubicación actual
    const iniciar = async () => {

        // Reconfigura al iniciar para utilizar la URL actual
        configurado.current = false;
        await configurar();

        await BackgroundGeolocation.start();

        // Ubicación inmediata
        await BackgroundGeolocation.getCurrentPosition({
            samples: 1,
            persist: true,
        });
    };

    // Detiene la geolocalización en segundo plano y elimina los listeners
    const detener = async () => {
        await BackgroundGeolocation.stop();
        await BackgroundGeolocation.removeListeners();
        configurado.current = false;
    };

    return { iniciar, detener };
};