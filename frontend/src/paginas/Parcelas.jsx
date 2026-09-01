
import { useEffect, useState} from "react";
import { apiFetch } from "../api"; //Función auxiliar para realizar peticiones al backend

// Componentes de Material UI
import { Paper, TextField, Typography, Button, IconButton, Box, Dialog, DialogTitle, DialogContent, DialogActions} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

// Importa el componente MapaParcela para mostrar un mapa donde se pueden dibujar los vértices de la parcela
import MapaParcela from "../componentes/MapaParcela";

/**
 * Pantalla Parcelas
 * 
 * Muestra un listado con las parcelas registradas
 *   El encargado solo ve las parcelas asociadas a él
 */
const Parcelas = () => {

    // Estados
    const [usuario, setUsuario] = useState(null);
    const [parcelas, setParcelas] = useState([]);
    const [error, setError] = useState("");

    const [openDialogParcela, setopenDialogParcela] = useState(false);
    const [parcelaSeleccionada, setParcelaSeleccionada] = useState(null);
    const [modoEdicion, setModoEdicion] = useState(false);


    const [nuevaParcela, setNuevaParcela] = useState({
        nombre: "",
        hectareas: "",
        vertices: [
            { latitud: "", longitud: "" },
            { latitud: "", longitud: "" },
            { latitud: "", longitud: "" }
        ],
        id_encargado: ""
    });

    //Carga el usuario
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("usuario"));
        if (!user) { 
            window.location.href = "/"; 
            return; 
        }
        setUsuario(user);
    }, []);

    //Carga las parcelas
    useEffect(() => {
        if (usuario) {
            obtenerParcelas();
        }
    }, [usuario]);

    //Obtener las parcelas de la base de datos
    const obtenerParcelas = async () => {
        try {
            
            // Petición al backend para obtener las parcelas
            const res = await apiFetch("/parcelas");

            if (!res.ok) {
                throw new Error();
            }
            const data = await res.json();

            // Procesa las parcelas para asegurarse de que el área esté en formato JSON
            const parcelasProcesadas = data.map(p => ({
                ...p,
                area: typeof p.area === "string"
                    ? JSON.parse(p.area)
                    : p.area
            }));

            setParcelas(parcelasProcesadas);
        } catch {
            console.log("Error cargando parcelas");
            setError("Error cargando parcelas");
        }
    };

    //Eliminar parcela
    const eliminarParcela = async (id_parcela) => {
        try{

            // Petición al backend para eliminar la parcela
            const res = await apiFetch(`/parcelas/${id_parcela}`, {
                method: "DELETE"
            });

            if(!res.ok) throw new Error();

            //Recarga la lista tras eliminar
            obtenerParcelas();

        } catch(err){
            alert("Error al eliminar la parcela.");
        }
    };

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, maxWidth: 1400, margin: "0 auto"}}>

            {/* Título de la página */}
            <Typography variant="h5" sx={{ fontSize: { xs: "1.3rem", sm: "1.6rem" } }} gutterBottom>
                Gestión de Parcelas
            </Typography>
        
            {/* Botón para crear parcela */}
            <Paper sx={{p: 2, mb: 3,display: 'flex', gap: 2, flexWrap: "wrap", alignItems: "center", justifyContent: "center"}}>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                    
                        setModoEdicion(false);
                        setParcelaSeleccionada(null);
                        setNuevaParcela({
                            nombre: "",
                            hectareas: "",
                            vertices: [
                                { latitud: "", longitud: "" },
                                { latitud: "", longitud: "" },
                                { latitud: "", longitud: "" }
                            ],
                            id_encargado: ""
                        });

                        setopenDialogParcela(true)
                    }}
                >
                    Nueva parcela
                </Button>
            </Paper>

            {/* Listado de parcelas */}
            {parcelas.length === 0 ? (
                <Typography color="textSecondary">No hay parcelas registradas.</Typography>
            ) : (
                <Box
                    sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))"
                    }}
                >

                {parcelas.map((p) => (

                    <Paper
                        key={p.id}
                        sx={{
                            p: 2,
                            display: "flex", flexDirection: "column", justifyContent: "space-between"
                        }}
                    >
                        <Box>

                            {/* ID de la parcela */}
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    backgroundColor: "grey.100",
                                    border: "1px solid",
                                    borderColor: "grey.300",
                                    px: 1,
                                    py: 0.3,
                                    mb: 1,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: "bold",
                                        color: "text.secondary",
                                        fontFamily: "monospace",
                                    }}
                                >
                                    ID: {p.id}
                                </Typography>
                            </Box>

                            {/*Nombre parcela */}
                            <Typography fontWeight="bold" fontSize="large">
                                {p.nombre}
                            </Typography>

                            {/* Hectáreas */}
                            <Typography>
                                Hectáreas: {p.hectareas}
                            </Typography>

                            {/* Número de vértices del polígono */}
                            <Typography>
                                Vertices: {p.area?.coordinates?.[0]?.length - 1 || 0}
                            </Typography>

                            {/* ID Encargado (solo lo ve el admin) */}
                            {usuario?.rol === "admin" && (
                                <Typography>
                                    ID Encargado: {p.id_encargado}
                                </Typography>
                            )}
                        </Box>

                        {/* Botones para editar y eliminar la parcela */}
                        <Box sx={{ display: "flex", gap: 1, mt: 1.5, justifyContent: "center" }}>

                            {/* Editar */}
                            <IconButton
                                color="primary"
                                onClick={() => {
                                    setParcelaSeleccionada(p);

                                    setNuevaParcela({
                                        nombre: p.nombre || "",
                                        hectareas: p.hectareas || "",
                                        vertices: p.area 
                                            ? p.area.coordinates[0]
                                                .slice(0, -1)
                                                .map(([lon, lat]) => ({
                                                    latitud: lat,
                                                    longitud: lon
                                                }))
                                            : [],
                                        id_encargado: p.id_encargado || ""
                                    });

                                    setModoEdicion(true);
                                    setopenDialogParcela(true);
                                }}
                            >
                                <EditIcon />
                            </IconButton>

                            {/* Eliminar */}
                            <IconButton onClick={() => 
                                {if (window.confirm("¿Seguro que quieres eliminar esta parcela?")){ 
                                    eliminarParcela(p.id)
                                }}}
                                    color="error">
                                <DeleteIcon fontSize="large" />
                            </IconButton>
                        </Box>

                    </Paper>
                ))}

                </Box>
            )}

            {/* Dialog para crear/modificar una parcela */}
            <Dialog open={openDialogParcela} onClose={() => setopenDialogParcela(false)} fullWidth maxWidth="sm">
                
                {/* Título del diálogo */}
                <DialogTitle>{modoEdicion? "Modificar parcela" : "Nueva parcela"}</DialogTitle>

                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    
                    {/* Nombre */}
                    <TextField fullWidth label="Nombre" value={nuevaParcela.nombre} onChange={(e) => setNuevaParcela({ ...nuevaParcela, nombre: e.target.value })} />

                    {/* Hectáreas */}
                    <TextField fullWidth label="Hectáreas" value={nuevaParcela.hectareas} onChange={(e) => setNuevaParcela({ ...nuevaParcela, hectareas: e.target.value })} />

                    {/* Información sobre como introducir vértices */}
                    <Typography variant="subtitle1" sx={{ mt: 2 }}>
                        Define los vértices de la parcela
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        Puedes introducir las coordenadas manualmente o dibujar la parcela directamente en el mapa.
                    </Typography>

                    {/* Vértices */}
                    {nuevaParcela.vertices.map((vertice, index) => (
                        <Box key={index} sx={{display: "flex", gap: 1, alignItems: "center"}}>
                            
                            {/* Latitud */}
                            <TextField
                                label={`Latitud ${index + 1}`}
                                value={vertice.latitud}
                                onChange={(e) => {
                                    const vertices = [...nuevaParcela.vertices];
                                    vertices[index].latitud = e.target.value;

                                    setNuevaParcela({
                                        ...nuevaParcela,
                                        vertices
                                    });
                                }}
                            />

                            {/* Longitud */}
                            <TextField
                                label={`Longitud ${index + 1}`}
                                value={vertice.longitud}
                                onChange={(e) => {
                                    const vertices = [...nuevaParcela.vertices];
                                    vertices[index].longitud = e.target.value;

                                    setNuevaParcela({
                                        ...nuevaParcela,
                                        vertices
                                    });
                                }}
                            />

                            {nuevaParcela.vertices.length > 3 && (
                                <IconButton
                                    color="error"
                                    onClick={() => {
                                        const vertices =
                                            nuevaParcela.vertices.filter(
                                                (_, i) => i !== index
                                            );

                                        setNuevaParcela({
                                            ...nuevaParcela,
                                            vertices
                                        });
                                    }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </Box>
                    ))}

                    {/* Botón para añadir vértice */}
                    <Button
                        variant="outlined"
                        onClick={() =>
                            setNuevaParcela({
                                ...nuevaParcela,
                                vertices: [
                                    ...nuevaParcela.vertices,
                                    { latitud: "", longitud: "" }
                                ]
                            })
                        }
                    >
                        Añadir vértice
                    </Button>

                    {/* Mapa para dibujar la parcela */}
                    <Box
                        sx={{
                            width: "100%",
                            height: "400px",
                        }}
                    >
                        <MapaParcela 
                            vertices={nuevaParcela.vertices}
                            setVertices={(vertices) =>
                                setNuevaParcela(prev => ({
                                    ...prev,
                                    vertices
                                }))
                            }
                        />
                    </Box>

                    {/* El admin puede cambiar el id del encargado */}
                    {usuario?.rol === "admin" && (
                        <TextField 
                            fullWidth 
                            label="ID Encargado" 
                            value={nuevaParcela.id_encargado} 
                            onChange={(e) => setNuevaParcela({ ...nuevaParcela, id_encargado: e.target.value })} 
                        />
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setopenDialogParcela(false)}>Cancelar</Button>
                    <Button variant="contained"
                        onClick={async () => {
                            try {

                            if (!nuevaParcela.nombre || !nuevaParcela.hectareas || nuevaParcela.vertices.length < 3) {
                                alert("Faltan datos");
                                return;
                            }

                            const verticesValidos = nuevaParcela.vertices.every(v => v.latitud && v.longitud);
                            if (!verticesValidos) {
                                alert("Todos los vértices deben tener latitud y longitud");
                                return;
                            }

                            let res;
                            if(modoEdicion){
                                res = await apiFetch(`/parcelas/${parcelaSeleccionada.id}`, {
                                    method: "PATCH",
                                    body: JSON.stringify(nuevaParcela)
                                });
                            }
                            else{
                                res = await apiFetch("/parcelas/", {
                                    method: "POST",
                                    body: JSON.stringify(nuevaParcela)
                                });
                            }
                            

                            const data = await res.json();

                            if (!res.ok) {
                                console.log("ERROR:", data); 
                                alert(data.error || "Error al crear parcela");
                                return;
                            }

                            obtenerParcelas();

                            setopenDialogParcela(false);
                        
                            setNuevaParcela({
                                nombre: "",
                                hectareas: "",
                                vertices: [],
                                id_encargado: ""
                            });
                                
                        } catch (err) {
                            console.log(err);
                            alert(modoEdicion? "Error al modificar la parcela" : "Error al crear parcela");
                        }
                        }}
                    
                    >{modoEdicion? "Guardar cambios" : "Crear"}</Button>
                </DialogActions>
            </Dialog>


        </Box>
    );
};

export default Parcelas;