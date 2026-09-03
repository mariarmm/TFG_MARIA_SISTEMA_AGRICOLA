import { useEffect, useState} from "react"; //Importa useState y useEffect para manejar el estado y los efectos secundarios
import { apiFetch, manejarRespuesta } from "../api"; //Funciones auxiliares para realizar peticiones al backend y manejar las respuestas

//Importa componentes de Material UI
import { Chip, Paper, IconButton, TextField, MenuItem, Box, Typography, Button, ButtonGroup, Stack, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

// Importa el hook de traducción
import { useTranslation } from "react-i18next";

// Importa el hook useSocket para manejar la conexión WebSocket
import { useSocket } from "../contextos/SocketContext";

// Importa el hook useBackgroundGeolocation para manejar la geolocalización en segundo plano
import { useBackgroundGeolocation } from "../componentes/useBackgroundGeolocation";

// Importa el componente TareaDialog para crear o modificar tareas
import TareaDialog from "../componentes/TareaDialog";

// Importa BackgroundGeolocation para obtener la ubicación del trabajador
import BackgroundGeolocation from "@transistorsoft/capacitor-background-geolocation";



const Tareas = () => {  

    // Estados
    const [usuario, setUsuario] = useState(null);
    const [tareas, setTareas] = useState([]);
    const [trabajadores, setTrabajadores] = useState([]);
    const [parcelas, setParcelas] = useState([]);
    const [maquinas, setMaquinas] = useState([]);
    const [error, setError] = useState("");
    const [estadoFichaje, setEstadoFichaje] = useState(null);
    const [dialog, setDialog] = useState({open: false, tarea: null});
    const [sesionActiva, setSesionActiva] = useState(null);

    // Importa el hook de traducción
    const { t } = useTranslation();
    
    const [dialogo, setDialogo] = useState({
        abierto: false,
        id_tarea: null,
        nuevoEstado: ""
    });

    //Estados para los filtros
    const [filtroFechaDesde, setFiltroFechaDesde] = useState(new Date().toISOString().split('T')[0]);
    const [filtroFechaHasta, setFiltroFechaHasta] = useState(new Date().toISOString().split('T')[0]);

    const [filtroTrabajador, setFiltroTrabajador] = useState("");
    const [filtroParcela, setFiltroParcela] = useState("");
    const [filtroMaquina, setFiltroMaquina] = useState("");

    const [filtroEstado, setFiltroEstado] = useState("en_proceso");

    // Importa el hook useSocket para manejar la conexión WebSocket
    const socket = useSocket();

    // Importa el hook useBackgroundGeolocation para manejar la geolocalización en segundo plano
    const { iniciar, detener } = useBackgroundGeolocation();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("usuario"));
        if (!user) { 
            window.location.href = "/"; 
            return; 
        }
        setUsuario(user);
    }, []);

    //Cada vez que se cambie la fecha o el estado, se piden las tareas
    useEffect(() => {
        if (usuario){ 
            obtenerTareas();

            if(usuario.rol !== "trabajador"){
                obtenerTrabajadores();
                obtenerParcelas();
                obtenerMaquinas();
            } 
        }
    }, [filtroFechaDesde, filtroFechaHasta, filtroTrabajador, filtroParcela, filtroMaquina, filtroEstado, usuario]);

    // Si el usuario es un trabajador, se obtiene el estado del fichaje y la sesión activa al cargar la página
    useEffect(() => {
        if (usuario?.rol === "trabajador") {
            const cargarDatos = async () => {
                await obtenerEstadoFichaje();
                await obtenerSesionActiva();
            };

            cargarDatos();
        }
    }, [usuario]);

    // Se suscribe a los eventos de actualización de tareas a través del socket
    useEffect(() => {
        if (!socket) return;

        socket.on("tareas_actualizadas", obtenerTareas);

        return () => {
            socket.off("tareas_actualizadas", obtenerTareas);
        };
    }, [socket, usuario]);


    // Funciones para obtener datos del backend
    const obtenerTareas = async () => {
        try {

            //Se construye la URL con parámetros
            let params = `?fechaDesde=${filtroFechaDesde}`;
            if (filtroFechaHasta) params += `&fechaHasta=${filtroFechaHasta}`
            if (filtroTrabajador) params += `&id_trabajador=${filtroTrabajador}`;
            if (filtroParcela) params += `&id_parcela=${filtroParcela}`;
            if (filtroMaquina) params += `&id_maquina=${filtroMaquina}`;
            if (filtroEstado) params += `&estado=${filtroEstado}`;

            // Petición al backend para obtener las tareas con los filtros aplicados
            const res = await apiFetch(`/tareas${params}`);
            const data = await manejarRespuesta(res);

            setTareas(data);

        } catch (err) {
            setError(err.message);
        }
    };

    // Obtiene el estado del fichaje del trabajador
    const obtenerEstadoFichaje = async () => {

        try{
            // Petición al backend para obtener el estado del fichaje
            const res = await apiFetch("/fichaje/");
            const data = await manejarRespuesta(res);
            
            setEstadoFichaje(data);
        } catch (err) {
            console.error("Error al obtener el estado del fichaje:", err.message);
        }
    };

    // Obtiene la lista de trabajadores
    const obtenerTrabajadores = async () => {

        try {
            // Petición al backend para obtener la lista de trabajadores
            const res = await apiFetch("/usuarios?rol=trabajador");
            const data = await manejarRespuesta(res);

            setTrabajadores(data);

        } catch (err) {
            console.log(err.message);
        }
    };

    //Obtiene la sesión activa de un trabajador
    const obtenerSesionActiva = async () => {
        try {

            // Petición al backend para obtener la sesión activa del trabajador
            const res = await apiFetch("/sesion-trabajo/activa");

            // Si no existe ninguna sesión activa, se actualiza
            if (res.status === 404) {
                setSesionActiva(null);
                return;
            }

            const data = await manejarRespuesta(res);
            setSesionActiva(data || null);
            
        } catch (err) {
            console.error("Error al obtener sesión activa:", err);
        }
    };

    // Obtiene la lista de parcelas
    const obtenerParcelas = async () => {
        try {
            // Petición al backend para obtener la lista de parcelas
            const res = await apiFetch("/parcelas");
            const data = await manejarRespuesta(res);

            setParcelas(data);

        } catch (err) {
            console.log(err.message);
        }
    };

    // Obtiene la lista de máquinas
    const obtenerMaquinas = async () => {
        try {

            // Petición al backend para obtener la lista de máquinas
            const res = await apiFetch("/maquinas");
            const data = await manejarRespuesta(res);

            setMaquinas(data);

        } catch (err) {
            console.log(err.message);
        }
    };

    // Cambia el estado de una tarea (pendiente, en_proceso, completada)
    const cambiarEstado = async (id_tarea, nuevoEstado) => {
        try {

            // Petición al backend para cambiar el estado de la tarea
            const res = await apiFetch(`/tareas/${id_tarea}/estado`, {
                method: "PATCH",
                body: JSON.stringify({estado: nuevoEstado })
            })

            await manejarRespuesta(res);

            // Obtener y enviar una ubicación actualizada
            if (usuario?.rol === "trabajador") {
                try {
                    await BackgroundGeolocation.getCurrentPosition({
                        samples: 1,
                        persist: true
                    });
                } catch (error) {
                    console.error("Error obteniendo ubicación al cambiar estado de tarea:", error);
                }
            }

            await obtenerTareas();
            await obtenerSesionActiva();

        } catch (err){
            console.error("Error al cambiar estado:", err);
            alert(err?.message || "Error al cambiar el estado de la tarea");
            return false;
        }
    };

    // Elimina una tarea por su ID
    const eliminarTarea = async (id_tarea) => {
        try {

            // Petición al backend para eliminar la tarea
            const res = await apiFetch(`/tareas/${id_tarea}`, {
                method: "DELETE",
            })

            await manejarRespuesta(res);

            await obtenerTareas();
        } catch (err) {
            alert(err.message);
        }
    };

    // Reanuda una tarea que estaba en proceso pero que no tiene sesión activa
    const reanudarTarea = async (tarea) => {
        try {

            // Petición al backend para iniciar una sesión de trabajo para la tarea
            const res = await apiFetch(`/sesion-trabajo/iniciar`, {
                method: "POST",
                body: JSON.stringify({
                    id_tarea: tarea.id,
                    id_maquina: tarea.id_maquina
                })
            });

            const data = await manejarRespuesta(res);

            console.log("SESIÓN REANUDADA:", data);

            setSesionActiva(data);

            // Obtener ubicación actualizada
            await BackgroundGeolocation.getCurrentPosition({
                samples: 1,
                persist: true
            });

            await obtenerSesionActiva();

        } catch (err) {
            console.error("Error al reanudar tarea:", err);
        }
    };

    // Formatea la fecha
    const formatearFecha = (fecha) => {
        if (!fecha) return '-';
        
        const [fechaParte, horaParte] = fecha.split(" ");
        const [anio, mes, dia] = fechaParte.split("-");
        
        return horaParte 
            ? `${dia}/${mes}/${anio} ${horaParte}`
            : `${dia}/${mes}/${anio}`;
    };

        
    return (
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, maxWidth: 1400, margin: "0 auto" }}>

            {/* BOTÓN PARA CONTROLAR EL FICHAJE */}
            {usuario?.rol === "trabajador" && (
                <Box sx={{ mb: 2 }}>
                    
                    {/* Si NO ha fichado --> BOTÓN INICIAR JORNADA */}
                    {!estadoFichaje && (
                        <Button
                            aria-label = "boton_jornada"
                            variant="contained" //Botón relleno
                            color="primary"     //Color del tema principal
                            
                            onClick={async () => {
                                try {
                                    const res = await apiFetch("/fichaje/", {
                                        method: "POST"
                                    });

                                    const data = await manejarRespuesta(res);

                                    console.log("FICHAJE INICIADO:", data);

                                    // Actualizamos inmediatamente el estado de React
                                    setEstadoFichaje(data);

                                    // Iniciamos el seguimiento de ubicación
                                    await iniciar();

                                    await obtenerSesionActiva();

                                } catch (err) {
                                    console.error("Error al iniciar la jornada:", err);
                                }
                            }}
                        >
                            {t("iniciar_jornada")}
                        </Button>
                    )}

                    {/* Si ya ha fichado el inicio pero no el fin --> BOTÓN FINALIZAR JORNADA */}
                    {estadoFichaje && !estadoFichaje.fin && (
                        <Button
                            aria-label = "boton_finalizar_jornada"
                            variant="contained"
                            color="error"
                            
                            onClick={async () => {
                                try {
                                    const res = await apiFetch("/fichaje/finalizar", { method: "POST" });
                                    if (!res.ok) throw new Error("Error al finalizar fichaje");

                                    const data = await manejarRespuesta(res);

                                    console.log("FICHAJE INICIADO:", data);

                                    // Actualizamos inmediatamente el estado de React
                                    setEstadoFichaje(data);

                                    await detener();  // stop() + removeListeners()
                                } catch (err) {
                                    console.error(err);
                                }
                            }}
                        >
                            {t("finalizar_jornada")}
                        </Button>
                    )}

                    {/* Ya ha fichado la salida --> Mensaje jornada finalizada */}
                    {estadoFichaje && estadoFichaje.fin && (
                        <Typography color="success.main" fontWeight="bold">
                            {t("jornada_finalizada")}
                        </Typography>
                    )}

                </Box>
            )}

            {/* Título Gestión Tareas */}
            <Typography variant="h5" sx={{ fontSize: { xs: "1.3rem", sm: "1.6rem" } }} gutterBottom>
                {t("gestionar_tareas")}
            </Typography>


            {/* PANEL DE FILTROS (solo para admin y encargado) */}
            {usuario?.rol !== "trabajador" && (
                <Paper
                    sx={{
                        p: 2,
                        mb: 3,
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "center"   
                    }}
                >

                    {/* Filtros de fecha */}
                    <TextField
                        type="date"
                        label= {t("fecha_desde")}
                        value={filtroFechaDesde}
                        onChange={(e) => setFiltroFechaDesde(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        disabled={filtroEstado === "pendiente"}
                        sx={{ width: { xs: "100%", sm: 200 } }}
                    />

                    <TextField
                        type="date"
                        label= {t("fecha_hasta")}
                        value={filtroFechaHasta}
                        onChange={(e) => setFiltroFechaHasta(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        disabled={filtroEstado === "pendiente"}
                        sx={{ width: { xs: "100%", sm: 200 } }}
                    />


                    {/* Selector de estado */}
                    <TextField
                        select
                        label={t("estado")}
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 180 } }}
                    >
                        <MenuItem value="en_proceso">{t("en_proceso")}</MenuItem>
                        <MenuItem value="pendiente">{t("pendiente")}</MenuItem>
                        <MenuItem value="completada">{t("completada")}</MenuItem>
                    </TextField>


                    {/* Selector de trabajador */}
                    <TextField
                        select
                        label={t("trabajador")}
                        value={filtroTrabajador}
                        onChange={(e) => setFiltroTrabajador(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 180 } }}
                    >
                        <MenuItem value="">Todos</MenuItem>

                        {trabajadores.map((trabajador) => (
                            <MenuItem
                                key={trabajador.id}
                                value={trabajador.id}
                            >
                                {trabajador.nombre}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Selector de parcela */}
                    <TextField
                        select
                        label={t("parcela")}
                        value={filtroParcela}
                        onChange={(e) => setFiltroParcela(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 180 } }}
                    >
                        <MenuItem value="">Todas</MenuItem>

                        {parcelas.map((parcela) => (
                            <MenuItem
                                key={parcela.id}
                                value={parcela.id}
                            >
                                {parcela.nombre}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Selector de maquina */}
                    <TextField
                        select
                        label={t("maquina")}
                        value={filtroMaquina}
                        onChange={(e) => setFiltroMaquina(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 180 } }}
                    >
                        <MenuItem value="">Todas</MenuItem>

                        {maquinas.map((maquina) => (
                            <MenuItem
                                key={maquina.id}
                                value={maquina.id}
                            >
                                {maquina.nombre}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Botón de NUEVA TAREA */}
                    <Button 
                        variant="contained"
                        color="primary"
                        aria-label="nueva_tarea"
                        onClick={() => setDialog({open: true, tarea: null})}
                    >
                        {t("nueva_tarea")}
                    </Button>
                </Paper>
            )}

            {/* Filtro para el trabajador: Tareas en proceso, pendientes o completadas */}
            {usuario?.rol === "trabajador" && (

                <Paper sx={{ p: 2, mb: 2 }}>
                    <ButtonGroup fullWidth variant="contained">
                        <Button
                            aria-label="tareas_proceso"
                            color={filtroEstado === "en_proceso" ? "primary" : "inherit"}
                            onClick={() => setFiltroEstado("en_proceso")}
                        >
                            {t("en_proceso")}
                        </Button>

                        <Button
                            aria-label="tareas_pendientes" color={filtroEstado === "pendiente" ? "warning" : "inherit"}
                            onClick={() => setFiltroEstado("pendiente")}
                        >
                            {t("pendiente")}
                        </Button>

                        <Button
                            aria-label="tareas_completadas"
                            color={filtroEstado === "completada" ? "success" : "inherit"}
                            onClick={() => setFiltroEstado("completada")}
                        >
                            {t("completada")}
                        </Button>

                    </ButtonGroup>
                </Paper>
            )}

            {/* Muestra las tareas */}
            {tareas.length === 0 ? (
                    <Typography color="textSecondary">{t("no_tareas")}</Typography>
                ) :
            
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>

                {/* Para cada tarea */}
                {tareas.map(tarea => (
                    <Paper key={tarea.id} sx={{ p: 2, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <Box sx={{ mb: 1 }}>

                            {/* Identificador */}
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    backgroundColor: "grey.100",
                                    border: "1px solid",
                                    borderColor: "grey.300",
                                    // borderRadius: 1,
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
                                    ID: {tarea.id}
                                </Typography>
                            </Box>

                            {/* Nombre */}
                            <Typography
                                fontWeight="bold"
                                variant="h6"
                                sx={{ wordBreak: "break-word" }}
                            >
                               {tarea.nombre.toUpperCase()}
                            </Typography>

                            {/* Estado */}
                            <Chip 
                                label={t(tarea.estado).toUpperCase()} 
                                size="small"
                                sx={{ borderRadius: 0,
                                    //  ml: 1, flexShrink: 0
                                    mb:1.5
                                    }}
                                color={
                                    tarea.estado === "completada" ? "success"
                                        : tarea.estado === "en_proceso" ? "info"
                                        : "warning"
                                }
                            />

                            {/* Descripción*/}
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, wordBreak: "break-word" }}>
                                {tarea.descripcion}
                            </Typography>

                            {/* Más información */}
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>

                                <Typography variant="body2" display="block" color="text.secondary">{t("fecha_planificada")}: {formatearFecha(tarea.fecha_planificada)}</Typography>
                                <Typography variant="body2" display="block" color="text.secondary">{t("inicio")}: {formatearFecha(tarea.fecha_ini)}</Typography>
                                <Typography variant="body2" display="block" color="text.secondary">{t("fin")}: {formatearFecha(tarea.fecha_fin)}</Typography>
                                <Typography variant="body2" display="block" color="text.secondary">{t("parcela")}: {tarea.nombre_parcela || '-'}</Typography>
                                <Typography variant="body2" display="block" color="text.secondary">{t("maquina")}: {tarea.nombre_maquina || '-'}</Typography>
                                {usuario?.rol !== "trabajador" && (
                                    <Typography variant="body2" display="block" color="primary">{t("trabajador")}: {tarea.nombre_trabajador || '-'}</Typography>
                                )}
                            </Box>
                        </Box>


                        {/* BOTONES PARA CAMBIAR DE ESTADO (solo le aparecen al trabajador durante su jornada) */}
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mt: 0.5 }}>

                            {usuario?.rol === "trabajador" && estadoFichaje && !estadoFichaje.fin && (
                                <>

                                    {/* TAREA PENDIENTE */}
                                    {tarea.estado === "pendiente" && (
                                        <IconButton 
                                            aria-label="boton_iniciar_tarea"
                                            disabled = {sesionActiva && sesionActiva.id_tarea !== tarea.id}
                                            onClick={() => setDialogo({ abierto: true, id_tarea: tarea.id, nuevoEstado: "en_proceso" })}
                                        >
                                            <PlayArrowIcon fontSize="large" color="primary" />
                                        </IconButton>
                                    )}

                                    {/* TAREA EN PROCESO */}
                                    {tarea.estado === "en_proceso" && (
                                        <>

                                            {/* Tiene una sesión activa para esa tarea */}
                                            {sesionActiva && sesionActiva?.id_tarea === tarea.id && (
                                                <IconButton 
                                                    aria-label="boton_finalizar_tarea"
                                                    onClick={() => setDialogo({ abierto: true, id_tarea: tarea.id, nuevoEstado: "completada" })}
                                                >
                                                    <CheckCircleIcon fontSize="large" color="success" />
                                                </IconButton>
                                            )}

                                            {/* No tiene sesión activa para esa tarea */}
                                            {!sesionActiva && (
                                                <IconButton
                                                    aria-label="boton_reanudar_tarea"
                                                    onClick={() =>
                                                        reanudarTarea(tarea)
                                                    }
                                                >
                                                    <PlayArrowIcon
                                                        fontSize="large"
                                                        color="primary"
                                                    />
                                                </IconButton>
                                            )}
                                        </>
                                    )}
                                </>
                            )}

                            {/* BOTÓN PARA MODIFICAR Y ELIMINAR TAREA (solo para el encargado y admin, y solo si la tarea no está completada) */}
                            {usuario?.rol !== "trabajador" && tarea.estado !== "completada" && (
                                <>
                                    <IconButton onClick={() => {
                                        setDialog({open: true, tarea: tarea});
                                    }} >
                                        <EditIcon fontSize="0.5rem" />
                                    </IconButton>

                                    <IconButton aria-label="Eliminar tarea" onClick={() => 
                                        {if (window.confirm("¿Seguro que quieres eliminar esta tarea?")){ 
                                                eliminarTarea(tarea.id)
                                            }}}
                                                color="error">
                                            <DeleteIcon fontSize="large" />
                                    </IconButton>
                                </>
                            )}
                        </Box>
                    </Paper>
                ))
                }
                </Box>
            }
            
            <TareaDialog
                open={dialog.open}
                tarea={dialog.tarea}
                onClose={() => setDialog({open: false, tarea: null})}
                onSuccess={obtenerTareas}
                trabajadores={trabajadores}
                parcelas={parcelas}
                maquinas={maquinas}
            />

            {/* DIALOG para confirmar el cambio de estado de la tarea */}
            <Dialog open={dialogo.abierto} onClose={() => setDialogo({ ...dialogo, abierto: false })} fullWidth maxWidth="xs">
                
                {/* Título del diálogo */}
                <DialogTitle> Cambio de estado </DialogTitle>
                
                {/* Contenido del diálogo */}
                <DialogContent>
                    <Typography>
                        {dialogo.nuevoEstado === "completada"
                            ? t("confirmar_completar")
                            : t("confirmar_inicio")
                    }
                    </Typography>
                </DialogContent>
                
                <DialogActions>
                    <Button onClick={() => setDialogo({ ...dialogo, abierto: false })}>Cancelar</Button>
                    
                    <Button
                        aria-label="cambiar_estado"
                        variant="contained"
                        color={dialogo.nuevoEstado === "completada" ? "success" : "primary"}
                        onClick={async () => {
                            await cambiarEstado(dialogo.id_tarea, dialogo.nuevoEstado);
                            setDialogo({ ...dialogo, abierto: false });
                        }}
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default Tareas;