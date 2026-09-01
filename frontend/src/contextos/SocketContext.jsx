import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

//Crea el contexto de Socket.io
const SocketContext = createContext(null);

//Componente que proporciona el contexto de Socket.io a toda la aplicación
export const SocketProvider = ({ children }) => {
    
    const [socket, setSocket] = useState(null);

    useEffect(() => {

        //Obtiene el token JWT
        const token = localStorage.getItem("token");

        //Si no hay token, no se inicia la conexión de Socket.io
        if (!token) {
            console.log("No hay token. No se inicia Socket.io.");
            return;
        }

        //Crea la conexión de Socket.io con el backend
        const s = io(import.meta.env.VITE_API_URL, {
            transports: ["polling", "websocket"],
            withCredentials: true,
            auth: { token },    //Envia el token

            //Reconexión automática en caso de pérdida de conexión
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });

        //Escucha eventos de conexión y desconexión para depuración
        s.on("connect", () => console.log("Socket conectado:", s.id));
        s.on("disconnect", (reason) => console.log("Socket desconectado:", reason));
        s.on("connect_error", (err) => console.log("Error conexión socket:", err.message));

        s.io.on("reconnect_attempt", (attempt) => {
            console.log(
                "Intentando reconectar socket...",
                attempt
            );
        });

        s.io.on("reconnect", (attempt) => {
            console.log(
                "Socket reconectado después de",
                attempt,
                "intentos"
            );
        });

        s.io.on("reconnect_error", (err) => {
            console.error(
                "Error al reconectar socket:",
                err.message
            );
        });

        //Guarda el socket
        setSocket(s);

        //Limpia los listeners y desconecta el socket al desmontar el componente
        return () => {
            console.log("Cerrando SocketContext");
            s.removeAllListeners();
            s.disconnect();
        };
        
    }, []);

    //Proporciona el socket a los componentes hijos
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

//Hook personalizado para usar el contexto de Socket.io
export const useSocket = () => useContext(SocketContext);