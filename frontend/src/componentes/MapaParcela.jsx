import { useEffect, useRef } from "react";  

// Componentes necesarios de React-Leaflet para crear y configurar el mapa
import { MapContainer, TileLayer, useMap } from "react-leaflet";

// Estilos de Leaflet y Leaflet-Geoman
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

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

// Componente para configurar las herramientas de dibujo y edición del mapa usando Leaflet-Geoman
const ConfigurarMapa = ({ setVertices, polygonRef }) => {
    
    //Obtiene la instancia del mapa
    const map = useMap();

    useEffect(() => {

        const timer = setTimeout(() => {

            // Fuerza a recalcular el tamaño del mapa
            map.invalidateSize();

            // Comprueba si Geoman está disponible en el mapa
            if (!map.pm) {
                console.error("Geoman NO está disponible");
                return;
            }

            console.log("Geoman disponible");

            // Añade al mapa los controles de Geoman para dibujar, editar y eliminar polígonos
            map.pm.addControls({
                position: "topleft",
                drawPolygon: true,
                drawPolyline: false,
                drawMarker: false,
                drawCircle: false,
                drawCircleMarker: false,
                drawRectangle: false,
                drawText: false,
                editMode: true,
                dragMode: false,
                cutPolygon: false,
                removalMode: true
            });

            // Función que se ejecuta cuando se termina de dibujar un polígono
            const handleCreate = (e) => {

                // Solo procesa figuras de tipo polígono
                if (e.shape !== "Polygon") {
                    return;
                }

                // Referencia al polígono recién creado
                const polygon = e.layer;

                // Guarda referencia al polígono
                polygonRef.current = polygon;

                // Obtener los puntos del polígono
                const latLngs = polygon.getLatLngs()[0];

                // Convertirlos al formato que se usa en Parcelas.jsx
                const nuevosVertices = latLngs.map((punto) => ({
                    latitud: punto.lat,
                    longitud: punto.lng
                }));

                console.log("Vértices:", nuevosVertices);

                // Actualizar nuevaParcela.vertices
                setVertices(nuevosVertices);

                //Escucha las modificaciones realizadas sobre el polígono.
                polygon.on("pm:edit", () => {

                    //Obtiene las nuevas coordenadas del polígono tras la edición
                    const nuevosLatLngs = polygon.getLatLngs()[0];

                    //Convierte las coordenadas al formato que se usa en Parcelas.jsx
                    const verticesActualizados = nuevosLatLngs.map((punto) => ({
                        latitud: punto.lat,
                        longitud: punto.lng
                    }));

                    console.log("Vértices modificados:", verticesActualizados);

                    //Actualiza el estado con los nuevos vértices
                    setVertices(verticesActualizados);
                });
            };

            // Registra el evento que se ejecuta cuando Geoman crea un nuevo polígono
            map.on("pm:create", handleCreate);

            // Función que se ejecuta cuando se elimina el polígono
            const handleRemove = (e) => {

                //Comprueba si el polígono eliminado es el que se estaba editando
                if (e.layer === polygonRef.current) {

                    polygonRef.current = null;

                    setVertices([]);
                }
            };

            //Registra el evento que se ejecuta cuando Geoman elimina un polígono
            map.on("pm:remove", handleRemove);

            // Limpieza al desmontar
            return () => {
                map.off("pm:create", handleCreate);
                map.off("pm:remove", handleRemove);

                if (map.pm) {
                    map.pm.removeControls();
                }
            };

        }, 500);

        return () => clearTimeout(timer);

    }, [map, setVertices, polygonRef]);

    return null;
};


const MapaParcela = ({ vertices, setVertices }) => {

    // Referencia al polígono dibujado en el mapa
    const polygonRef = useRef(null);

    return (
        <MapContainer
            // Coordenadas iniciales del mapa y nivel de zoom
            center={[latitud, longitud]}
            zoom={13}
            style={{
                height: "400px",
                width: "100%",
                marginTop: "10px"
            }}
        >

            {/* Capa base del mapa */}
            <TileLayer
                attribution="&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />

            {/* Configuración de herramientas de dibujo y edición */}
            <ConfigurarMapa 
                setVertices={setVertices}
                polygonRef={polygonRef}
            />

        </MapContainer>
    );
};

export default MapaParcela;