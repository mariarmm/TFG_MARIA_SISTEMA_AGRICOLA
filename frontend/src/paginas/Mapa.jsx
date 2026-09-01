import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { useSocket } from "../contextos/SocketContext";

import { apiFetch } from "../api";

//CONFIGURACION LATITUD Y LONGITUD

    //Campo cerca de la ETSIIT: 37.186779, -3.637076
    const latitud = 37.186779;
    const longitud = -3.637076;

    //Etsiit: 37.196957, -3.624863
    // const latitud = 37.196957;
    // const longitud = -3.624863;

    //Alomartes: 37.254312, -3.942657
    // const latitud = 37.254312;
    // const longitud = -3.942657;


// Iconos personalizados para trabajadores y tractores
const trabajadorIcon = L.icon({
    iconUrl: "/icono_trabajador.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

const tractorIcon = L.icon({
    iconUrl: "/icono_tractor.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});


/**
 * Pantalla Mapa
 * 
 * Muestra un mapa con Leaflet donde:
 *   Se visualizan trabajadores en tiempo real
 *   Se dibujan parcelas desde la base de datos
 */
const Mapa = () => {

    const mapaRef = useRef(null); //Referencia al mapa Leaflet 
    const marcadoresRef = useRef(new Map());    //Almacena los marcadores activos
    const containerRef = useRef(null);  //Referencia al contenedor del mapa
    const socket = useSocket(); //Socket para recibir las ubicaciones en tiempo real

    // Inicializa el mapa
    useEffect(() => {

        if (!containerRef.current) return;

        //Si ya existe un mapa, lo elimina
        if (mapaRef.current) {
            mapaRef.current.remove();
            mapaRef.current = null;
        }

        //Crea el mapa centrado con las coordenadas iniciales
        const map = L.map("map", {
            attributionControl: false
        }).setView([latitud, longitud], 16);

        L.control.attribution({
            position: "bottomright"
        }).addTo(map);

        mapaRef.current = map;

        L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    "&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community"
            }
        ).addTo(map);

        //Ajusta tamaño tras render
        requestAnimationFrame(() => map.invalidateSize());

        //Limpia al desmontar el componente
        return () => {
            map.remove();
            mapaRef.current = null;
        };
    }, []);

    // Crea el contenido del popup del marcador
    const crearContenido = (nombre, id_trabajador, id_maquina, id_tarea) => {

        const tipo = id_maquina ? "Tractor" : "Trabajador";
        const nombreMostrado = nombre || `Trabajador ${id_trabajador}`;

        let html = `<b>${tipo}</b><br/>${nombreMostrado}<br/>Tarea: ${id_tarea ?? '-'}`;

        if (id_maquina){
            html += `<br/>Máquina: ${id_maquina}`;
        } 
        return html;
    };

    // Actualiza o crea un marcador en el mapa
    const actualizarOCrearMarcador = (id_trabajador, lat, lon, nombre, id_maquina, id_tarea) => {

        const map = mapaRef.current;
        if (!map) return;

        const marcadores = marcadoresRef.current;
        const contenido = crearContenido(nombre, id_trabajador, id_maquina, id_tarea);
        const icono = id_maquina ? tractorIcon : trabajadorIcon;

        // Si el marcador ya existe, actualiza su posición y contenido
        if (marcadores.has(id_trabajador)) {
            const { marcador } = marcadores.get(id_trabajador);
            const iconoActual = marcador.options.icon;

            // Si el icono ha cambiado, recrea el marcador
            if (iconoActual !== icono) {
                marcador.remove();
                const nuevoMarcador = L.marker([lat, lon], { icon: icono })
                    .addTo(map)
                    .bindPopup(contenido);
                marcadores.set(id_trabajador, { marcador: nuevoMarcador, nombre });
            } else {
                marcador.setLatLng([lat, lon]);
                marcador.setPopupContent(contenido);
            }
        } 
        else {

            // Si el marcador no existe, lo crea
            const marcador = L.marker([lat, lon], { icon: icono })
                .addTo(map)
                .bindPopup(contenido);
            marcadores.set(id_trabajador, { marcador, nombre });
        }
    };

    // Escucha ubicaciones y desconexión de trabajadores por socket
    useEffect(() => {

        if (!socket || !mapaRef.current) return;

        //Carga inicial de datos
        cargarUbicacionesIniciales();
        cargarParcelas();

        //Evento: actualización de ubicación
        const handlerUbicacion = ({ id_trabajador, lat, lon, nombre, id_maquina, id_tarea }) => {
            if (!mapaRef.current) return;
            actualizarOCrearMarcador(id_trabajador, lat, lon, nombre, id_maquina, id_tarea);
        };

        // Evento: desconexión de trabajador
        const handlerDesconexion = ({ id_trabajador }) => {
            const marcadores = marcadoresRef.current;
            if (marcadores.has(id_trabajador)) {
                const { marcador } = marcadores.get(id_trabajador);
                marcador.remove();
                marcadores.delete(id_trabajador);
            }
        };

        //Suscripción a eventos del socket
        socket.on("ubicaciones:actualizacion", handlerUbicacion);
        socket.on("trabajador:desconectado", handlerDesconexion);

        //Limpia listeners
        return () => {
            socket.off("ubicaciones:actualizacion", handlerUbicacion);
            socket.off("trabajador:desconectado", handlerDesconexion);
        };
    }, [socket]);

    //Carga inicial de ubicaciones
    const cargarUbicacionesIniciales = async () => {

        try {

            // Petición al backend
            const res = await apiFetch("/ubicacion");

            if (!res.ok) return;
            const ubicaciones = await res.json();


            ubicaciones.forEach(({ nombre, id_trabajador, lat, lon, id_maquina, id_tarea }) => {
                actualizarOCrearMarcador(id_trabajador, lat, lon, nombre, id_maquina, id_tarea);
            });
            
        } catch (err) {
            console.error("Error cargando ubicaciones:", err);
        }
    };

    //Genera un color para representar cada parcela 
    const getColor = (id) => {
        const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6"];
        return colors[id % colors.length];
    };

    //Carga parcelas desde el backend y las dibuja en el mapa
    const cargarParcelas = async () => {

        try{
            const res = await apiFetch("/parcelas");

            if(!res.ok) return;

            const parcelas = await res.json();

            parcelas.forEach((parcela) => {
                const geojson = JSON.parse(parcela.area);

                L.geoJSON(geojson, {
                    style: {
                        color: getColor(parcela.id),
                        fillColor: getColor(parcela.id),
                        fillOpacity: 0.3,
                        weight: 2
                    }
                })
                .bindPopup(`
                    <b>${parcela.nombre}</b><br/>
                    ${parcela.hectareas} ha
                `)
                .addTo(mapaRef.current);
            });
        }
        catch (err){
            console.error("Error cargando las parcelas: ", err);
        }
    }

    //Render del mapa
    return <div ref={containerRef} id="map" className="map" />;
};

export default Mapa;