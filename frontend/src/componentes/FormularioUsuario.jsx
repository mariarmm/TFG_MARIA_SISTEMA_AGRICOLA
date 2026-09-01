import { use, useEffect, useState } from "react"; //Importa useState para manejar el estado de los campos del formulario
import { apiFetch, manejarRespuesta } from "../api"; //Funciones auxiliares para realizar peticiones al backend

// Componentes de Material UI
import {Container,TextField,Button,Typography,Box,Alert,MenuItem,Collapse} from "@mui/material";


const FormularioUsuario = ({ onSuccess, usuarioEditar = null, modoEdicion = false }) => {

    // Estados
    const [usuario, setUsuario] = useState(null);

    const [id, setId] = useState("");
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [rol, setRol] = useState("trabajador");
    const [id_encargado, setIdEncargado] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("usuario"));
        setUsuario(user);
    }, []);

    useEffect(() => {

        // Si es modo edición, rellena los campos con los datos del usuario a editar
        if(modoEdicion){
            setId(usuarioEditar.id || "");
            setNombre(usuarioEditar.nombre || "");
            setEmail(usuarioEditar.email || "");
            setRol(usuarioEditar.rol || "trabajador");
            setIdEncargado(usuarioEditar.id_encargado || "");
        }
        else{
            // Si no es modo edición, limpia los campos
            setId("");
            setNombre("");
            setEmail("");
            setRol("");
            setIdEncargado("");
        }
    }, [modoEdicion, usuarioEditar]);

    // Gestiona el envío del formulario de creación o edición de usuario
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("token");

            const metodo = modoEdicion ? "PATCH" : "POST";

            const url = modoEdicion
                ? `/usuarios/${usuarioEditar.id}`
                : `/usuarios/`;

            // Petición al backend para crear o editar usuario
            const res = await apiFetch(url, {
                method: metodo,
                body: JSON.stringify({
                    nombre,
                    email,
                    rol: usuario?.rol === "encargado" ? "trabajador" : rol,
                    id_encargado: usuario?.rol === "encargado"
                        ? usuario.id
                        : id_encargado ? Number(id_encargado) : null
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error");
                return;
            }

            setSuccess(modoEdicion ? "Usuario modificado correctamente" : "Usuario creado correctamente");

            // Limpiar
            setError("");
            setId("");
            setNombre("");
            setEmail("");
            setRol("trabajador");
            setIdEncargado("");

            if (onSuccess) onSuccess();

        } catch {
            setError("Error de conexión");
        }
    };

    return (
        <Container maxWidth="xs">
            <Box
                sx={{
                    mt: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1
                }}
            >

                {/* TÍTULO */}
                <Typography 
                  variant="h5" textAlign="center"> 
                    {modoEdicion
                        ? usuario?.rol === "encargado"
                            ? "Modificar trabajador"
                            : "Modificar usuario"
                        : usuario?.rol === "encargado"
                            ? "Nuevo trabajador"
                            : "Nuevo usuario"
                    }
                </Typography>

                {/* ERROR */}
                <Collapse in={!!error}>
                    <Alert severity="error">{error}</Alert>
                </Collapse>

                {/* Éxito */}
                <Collapse in={!!success}>
                    <Alert severity="success">{success}</Alert>
                </Collapse>

                {/* FORMULARIO */}
                <Box component="form" onSubmit={handleSubmit}>

                    {/* Nombre */}
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                    />

                    {/* Email */}
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    {/* SOLO ADMIN VE EL SELECT DE ROL (excepto el suyo) */}
                    {usuario?.rol === "admin" && usuario?.id !== id && (
                        <TextField
                            select
                            fullWidth
                            margin="normal"
                            label="Rol"
                            value={rol}
                            onChange={(e) => setRol(e.target.value)}
                        >
                            <MenuItem value="trabajador">Trabajador</MenuItem>
                            <MenuItem value="encargado">Encargado</MenuItem>
                            <MenuItem value="admin">Administrador</MenuItem>
                        </TextField>
                    )}

                    {/* ID Encargado (solo si es el usuario es un trabajador y el que crea/edita es admin) */}
                    {rol === "trabajador" && usuario?.rol === "admin" && (
                        <TextField
                            fullWidth
                            margin="normal"
                            aria-label="ID Encargado"
                            value={id_encargado}
                            onChange={(e) => setIdEncargado(e.target.value)}
                        />
                    )}

                    {/* Botón de envío */}
                    <Button
                        label = "guardar"
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2 }}
                    >
                        {modoEdicion 
                            ? "Guardar cambios"
                            : usuario?.rol === "encargado"
                                ? "Crear trabajador"
                                : "Crear usuario"
                        }
                    </Button>

                </Box>
            </Box>
        </Container>
    );
};

export default FormularioUsuario;