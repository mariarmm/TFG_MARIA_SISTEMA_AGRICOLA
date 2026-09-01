import { useState } from "react";   //Importa useState para manejar el estado de los campos del formulario
import { apiFetch } from "../api";  //Función auxiliar para realizar peticiones al backend

//Componentes de Material UI
import { Container, TextField, Button, Typography, Box, Alert, InputAdornment, IconButton } from '@mui/material';

//Iconos de Material UI para mostrar u ocultar la contraseña
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const Login = () => {

    //Estados del formulario de login
        //email y contraseña almacenan datos que introduce el usuario
        //error almacena mensajes de error que se muestran al usuario
        //mostrarContrasenia controla si la contraseña se muestra o se oculta
    const [email, setEmail] = useState("");
    const [contrasenia, setContrasenia] = useState("");
    const [error, setError] = useState("");
    const [mostrarContrasenia, setMostrarContrasenia] = useState(false);

    //Gestiona el envío del formulario de inicio de sesión
    const handleSubmit = async (e) => {

        //Evita que el formulario recarge la página
        e.preventDefault();

        //Comprueba que los campos no estén vacíos
        if (!email.trim() || !contrasenia.trim()) {
            setError("Debes introducir el email y la contraseña");
            return;
        }

        try {

            //Petición al backend
            const res = await apiFetch("/autenticacion/login", {
                method: "POST",
                body: JSON.stringify({ email, contrasenia })
            });

            //Procesa respuesta
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Error en login");
                return;
            }

            // Guardar token y usuario
            localStorage.setItem("token", data.token);
            localStorage.setItem("usuario", JSON.stringify(data.usuario));


            //Redirección (trabajador a /tareas, encargado o administrador a /mapa)
            if(data.token){
                if(data.usuario.rol === "trabajador"){
                    window.location.href = "/tareas";
                }
                else{
                    window.location.href = "/mapa";
                }
            }
            
                

        } catch (err) {
            setError("Error de conexión");
        }
    };

    return (
        
        <Container maxWidth="xs">

            <Box sx={{marginTop: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {/* Título del formulario */}
                <Typography component="h1" variant="h5">Iniciar Sesión</Typography>

                {/* Si existe un error, muestra el error con un componente Alert de MUI */}
                {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}

                {/* Formulario de inicio de sesión */}
                <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>

                    {/* EMAIL */}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Email"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email} // CONEXIÓN CON EL ESTADO
                        onChange={(e) => setEmail(e.target.value)} // ACTUALIZACIÓN
                    />

                    {/* CONTRASEÑA */}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Contraseña"
                        type={mostrarContrasenia ? "text" : "password"}
                        value={contrasenia} // CONEXIÓN CON EL ESTADO
                        onChange={(e) => setContrasenia(e.target.value)} // ACTUALIZACIÓN

                        // Botón para mostrar o no la contraseña
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setMostrarContrasenia(!mostrarContrasenia)}
                                        edge="end"
                                    >
                                        {mostrarContrasenia ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    {/* BOTÓN PARA ENTRAR */}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Entrar
                    </Button>
                    
                </Box>
            </Box>
        </Container>
    );
};

export default Login;