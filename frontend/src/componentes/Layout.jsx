import { useState } from "react"; //Importa useState para manejar el estado de los campos del formulario
import { apiFetch, manejarRespuesta } from "../api"; //Funciones auxiliares para realizar peticiones al backend

// Componentes de Material UI
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem } from "@mui/material";
import { Badge, IconButton, Popover, List, ListItem, ListItemText } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import LogoutIcon from '@mui/icons-material/Logout';
import MapOutlined from "@mui/icons-material/Map";
import ChecklistIcon from "@mui/icons-material/Checklist";
import GroupIcon from "@mui/icons-material/Group";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LandscapeIcon from "@mui/icons-material/Landscape";
import NotificationsIcon from "@mui/icons-material/Notifications";

import { useTranslation } from "react-i18next";
import { Outlet, useNavigate } from "react-router-dom";

// Importa el componente Notificaciones para manejar las notificaciones del usuario
import Notificaciones from "./Notificaciones";


const Layout = () => {

    const navigate = useNavigate();
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const { i18n, t } = useTranslation();

    const [anchorEl, setAnchorEl] = useState(null);
    const { notificaciones, hayNuevas, marcarVistas } = Notificaciones();
    const [anchorNotif, setAnchorNotif] = useState(null);

    // Cierra la sesión del usuario, eliminando el token de FCM y limpiando el localStorage
    const cerrarSesion = async () => {

        const fcm_token = localStorage.getItem("fcm_token");
        console.log("FCM TOKEN:", localStorage.getItem("fcm_token"));

        try {
            // Avisar al backend para borrar token FCM
            if (fcm_token) {
                const res = await apiFetch(`/tokens-notificaciones/${fcm_token}`, {
                    method: "DELETE",
                });
                await manejarRespuesta(res);
            }
        } catch (err) {
            console.error("Error borrando token FCM:", err);
        }

        //Limpia storage y redirige a login
        localStorage.clear();
        navigate("/");
    };

    const abrirMenuIdioma = (event) => {setAnchorEl(event.currentTarget);};
    const cerrarMenuIdioma = () => setAnchorEl(null);

    const cambiarIdioma = (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem("lang", lang);
        cerrarMenuIdioma();
    };

    const abrirNotificaciones = (e) => {
        setAnchorNotif(e.currentTarget);
        marcarVistas();
    };

    const cerrarNotificaciones = () => setAnchorNotif(null);

    return (
        <Box
            sx={{
                height: "100vh",
                width: "100vw",
                display: "flex",
                flexDirection: "column",
                margin: 0,
                padding: 0,
                overflow: "hidden",
                position: "fixed", 
                top: 0,
                left: 0,
            }}
        >

            {/* HEADER */}
            <AppBar position="static">
                <Toolbar>

                    {/* Botón para seleccionar el idioma (solo para trabajadores) */}
                    {usuario?.rol === "trabajador" && (
                        <>
                            <Button color="inherit" startIcon={<LanguageIcon />} onClick={abrirMenuIdioma}>
                                {t("idioma")}
                            </Button>

                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={cerrarMenuIdioma}
                            >
                                <MenuItem onClick={() => cambiarIdioma("es")}>{t("español")}</MenuItem>

                                <MenuItem onClick={() => cambiarIdioma("en")}>{t("ingles")}</MenuItem>

                                <MenuItem onClick={() => cambiarIdioma("ro")}>{t("rumano")}</MenuItem>

                                <MenuItem onClick={() => cambiarIdioma("ar")}>{t("arabe")}</MenuItem>
                            </Menu>
                        </>
                    )}

                    {/* Espaciador intermedio */}
                    <Box sx={{ flexGrow: 1 }} />

                    {/* Botón de notificaciones (solo trabajadores) */}
                    {usuario?.rol === "trabajador" && (
                        <>
                            <IconButton aria-label="Notificaciones" color="inherit" onClick={abrirNotificaciones}>
                                <Badge color="error" variant="dot" invisible={!hayNuevas}>
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>

                            <Popover
                                open={Boolean(anchorNotif)}
                                anchorEl={anchorNotif}
                                onClose={cerrarNotificaciones}
                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                transformOrigin={{ vertical: "top", horizontal: "right" }}
                            >
                                <List sx={{ width: 300, maxHeight: 400, overflow: "auto" }}>
                                    {notificaciones.length === 0 ? (
                                        <ListItem>
                                            <ListItemText primary="No hay notificaciones" />
                                        </ListItem>
                                    ) : (
                                        notificaciones.map((n) => (
                                            <ListItem key={n.id} divider>
                                                <ListItemText
                                                    primary={n.mensaje}
                                                    secondary={new Date(n.fecha).toLocaleString()}
                                                />
                                            </ListItem>
                                        ))
                                    )}
                                </List>
                            </Popover>
                        </>
                    )}

                    {/* Botón de cerrar sesión */}
                    <Button aria-label="cerrar_sesion" startIcon={<LogoutIcon />} color="inherit" onClick={cerrarSesion}></Button>
                </Toolbar>
            </AppBar>

            {/* CONTENIDO DINÁMICO */}
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    minHeight: 0,
                    width: "100%",
                    minWidth: 0,
                    overflow: "auto"
                }}
            >
                <Box sx={{ width: "100%", minWidth: 0 }}> 
                    <Outlet />
                </Box>
            </Box>


            {/* FOOTER */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-around",
                    p: 2,
                    borderTop: "1px solid #ddd",
                    backgroundColor: "white",
                    flexShrink: 0,  // evita que el footer se comprima
                }}
            >
            
                {/* Botones de navegación (excepto para trabajadores) */}
                {usuario?.rol !== "trabajador" && (
                    <>
                        <Button aria-label="Tareas" startIcon={<ChecklistIcon />} onClick={() => navigate("/tareas")}></Button>
                        <Button aria-label="Equipo" startIcon={<GroupIcon />} onClick={() => navigate("/equipo")}></Button>
                        <Button aria-label="Mapa" startIcon={<MapOutlined />} onClick={() => navigate("/mapa")}></Button>
                        <Button aria-label="Parcelas" startIcon={<LandscapeIcon />} onClick={() => navigate("/parcelas")}></Button>
                        <Button aria-label="Informes" startIcon={<AssessmentIcon />} onClick={() => navigate("/informes")}></Button>
                    </>
                )}
            </Box>
        </Box>
    );
};

export default Layout;