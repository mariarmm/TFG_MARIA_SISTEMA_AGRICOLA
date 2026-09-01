import { useState } from "react";  //Importa useState para manejar el estado de los campos del formulario
import { apiFetch, manejarRespuesta } from "../api"; //Funciones auxiliares para realizar peticiones al backend

import { useParams, useNavigate } from "react-router-dom";

// Componentes de Material UI
import {Container,Paper,Typography,TextField,Button,Alert,Box, InputAdornment, IconButton} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const ActivacionCuenta = () => {

    //Estados del formulario de activación de cuenta
    const {token} = useParams();
    const navigate = useNavigate();

    const [contrasenia, setContrasenia] = useState("");
    const [repetirContrasenia, setRepetirContrasenia] = useState("");

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const [mostrarContrasenia1, setMostrarContrasenia1] = useState(false);
    const [mostrarContrasenia2, setMostrarContrasenia2] = useState(false);

    // Gestiona el envío del formulario de activación de cuenta
    const handleSubmit = async (e) => {

        //Evita que el formulario recarge la página
        e.preventDefault();

        setError("");
        setMensaje("");

        // Validaciones de los campos del formulario
        if(contrasenia != repetirContrasenia){
            return setError("Las contraseñas no coinciden");
        }
        if(contrasenia.length < 5 || contrasenia.length > 20){
            return setError("La contraseña debe tener entre 5 y 20 caracteres");
        }

        try{

            //Petición al backend para activar la cuenta
            const res = await apiFetch("/autenticacion/activar-cuenta", {
                method: "POST",
                body: JSON.stringify({
                    token,
                    contrasenia
                })
            });

            const data = await res.json();

            if(!res.ok){
                return setError(data.error || "Error al activar la cuenta");
            }

            setMensaje("Cuenta activada correctamente");

            // Redirige al login después de 2 segundos
            setTimeout(() => {
                navigate("/");
            }, 2000);
        }
        catch(error){
            console.log(error);
            setError("Error del servidor");
        }
    };


    return (

        <Container maxWidth="sm">
            <Paper
                elevation={4}
                sx={{
                    mt: 10,
                    p: 4,
                    borderRadius: 3
                }}
            > 

                {/* Título */}
                <Typography
                        variant="h4"
                        align="center"
                        gutterBottom
                >
                    Crear contraseña
                </Typography>

                {/* Subtítulo */}
                <Typography
                    variant="body1"
                    align="center"
                    sx={{ mb: 3 }}
                >
                    Introduce tu nueva contraseña para activar tu cuenta.
                </Typography>

                {/* Mensaje de error */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Mensaje de éxito */}
                {mensaje && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {mensaje}
                    </Alert>
                )}

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                >

                    {/* Campo de contraseña */}
                    <TextField
                        fullWidth
                        required
                        name="password"
                        label="Contraseña"
                        margin="normal"
                        type={mostrarContrasenia1 ? "text" : "password"}
                        value={contrasenia}
                        onChange={(e) => setContrasenia(e.target.value)}

                        // Botón para mostrar o no la contraseña
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setMostrarContrasenia1(!mostrarContrasenia1)}
                                        edge="end"
                                    >
                                        {mostrarContrasenia1 ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    {/* Campo de repetir contraseña */}
                    <TextField
                        fullWidth
                        required
                        name="password"
                        label="Repetir contraseña"
                        margin="normal"
                        type={mostrarContrasenia2 ? "text" : "password"}
                        value={repetirContrasenia}
                        onChange={(e) => setRepetirContrasenia(e.target.value)}


                        // Botón para mostrar o no la contraseña
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setMostrarContrasenia2(!mostrarContrasenia2)}
                                        edge="end"
                                    >
                                        {mostrarContrasenia2 ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    {/* Botón para guardar la contraseña */}
                    <Button
                        fullWidth
                        variant="contained"
                        type="submit"
                        sx={{ mt: 3 }}
                    >
                        Guardar contraseña
                    </Button>

                </Box>

            </Paper>

        </Container>
    );
};

export default ActivacionCuenta;