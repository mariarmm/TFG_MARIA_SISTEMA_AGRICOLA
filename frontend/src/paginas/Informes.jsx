import { useEffect, useState } from "react";    //Importa useEffect para manejar efectos secundarios y useState para manejar el estado de los campos del formulario
import { apiFetch } from "../api";  // Función auxiliar para realizar peticiones al backend

// Componentes de Material UI
import {Box,Button,TextField,Typography,Paper,Grid,Divider,CircularProgress,Card,CardContent, MenuItem} from "@mui/material";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";

const Informes = () => {

    //Estados
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState(null);
    const [observacion, setObservacion] = useState("");
    const [loading, setLoading] = useState(false);
    const [filtroEncargado, setFiltroEncargado] = useState("");
    const [usuario, setUsuario] = useState(null);
    const [encargados, setEncargados] = useState([]);

    const ORDEN_DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

    
    useEffect(() => {

        const user = JSON.parse(localStorage.getItem("usuario"));

        // Si no hay usuario logueado, redirigir a la página de inicio
        if (!user) { 
            window.location.href = "/"; 
            return; 
        }
        setUsuario(user);
    }, []);
  
    useEffect(() => {
        if (usuario){ 
          if(usuario.rol === "admin"){
            obtenerEncargados();
          }
          else{
            obtenerInforme();
          } 
        }
    }, [usuario]);

    // Función para obtener el informe desde el backend
    const obtenerInforme = async (pdf = false) => {

        setLoading(true);

        try{
            let url = `/informes?fecha=${fecha}`;

            if(usuario?.rol==="admin"){

              if(!filtroEncargado) {
                alert("Por favor, selecciona un encargado.");
                return;
              }

              url += `&id_encargado=${filtroEncargado}`;
            }

            if(pdf) url += `&pdf=true`;

            // Petición al backend para obtener el informe
            const res = await apiFetch(url);
        
            if (!res.ok) {
                console.error("Error al obtener el informe:", res.statusText);
                throw new Error("Error al obtener el informe");
            }

            // Si se solicita el PDF, se maneja la descarga o compartición del archivo
            if(pdf){
              const blob = await res.blob();

              if (Capacitor.isNativePlatform()) {
                
                  // En móvil: guardar en filesystem y compartir

                  const base64 = await new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result.split(",")[1]);
                      reader.onerror = reject;
                      reader.readAsDataURL(blob);
                  });

                  const fileName = `informe_${fecha}.pdf`;

                  await Filesystem.writeFile({
                      path: fileName,
                      data: base64,
                      directory: Directory.Cache
                  });

                  const fileUri = await Filesystem.getUri({
                      path: fileName,
                      directory: Directory.Cache
                  });

                  await Share.share({
                      title: "Informe semanal",
                      url: fileUri.uri,
                      dialogTitle: "Guardar o compartir informe"
                  });
              } 
              else {
                // En web: descargar el archivo

                const fileURL = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = fileURL;
                link.download = `informe_${fecha}.pdf`;

                document.body.appendChild(link);
                link.click();

                link.remove();
                window.URL.revokeObjectURL(fileURL);
              }
              return;
            }

            //JSON
            const resultado = await res.json();

            console.log("INFORME RECIBIDO:", resultado);

            setData(resultado);
            setObservacion(resultado.observacion || "");            
        } catch (error) {
            console.error("Error al obtener el informe:", error);
        } 
        //Se ejecuta siempre
        finally {
            setLoading(false);
        }
    };

    // Función para obtener la lista de encargados desde el backend
    const obtenerEncargados = async () => {
        try {
            const token = localStorage.getItem("token");

            // Petición al backend para obtener la lista de encargados
            const res = await apiFetch("/usuarios?rol=encargado");

            if (!res.ok) throw new Error();

            const data = await res.json();

            setEncargados(data);

        } catch (err) {
            console.log(err);
        }
    };

    // Función para guardar la observación en el backend
    const guardarObservacion = async () => {

        try{        
            // Petición al backend para guardar la observación
            const res = await apiFetch("/informes/observacion", {
              method: "PATCH",
              body: JSON.stringify({ 
                fecha, 
                id_encargado: usuario?.rol === "admin" ? filtroEncargado : usuario.id,
                observacion
              })
            });

            if (!res.ok) throw new Error();

            obtenerInforme();
        } catch (error) {
            console.error("Error al guardar la observación:", error);
        }
    };

    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, margin: "0 auto"}}>

        {/* Título */}
        <Typography variant="h4" gutterBottom>
          Informe semanal
        </Typography>

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>

          <Box
              sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  alignItems: "center",
                  justifyContent: "center"
              }}
          >

              {/* Filtro de fecha */}
              <TextField
                type="date"
                label="Fecha"
                InputLabelProps={{ shrink: true }}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                sx={{ width: { xs: "100%", sm: 220 } }}
              />

              {/* Filtro de encargados */}
              {usuario?.rol === "admin" && (
                <TextField
                    select
                    label="Encargado"
                    value={filtroEncargado}
                    onChange={(e) => setFiltroEncargado(e.target.value)}
                    sx={{ width: { xs: "100%", sm: 220 } }}
                >
                    {encargados.map((encargado) => (
                        <MenuItem
                            key={encargado.id}
                            value={encargado.id}
                        >
                            {encargado.nombre}
                        </MenuItem>
                    ))}
                </TextField>
              )}

               {/* Botón para cargar informe*/}
                <Button variant="contained" onClick={() => obtenerInforme(false)}>
                    Cargar informe
                </Button>

               {/* Botón para descargar PDF */}
                <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => obtenerInforme(true)}
                >
                    Descargar PDF
                </Button>

                {/* Símbolo de cargando */}
                {loading && (
                    <CircularProgress size={24} />
                )}
          </Box>
        </Paper>


        {/* Informe */}
        {data && (
          <>
            {/* CABECERA */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6">
                Semana:{" "}
                {new Date(data.semana.lunes).toLocaleDateString()} -{" "}
                {new Date(data.semana.domingo).toLocaleDateString()}
              </Typography>

              <Typography variant="body2">
                Encargado ID: {data.encargado}
              </Typography>
            </Paper>

            {/* DETALLE */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Detalle semanal
            </Typography>


            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: {
                        xs: "1fr",              // móvil: 1 columna
                        sm: "repeat(2, 1fr)",   // tablet: 2 columnas
                        md: "repeat(4, 1fr)"    // desktop: 4 columnas
                    },
                    mb: 3
                }}
            >
          
              {Object.entries(data.informe)
                .sort(([diaA], [diaB]) => ORDEN_DIAS.indexOf(diaA) - ORDEN_DIAS.indexOf(diaB))
                .map(([dia, trabajadores]) => (
                    <Card variant="outlined" key={dia} sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
                        <CardContent sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                                {dia.charAt(0).toUpperCase() + dia.slice(1)}
                            </Typography>

                            <Divider sx={{ mb: 2 }} />

                            {trabajadores && Object.entries(trabajadores).map(([nombre, info]) => (
                            
                                <Box key={nombre} sx={{ mb: 2 }}>
                                    <Typography variant="h6" fontWeight="bold" fontSize="large">
                                        {nombre}
                                    </Typography>

                                    <Typography>
                                        Horas: {parseFloat(info.horas).toFixed(2)}
                                    </Typography>

                                    {info.tareas.length > 0 && (
                                        <>
                                            <Typography variant="body1" sx={{ mt: 1 }}>
                                                Tareas realizadas:
                                            </Typography>

                                            <Box
                                                component="ul"
                                                sx={{
                                                    mt: 0.5,
                                                    mb: 0,
                                                    pl: 2,
                                                }}
                                            >
                                                {info.tareas.map((t, i) => (
                                                    <Box
                                                        component="li"
                                                        key={i}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: 1,
                                                            mb: 0.5,
                                                            listStyle: 'none',
                                                        }}
                                                    >
                                                        {/* Punto */}
                                                        <Box
                                                            sx={{
                                                                width: 5,
                                                                height: 5,
                                                                backgroundColor: 'currentColor',
                                                                mt: '8px',
                                                                flexShrink: 0,
                                                            }}
                                                        />

                                                        <Box>
                                                            {/* Nombre y descripción */}
                                                            <Typography variant="body1">
                                                                <strong>{t.nombre}</strong>: {t.descripcion}
                                                            </Typography>

                                                            {/* Máquina y duración */}
                                                            {t.sesiones?.map((s, j) => (
                                                                <Typography
                                                                    key={j}
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                    sx={{ mt: 0.3 }}
                                                                >
                                                                    Máquina: {s.maquina || "No especificada"}
                                                                    {" · "}
                                                                    Duración:{" "}
                                                                    {parseFloat(s.duracion).toFixed(2)} h
                                                                </Typography>
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                ))}

                                            </Box>
                                        </>
                                    )}
                                </Box>
                            ))}

                            {(!trabajadores || Object.keys(trabajadores).length === 0) && (
                                <Typography variant="body2" color="text.secondary">
                                    Sin actividad registrada
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                ))
              }

            </Box>

            {/* OBSERVACIONES */}
            <Paper sx={{ p: 2, mb: 3 }}>

              <Typography variant="h6" gutterBottom>
                Observaciones
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
              />

              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={guardarObservacion}
              >
                Guardar
              </Button>
            </Paper>

          </>
        )}

      </Box>
    );
};

export default Informes;