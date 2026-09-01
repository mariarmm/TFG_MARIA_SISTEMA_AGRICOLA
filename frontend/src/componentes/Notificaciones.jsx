import { useEffect, useState } from "react";    //Importa useState para manejar el estado de las notificaciones
import { useSocket } from "../contextos/SocketContext"; //Importa el contexto de socket para recibir notificaciones en tiempo real

const Notificaciones = () => {
    const socket = useSocket();
    const [notificaciones, setNotificaciones] = useState([]);
    const [hayNuevas, setHayNuevas] = useState(false);

    useEffect(() => {
        if (!socket) return;

        // Escucha el evento "notificacion" del socket y actualiza el estado de las notificaciones
        socket.on("notificacion", (notificacion) => {
            setNotificaciones((prev) => [notificacion, ...prev]);
            setHayNuevas(true);
        });

        return () => socket.off("notificacion");
    }, [socket]);

    // Marca todas las notificaciones como vistas y actualiza el estado
    const marcarVistas = () => setHayNuevas(false);

    return { notificaciones, hayNuevas, marcarVistas };
};

export default Notificaciones;