import { useEffect, useState } from "react";
import { apiFetch } from "../api";  //Función auxiliar para realizar peticiones al backend


//Componentes de Material UI
import { Paper, TextField, MenuItem, Box, Typography, Button, ButtonGroup, IconButton, Dialog, DialogTitle, DialogContent, DialogActions} from '@mui/material';
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";

// Importa el componente FormularioUsuario para crear y editar usuarios
import FormularioUsuario from "../componentes/FormularioUsuario";

const Equipo = () => {

    //Estados
    const [usuario, setUsuario] = useState(null);
    const [vista, setVista] = useState("usuarios");

    // Usuarios
    const [usuarios, setUsuarios] = useState([]);
    const [filtroRol, setFiltroRol] = useState("trabajador");
    const [openCrear, setOpenCrear] = useState(false);
    const [openEditar, setOpenEditar] = useState(false);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [modoEdicion, setModoEdicion] = useState(false);

    // Máquinas
    const [maquinas, setMaquinas] = useState([]);
    const [encargados, setEncargados] = useState([]);
    const [filtroEncargado, setFiltroEncargado] = useState("");
    const [openDialogMaquina, setOpenDialogMaquina] = useState(false);
    const [maquinaSeleccionada, setMaquinaSeleccionada] = useState(null);
    const [modoEdicionMaquina, setModoEdicionMaquina] = useState(false);
    const [nuevaMaquina, setNuevaMaquina] = useState({ nombre: "", descripcion: "", id_encargado: "" });

    //Se ejecuta cuando el componente se monta, para obtener el usuario del localStorage y redirigir si no hay usuario
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("usuario"));

        if (!user) {
            window.location.href = "/";
            return;
        }

        setUsuario(user);
    }, []);

    //Se ejecuta cuando cambia el usuario, la vista o los filtros, para obtener los datos correspondientes
    useEffect(() => {
        if (!usuario) return;

        if (vista === "usuarios") {
            obtenerUsuarios();
        } else {
            obtenerMaquinas();
            if (usuario.rol === "admin") obtenerEncargados();
        }

    }, [usuario, vista, filtroRol, filtroEncargado]);


    //Obtiene los usuarios de la base de datos
    const obtenerUsuarios = async () => {

        try{

            //Parametros de la petición según el rol del usuario y el filtro seleccionado
            let params ="";
            if(usuario?.rol === "admin"){
                params += `?rol=${filtroRol}`;
            }
            else{
                params += `?rol=trabajador`;
            }

            //Petición al backend para obtener los usuarios
            const res = await apiFetch(`/usuarios${params}`);

            const data = await res.json();
            setUsuarios(data);

        } catch {
            console.log("Error cargando usuarios")
        }
    }

    //Elimina un usuario de la base de datos
    const eliminarUsuario = async (id_usuario) => {

        try{

            //Petición al backend para eliminar el usuario
            const res = await apiFetch(`/usuarios/${id_usuario}`, {
                method: "DELETE"
            });

            if(!res.ok) throw new Error();

            //Recarga los usuarios
            obtenerUsuarios();

        } catch(err){
            alert("Error al eliminar el usuario.");
        }
    };

    // Obtiene las máquinas de la base de datos
    const obtenerMaquinas = async () => {
        try {

            //Filtro por encargado
            let params = "";
            if (filtroEncargado){
                params += `?id_encargado=${filtroEncargado}`;
            } 

            //Petición al backend para obtener las máquinas
            const res = await apiFetch(`/maquinas${params}`);

            const data = await res.json();
            setMaquinas(data);

        } catch { 
            console.log("Error cargando máquinas"); 
        }
    };

    // Obtiene los encargados de la base de datos (solo para admin)
    const obtenerEncargados = async () => {

        try {
            //Petición al backend para obtener los encargados
            const res = await apiFetch("/usuarios?rol=encargado");

            const data = await res.json();
            setEncargados(data);
        } catch { 
            console.log("Error cargando encargados"); 
        }
    };

    // Elimina una máquina de la base de datos
    const eliminarMaquina = async (id) => {
        try {
            //Petición al backend para eliminar la máquina
            const res = await apiFetch(`/maquinas/${id}`, { method: "DELETE" });

            if (!res.ok) throw new Error();
            obtenerMaquinas();
        } catch { 
            alert("Error al eliminar la máquina."); 
        }
    };

    // Abre el diálogo para crear una nueva máquina
    const abrirCrearMaquina = () => {
        setModoEdicionMaquina(false);
        setMaquinaSeleccionada(null);
        setNuevaMaquina({ nombre: "", descripcion: "", id_encargado: "" });
        setOpenDialogMaquina(true);
    };

    // Abre el diálogo para editar una máquina existente
    const abrirEditarMaquina = (m) => {
        setMaquinaSeleccionada(m);
        setNuevaMaquina({ nombre: m.nombre || "", descripcion: m.descripcion || "", id_encargado: m.id_encargado || "" });
        setModoEdicionMaquina(true);
        setOpenDialogMaquina(true);
    };

    // Guarda una nueva máquina o actualiza una existente en la base de datos
    const guardarMaquina = async () => {

        try {

            if (!nuevaMaquina.nombre) { 
                alert("Faltan datos"); 
                return; 
            }

            //Petición al backend para crear o actualizar la máquina
            const res = await apiFetch(
                modoEdicionMaquina ? `/maquinas/${maquinaSeleccionada.id}` : "/maquinas/",
                { method: modoEdicionMaquina ? "PATCH" : "POST", body: JSON.stringify(nuevaMaquina) }
            );

            const data = await res.json();
            if (!res.ok) { 
                alert(data.error || "Error al guardar máquina"); 
                return; 
            }
            
            obtenerMaquinas();
            setOpenDialogMaquina(false);
            setNuevaMaquina({ nombre: "", descripcion: "", id_encargado: "" });
        } catch { 
            alert("Error al guardar la máquina"); 
        }
    };



   return (

        <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, maxWidth: 1400, margin: "0 auto" }}>

            {/* Título */}
            <Typography variant="h5" sx={{ fontSize: { xs: "1.3rem", sm: "1.6rem" }, mb: 2 }}>
                Gestión de Equipo
            </Typography>

            {/* Selector usuarios / máquinas */}
            <ButtonGroup fullWidth variant="contained" sx={{ mb: 3 }}>
                <Button
                    color={vista === "usuarios" ? "primary" : "inherit"}
                    onClick={() => setVista("usuarios")}
                >
                    Usuarios
                </Button>
                <Button
                    color={vista === "maquinas" ? "primary" : "inherit"}
                    onClick={() => setVista("maquinas")}
                >
                    Maquinaria
                </Button>
            </ButtonGroup>

            {/* ── VISTA USUARIOS ── */}
            {vista === "usuarios" && (
                <>
                    <Paper sx={{ p: 2, mb: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", justifyContent: "center"}}>
                        
                        {/* Selector de rol */}
                        {usuario?.rol === "admin" && (
                            <TextField
                                select
                                label="Rol"
                                value={filtroRol}
                                onChange={(e) => setFiltroRol(e.target.value)}
                                sx={{ minWidth: 160 }}
                            >
                                <MenuItem value="trabajador">Trabajador</MenuItem>
                                <MenuItem value="encargado">Encargado</MenuItem>
                                <MenuItem value="admin">Administrador</MenuItem>
                            </TextField>
                        )}

                        {/* Botón para crear nuevo usuario */}
                        <Button variant="contained" onClick={() => setOpenCrear(true)}>
                            {usuario?.rol === "encargado" ? "Nuevo trabajador" : "Nuevo usuario"}
                        </Button>
                    </Paper>

                        {/* Lista de usuarios */}
                        {usuarios.length === 0 ? (
                            <Typography color="textSecondary">No hay usuarios registrados.</Typography>
                        ) : (
                            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                             {usuarios.map(u => (
                                <Paper key={u.id} sx={{ p: 2, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                    <Box>

                                        {/* ID del usuario */}
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
                                                ID: {u.id}
                                            </Typography>
                                        </Box>

                                        {/* Nombre del usuario */}
                                        <Typography fontWeight="bold">{u.nombre}</Typography>

                                        {/* Email del usuario */}
                                        <Typography variant="body2">{u.email}</Typography>

                                        {/* Rol del usuario */}
                                        {usuario?.rol === "admin" && (
                                            <Typography variant="caption">{u.rol}</Typography>
                                        )}
                                    </Box>

                                    {/* Botones de editar y eliminar */}
                                    <Box sx={{ display: "flex", gap: 1, mt: 1.5, justifyContent: "center" }}>
                                        
                                        {/* Editar */}
                                        <IconButton aria-label="Editar usuario" onClick={() => { setUsuarioSeleccionado(u); setOpenEditar(true); }}>
                                            <EditIcon />
                                        </IconButton>

                                        {/* Borrar (si no es el usuario actual) */}
                                        {u.id !== usuario?.id && (
                                            <IconButton aria-label="Eliminar usuario" color="error" onClick={() => {
                                                if (window.confirm("¿Seguro que quieres eliminar este usuario?")) eliminarUsuario(u.id);
                                            }}>
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    )}
                </>
            )}
            
            {/* ── VISTA MÁQUINAS ── */}
            {vista === "maquinas" && (
                <>
                    <Paper sx={{ p: 2, mb: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", justifyContent: "center"}}>

                        {/* Filtro encargado */}
                        {usuario?.rol !== "encargado" && (
                            <TextField
                                select
                                label="Encargado"
                                value={filtroEncargado}
                                onChange={(e) => setFiltroEncargado(e.target.value)}
                                sx={{ minWidth: 160 }}
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {encargados.map(e => (
                                    <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>
                                ))}
                            </TextField>
                        )}

                        {/* Botón para crear nueva máquina */}
                        <Button variant="contained" onClick={abrirCrearMaquina}>
                            Nueva máquina
                        </Button>
                    </Paper>

                    {/* Lista de máquinas */}
                    {maquinas.length === 0 ? (
                        <Typography color="textSecondary">No hay máquinas registradas.</Typography>
                    ) : (
                        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                            {maquinas.map(m => (
                                <Paper key={m.id} sx={{ p: 2, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                    <Box>

                                        {/* ID de la máquina */}
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
                                                ID: {m.id}
                                            </Typography>
                                        </Box>

                                        {/* Nombre de la máquina */}
                                        <Typography fontWeight="bold" fontSize="large">{m.nombre}</Typography>

                                        {/* Descripción de la máquina */}
                                        <Typography>Descripcion: {m.descripcion}</Typography>

                                        {/* ID del encargado asociado */}
                                        {usuario?.rol === "admin" && (
                                            <Typography>ID Encargado: {m.id_encargado}</Typography>
                                        )}
                                    </Box>

                                    {/* Botones de editar y eliminar */}
                                    <Box sx={{ display: "flex", gap: 1, mt: 1.5, justifyContent: "center" }}>
                                        
                                        {/* Editar */}
                                        <IconButton color="primary" onClick={() => abrirEditarMaquina(m)}>
                                            <EditIcon />
                                        </IconButton>

                                        {/* Borrar */}
                                        <IconButton color="error" onClick={() => {
                                            if (window.confirm("¿Seguro que quieres eliminar esta máquina?")) eliminarMaquina(m.id);
                                        }}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    )}
                </>
            )}

            {/* Dialog crear usuario */}
            <Dialog open={openCrear} onClose={() => setOpenCrear(false)} fullWidth maxWidth="sm">
                <DialogContent>
                    <FormularioUsuario onSuccess={() => { setOpenCrear(false); obtenerUsuarios(); }} />
                </DialogContent>
            </Dialog>

            {/* Dialog editar usuario */}
            <Dialog open={openEditar} onClose={() => setOpenEditar(false)} fullWidth maxWidth="sm">
                <DialogContent>
                    {usuarioSeleccionado && (
                        <FormularioUsuario
                            usuarioEditar={usuarioSeleccionado}
                            modoEdicion={true}
                            onSuccess={() => { setOpenEditar(false); setUsuarioSeleccionado(null); obtenerUsuarios(); }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog crear/editar máquina */}
            <Dialog open={openDialogMaquina} onClose={() => setOpenDialogMaquina(false)} fullWidth maxWidth="sm">
                <DialogTitle>{modoEdicionMaquina ? "Modificar máquina" : "Nueva máquina"}</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
                    <TextField fullWidth label="Nombre" value={nuevaMaquina.nombre}
                        onChange={(e) => setNuevaMaquina({ ...nuevaMaquina, nombre: e.target.value })} />
                    
                    <TextField fullWidth label="Descripcion" value={nuevaMaquina.descripcion}
                        onChange={(e) => setNuevaMaquina({ ...nuevaMaquina, descripcion: e.target.value })} />

                    {usuario?.rol === "admin" && (
                        <TextField fullWidth label="ID Encargado" value={nuevaMaquina.id_encargado}
                            onChange={(e) => setNuevaMaquina({ ...nuevaMaquina, id_encargado: e.target.value })} />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialogMaquina(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={guardarMaquina}>
                        {modoEdicionMaquina ? "Guardar cambios" : "Crear"}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
  
};

export default Equipo;